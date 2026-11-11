// Tests for the site guard (netlify/guard/) and the set-up around it.
//
// Run with:  npm test
//
// They drive the real guard with simulated visitors, against a local copy of
// the Netlify Blobs service (shipped inside @netlify/blobs), with a clock the
// tests control.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, beforeEach, test } from "node:test";
import { fileURLToPath } from "node:url";

// Must be set before @netlify/blobs loads: it makes that library retry a failed
// call after 1ms instead of 5s, so the "storage is down" tests finish quickly.
process.env.NODE_ENV = "test";
const { getStore } = await import("@netlify/blobs");
const { BlobsServer } = await import("@netlify/blobs/server");
const { default: photoVariants } = await import("../netlify/guard/photo-variants.js");
const { createGuard } = await import("../netlify/guard/guard.js");
const { SECURITY_HEADERS } = await import("../netlify/guard/settings.js");

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PAGE = readFileSync(join(ROOT, "index.html"), "utf8");
const BROWSER = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const SECOND = 1000;

// ---- Test world -------------------------------------------------------------

const realNow = Date.now;
const realRandom = Math.random;
const realConsole = { log: console.log, warn: console.warn, error: console.error };
const clock = { now: 0 };
const operations = { set: 0, list: 0, delete: 0, get: 0, getMetadata: 0 };
const logs = [];
let blobs;
let blobsDirectory;
let blobsPort;
let siteCounter = 0;
let visitorCounter = 0;

before(async () => {
  blobsDirectory = mkdtempSync(join(tmpdir(), "busy-mode-blobs-"));
  blobs = new BlobsServer({
    directory: blobsDirectory,
    token: "test-token",
    onRequest: ({ type }) => {
      operations[type] += 1;
    },
  });
  blobsPort = (await blobs.start()).port;
});

after(async () => {
  Date.now = realNow;
  Math.random = realRandom;
  Object.assign(console, realConsole);
  await blobs.stop();
  rmSync(blobsDirectory, { recursive: true, force: true });
});

beforeEach(() => {
  clock.now = Date.UTC(2026, 10, 10, 18, 0, 10); // a fixed moment, 10s into a two-minute slot
  Date.now = () => clock.now;
  Math.random = () => 0.99; // never run the clean-up, unless a test asks for it
  logs.length = 0;
  for (const level of ["log", "warn", "error"]) console[level] = (...args) => logs.push([level, args.join(" ")]);
  for (const type of Object.keys(operations)) operations[type] = 0;
  useStore(blobsPort); // each test gets its own, empty visitor record
});

// Points the function's storage at a server (fresh site id = empty store).
function useStore(port, { strong = true } = {}) {
  const url = `http://localhost:${port}`;
  const context = { edgeURL: url, token: "test-token", siteID: `site-${++siteCounter}`, deployID: "deploy", primaryRegion: "us-east-2" };
  if (strong) context.uncachedEdgeURL = url;
  globalThis.netlifyBlobsContext = Buffer.from(JSON.stringify(context)).toString("base64");
}

// A guard with its own memory, like a separate Netlify instance.
const newInstance = () => createGuard();

function newVisitor(ip = `198.51.100.${1 + (visitorCounter++ % 200)}`) {
  return { ip, cookie: null, agent: BROWSER };
}

// One page load. Returns what the visitor's browser would get.
async function visit(handler, visitor, { path = "/", headers = {}, origin } = {}) {
  const background = [];
  const requestHeaders = new Headers({ "user-agent": visitor.agent, ...headers });
  if (visitor.agent === "") requestHeaders.delete("user-agent");
  if (visitor.cookie) requestHeaders.set("cookie", `theme=dark; hm_visitor=${visitor.cookie}`);
  const context = {
    ip: visitor.ip,
    waitUntil: (promise) => background.push(promise),
    next: async () =>
      origin ? origin() : new Response(PAGE, { headers: { "content-type": "text/html; charset=UTF-8", etag: '"page-v1"' } }),
  };
  const response = await handler(new Request(`https://horizon.example${path}`, { headers: requestHeaders }), context);
  await Promise.all(background);
  if (response === undefined) return { passedThrough: true };

  const setCookie = response.headers.get("set-cookie");
  const issued = /hm_visitor=([0-9a-f]{16})/.exec(setCookie || "");
  if (issued) visitor.cookie = issued[1];
  const body = await response.text();
  return {
    status: response.status,
    mode: response.headers.get("x-busy-mode"),
    visitors: response.headers.get("x-busy-visitors"),
    headers: response.headers,
    setCookie,
    body,
    photos: [...body.matchAll(/(?:src="|url\(')(img\/[^"')]+)/g)].map((match) => match[1]),
  };
}

// `count` first-time visitors, one after another. Returns their replies.
async function crowd(handler, count) {
  const replies = [];
  for (let i = 0; i < count; i++) replies.push(await visit(handler, newVisitor(`203.0.113.${(i % 250) + 1}`)));
  return replies;
}

const recordedVisits = async () => (await getStore("site-guard").list()).blobs.map(({ key }) => key);
const ALL_PAGES = PAGE + readFileSync(join(ROOT, "portfolio.html"), "utf8");
const pagePhotos = [...new Set([...ALL_PAGES.matchAll(/(?:\s(?:src|data-full)="|url\(')(img\/[^"')]+\.jpe?g)/g)].map((match) => match[1]))].filter((path) => !path.includes("/thumb/"));

// ---- The user's rule: more than 10 at once -> smaller photos ----------------

test("the first 10 visitors get the normal page, the 11th and later get small photos", async () => {
  const handler = newInstance();
  const replies = await crowd(handler, 12);

  for (const [index, reply] of replies.slice(0, 10).entries()) {
    assert.equal(reply.mode, "off", `visitor ${index + 1}`);
    assert.equal(reply.visitors, String(index + 1));
    assert.equal(reply.body, PAGE, "the normal page is passed through untouched");
    assert.equal(reply.headers.get("etag"), '"page-v1"', "and stays cacheable");
  }
  for (const reply of replies.slice(10)) {
    assert.equal(reply.mode, "lite");
    assert.ok(reply.photos.length >= 8, "the page still shows all its photos");
    assert.ok(reply.photos.every((photo) => photo.startsWith("img/lite/")), `all photos are small copies: ${reply.photos}`);
    assert.match(reply.body, /<html data-busy="lite" lang="en">/);
    assert.equal(reply.headers.get("cache-control"), "no-store", "a busy page is never cached");
    assert.equal(reply.headers.get("etag"), null);
  }
  assert.equal(replies[10].visitors, "11");
  assert.ok(logs.some(([, line]) => line.includes("busy mode off -> lite (11 visitors")), "the switch is logged");
});

test("more than 30 visitors get the smallest photos", async () => {
  const handler = newInstance();
  const replies = await crowd(handler, 32);

  assert.equal(replies[29].mode, "lite");
  assert.equal(replies[30].mode, "saver");
  assert.equal(replies[30].visitors, "31+");
  assert.ok(replies[31].photos.every((photo) => photo.startsWith("img/saver/")), `${replies[31].photos}`);
  assert.match(replies[31].body, /<html data-busy="saver" lang="en">/);
});

test("the smaller pages only differ from the normal page in their photo paths", async () => {
  const handler = newInstance();
  const replies = await crowd(handler, 31);
  for (const reply of [replies[10], replies[30]]) {
    const restored = reply.body.replace(/ data-busy="\w+"/, "").replace(/img\/(lite|saver)\//g, "img/");
    assert.equal(restored, PAGE);
    assert.ok(reply.body.includes("img/og-image.jpg"), "the link-preview image is left alone");
    assert.ok(reply.body.includes('href="img/favicon.png"'), "icons are left alone");
  }
});

test("someone reloading the page counts once", async () => {
  const handler = newInstance();
  const visitor = newVisitor();
  const first = await visit(handler, visitor);
  assert.match(first.setCookie, /^hm_visitor=[0-9a-f]{16}; Max-Age=1800; Path=\/; Secure; HttpOnly; SameSite=Lax$/);

  for (let i = 0; i < 25; i++) {
    clock.now += 2 * SECOND;
    const reply = await visit(handler, visitor);
    assert.equal(reply.mode, "off");
    assert.equal(reply.visitors, "1");
    assert.equal(reply.setCookie, null, "the cookie is only set once");
  }
});

test("many phones on one network (same address, same browser) each count", async () => {
  const handler = newInstance();
  let reply;
  for (let i = 0; i < 11; i++) reply = await visit(handler, newVisitor("192.0.2.10"));
  assert.equal(reply.visitors, "11");
  assert.equal(reply.mode, "lite");
});

test("busy mode steps back down as visitors leave, without flickering", async () => {
  const handler = newInstance();
  const early = [newVisitor(), newVisitor()];
  for (const visitor of early) await visit(handler, visitor);

  clock.now += 60 * SECOND;
  const later = Array.from({ length: 9 }, () => newVisitor());
  let reply;
  for (const visitor of later) reply = await visit(handler, visitor);
  assert.equal(reply.mode, "lite");
  assert.equal(reply.visitors, "11");

  // 65s later the two early visitors have been gone over two minutes: 9 remain.
  clock.now += 65 * SECOND;
  reply = await visit(handler, later[0]);
  assert.equal(reply.visitors, "9");
  assert.equal(reply.mode, "lite", "9 is inside the margin, so it stays on");

  // Another minute on, only the one who just reloaded is left.
  clock.now += 60 * SECOND;
  reply = await visit(handler, later[1]);
  assert.equal(reply.visitors, "2");
  assert.equal(reply.mode, "off");
  assert.equal(reply.body, PAGE);
  assert.ok(logs.some(([, line]) => line.includes("lite -> off")));
});

test("a fresh instance with 9 visitors does not switch on (the margin only holds a mode that is already on)", async () => {
  const handler = newInstance();
  const replies = await crowd(handler, 9);
  assert.ok(replies.every((reply) => reply.mode === "off"));
});

// ---- Several instances share one count --------------------------------------

test("instances share the visitor count through the store", async () => {
  const [first, second] = [newInstance(), newInstance()];
  const regular = newVisitor();
  await visit(first, regular);
  await crowd(first, 5);

  const replies = await crowd(second, 5);
  assert.equal(replies[4].visitors, "11", "6 seen by the first instance + 5 by the second");
  assert.equal(replies[4].mode, "lite");

  clock.now += 6 * SECOND; // past the first instance's refresh interval
  const reply = await visit(first, regular);
  assert.equal(reply.visitors, "11");
  assert.equal(reply.mode, "lite");
});

test("old visit records are cleaned out of the store", async () => {
  const handler = newInstance();
  await crowd(handler, 3);
  assert.equal((await recordedVisits()).length, 3);

  clock.now += 10 * 60 * SECOND;
  Math.random = () => 0; // this recording also tidies up
  await visit(handler, newVisitor());
  const left = await recordedVisits();
  assert.equal(left.length, 1, `only the new visit remains: ${left}`);
  assert.equal(operations.delete, 3);
});

// ---- Floods -----------------------------------------------------------------

test("a flood from thousands of addresses costs a fixed, small amount of storage work", async () => {
  const handler = newInstance();
  let reply;
  for (let i = 0; i < 2000; i++) {
    reply = await visit(handler, { ip: `10.${i >> 8}.${i & 255}.7`, cookie: null, agent: BROWSER });
  }
  assert.equal(reply.mode, "saver");
  assert.equal(reply.visitors, "31+");
  assert.equal(operations.set, 31, "it stops recording once the top mode is certain");
  assert.ok(operations.list <= 2, `lists: ${operations.list}`);

  // The flood continues for another two minutes: recording stays a trickle.
  for (let i = 0; i < 2400; i++) {
    clock.now += 50; // 20 requests a second
    reply = await visit(handler, { ip: `10.${i >> 8}.${i & 255}.8`, cookie: null, agent: BROWSER });
    assert.equal(reply.mode, "saver", `request ${i} of the sustained flood`);
  }
  assert.ok(operations.set <= 31 + 32, `writes: ${operations.set}`);
  assert.ok(operations.list <= 2 + 2 * 24, `lists: ${operations.list}`);
  assert.ok((await recordedVisits()).length <= 64);
});

test("one address hammering the page is cut off with a tiny reply", async () => {
  const handler = newInstance();
  const attacker = { ip: "192.0.2.66", cookie: null, agent: BROWSER };
  for (let i = 0; i < 300; i++) {
    const reply = await visit(handler, { ...attacker });
    assert.equal(reply.status, 200, `load ${i + 1} is allowed`);
  }
  const writesBefore = operations.set;
  for (let i = 0; i < 50; i++) {
    const refused = await visit(handler, { ...attacker });
    assert.equal(refused.status, 429);
    assert.equal(refused.headers.get("retry-after"), "60");
    assert.equal(refused.mode, "timeout");
    assert.ok(refused.body.length < 1500, `the refusal is tiny compared with the 48 KB page: ${refused.body.length} bytes`);
    assert.match(refused.body, /<h1>Timeout<\/h1>/);
    assert.match(refused.body, /http-equiv="refresh" content="60"/, "it reloads by itself after the minute");
    assert.ok(!/(src|href)="(?!")/.test(refused.body), "and loads nothing else");
  }
  assert.equal(operations.set, writesBefore, "refused loads do no storage work");
  assert.equal(logs.filter(([level, line]) => level === "warn" && line.includes("192.0.2.66")).length, 1, "logged once, with the address");

  assert.equal((await visit(handler, newVisitor("192.0.2.67"))).status, 200, "other addresses are unaffected");
  clock.now += 60 * SECOND;
  assert.equal((await visit(handler, { ...attacker })).status, 200, "and the limit resets after a minute");
});

test("IPv6 addresses are limited per network, not per address", async () => {
  const handler = newInstance();
  for (let i = 0; i < 300; i++) {
    await visit(handler, { ip: `2001:db8:12:34::${(i + 1).toString(16)}`, cookie: null, agent: BROWSER });
  }
  assert.equal((await visit(handler, newVisitor("2001:db8:12:34:aaaa:bbbb:cccc:dddd"))).status, 429);
  assert.equal((await visit(handler, newVisitor("2001:db8:12:35::1"))).status, 200);
});

// ---- Who is not counted -----------------------------------------------------

test("search engines and link-preview bots get the normal page and are not counted", async () => {
  const handler = newInstance();
  const bots = [
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0",
    "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
    "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
    "WhatsApp/2.23.20.0 A",
    "curl/8.5.0",
    "python-requests/2.32.0",
    "",
  ];
  for (let round = 0; round < 3; round++) {
    for (const agent of bots) {
      const reply = await visit(handler, { ip: "192.0.2.5", cookie: null, agent });
      assert.ok(reply.passedThrough, `"${agent}" is handed straight to the normal page`);
    }
  }
  assert.equal(operations.set + operations.list, 0, "bots cause no storage work");
  assert.equal((await visit(handler, newVisitor())).visitors, "1");
});

test("real phone and in-app browsers are counted", async () => {
  const handler = newInstance();
  const agents = [
    BROWSER,
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22G86 Instagram 390.0.0.28.85 (iPhone15,3; iOS 18_6; en_US; en; scale=3.00; 1290x2796; 766432123) NW/3",
    "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0",
    "Mozilla/5.0 (Linux; Android 14; SM-S918U Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/140.0.0.0 Mobile Safari/537.36 Snapchat/13.60.0.50 (SM-S918U; Android 14#S918USQS4CXK1#34; gzip) V/MUSHROOM",
  ];
  let reply;
  for (const agent of agents) reply = await visit(handler, { ip: "192.0.2.9", cookie: null, agent });
  assert.equal(reply.visitors, String(agents.length));
});

test("a browser pre-loading the page is not counted", async () => {
  const handler = newInstance();
  await crowd(handler, 2);
  for (const headers of [{ "sec-purpose": "prefetch;prerender" }, { purpose: "prefetch" }, { "x-purpose": "preview" }, { "x-moz": "prefetch" }]) {
    const reply = await visit(handler, newVisitor(), { headers });
    assert.equal(reply.visitors, "2");
    assert.equal(reply.setCookie, null);
  }
  assert.equal((await recordedVisits()).length, 2);
});

test("other request methods are left alone", async () => {
  const handler = newInstance();
  const response = await handler(new Request("https://horizon.example/", { method: "HEAD", headers: { "user-agent": BROWSER } }), { ip: "192.0.2.1" });
  assert.equal(response, undefined);
});

// ---- Preview links ----------------------------------------------------------

test("?busy=lite and ?busy=saver preview a mode without counting as a visit", async () => {
  const handler = newInstance();
  const lite = await visit(handler, newVisitor(), { path: "/?busy=lite" });
  assert.equal(lite.mode, "lite (preview)");
  assert.ok(lite.photos.every((photo) => photo.startsWith("img/lite/")));
  assert.equal(lite.headers.get("cache-control"), "no-store");

  const saver = await visit(handler, newVisitor(), { path: "/index.html?busy=saver" });
  assert.equal(saver.mode, "saver (preview)");
  assert.ok(saver.photos.every((photo) => photo.startsWith("img/saver/")));

  const off = await visit(handler, newVisitor(), { path: "/?busy=off" });
  assert.equal(off.body, PAGE);
  assert.equal((await visit(handler, newVisitor(), { path: "/?busy=nonsense" })).visitors, "1", "an unknown value is an ordinary visit");
  assert.equal(lite.setCookie ?? saver.setCookie ?? off.setCookie, null);
});

// ---- Photos -----------------------------------------------------------------

test("a photo without smaller copies keeps its full-size version instead of breaking", async () => {
  const handler = newInstance();
  const withNewPhoto = PAGE.replace("</body>", '<img src="img/brand-new.jpg" alt=""><div style="background-image: url(img/also-new.jpg)"></div></body>');
  assert.notEqual(withNewPhoto, PAGE);
  const origin = () => new Response(withNewPhoto, { headers: { "content-type": "text/html" } });
  const reply = await visit(handler, newVisitor(), { path: "/?busy=saver", origin });
  assert.ok(reply.body.includes('src="img/brand-new.jpg"'));
  assert.ok(reply.body.includes("url(img/also-new.jpg)"));
  assert.ok(reply.body.includes('src="img/saver/game-day.jpg"'));
});

test("the smallest mode falls back to the small copy when a photo has no smallest one", async (t) => {
  const handler = newInstance();
  const entry = photoVariants["img/game-day.jpg"];
  const { saver } = entry;
  delete entry.saver;
  t.after(() => {
    entry.saver = saver;
  });
  const reply = await visit(handler, newVisitor(), { path: "/?busy=saver" });
  assert.ok(reply.body.includes('src="img/lite/game-day.jpg"'));
  assert.ok(reply.body.includes('src="img/saver/soccer-kick.jpg"'));
});

test("every photo on the page has up-to-date watermarked copies made from an original in photos/", () => {
  const hint = "run: python3 tools/make_photo_variants.py";
  assert.ok(pagePhotos.length >= 8, `found the page's photos: ${pagePhotos}`);
  assert.ok(pagePhotos.includes("img/hero-sunset.jpg"), "including the hero photo");
  for (const photo of pagePhotos) {
    const entry = photoVariants[photo];
    assert.ok(entry, `${photo} has no smaller copies (${hint})`);
    const original = join(ROOT, "photos", photo.slice("img/".length));
    assert.ok(existsSync(original), `${photo} has no original in photos/ (${hint})`);
    assert.equal(entry.source, createHash("sha256").update(readFileSync(original)).digest("hex").slice(0, 16), `${photo}'s original changed since its copies were made (${hint})`);
    let previous = statSync(join(ROOT, photo)).size;
    for (const level of ["lite", "saver"]) {
      assert.ok(existsSync(join(ROOT, entry[level])), `${entry[level]} is missing (${hint})`);
      const size = statSync(join(ROOT, entry[level])).size;
      assert.ok(size < previous, `${entry[level]} (${size} bytes) is smaller than the size above it (${previous})`);
      previous = size;
    }
  }
  for (const photo of Object.keys(photoVariants)) {
    if (photo.includes("/thumb/")) continue; // grid thumbnails are listed too, with no busy-mode copies
    assert.ok(pagePhotos.includes(photo), `${photo} is listed but not on the page (${hint})`);
  }
});

// ---- When things go wrong ---------------------------------------------------

test("a reply that is not the page (for example 'not modified') is passed on as it is", async () => {
  const handler = newInstance();
  await crowd(handler, 11);
  const origin = () => new Response(null, { status: 304, headers: { etag: '"page-v1"' } });
  const reply = await visit(handler, newVisitor(), { origin });
  assert.equal(reply.status, 304);
  assert.equal(reply.body, "");
  assert.equal(reply.headers.get("etag"), '"page-v1"');
  assert.equal(reply.mode, "lite");
  assert.match(reply.setCookie, /^hm_visitor=/);
});

test("if the store is unreachable the page is still served, and counting carries on in memory", async () => {
  useStore(1); // nothing listens on port 1
  const handler = newInstance();
  const replies = await crowd(handler, 11);
  assert.equal(replies[0].status, 200);
  assert.equal(replies[0].body, PAGE);
  assert.equal(replies[10].mode, "lite");
  assert.equal(logs.filter(([level, line]) => level === "error" && line.includes("shared visitor record unavailable")).length, 1, "reported once, not on every request");
});

test("if the store hangs, the page waits at most a moment for it", async () => {
  const sockets = new Set();
  const hanging = net.createServer((socket) => {
    sockets.add(socket);
    socket.on("error", () => {});
  });
  await new Promise((resolve) => hanging.listen(0, resolve));
  useStore(hanging.address().port);
  const handler = newInstance();

  const background = [];
  const started = performance.now();
  const response = await handler(new Request("https://horizon.example/", { headers: { "user-agent": BROWSER } }), {
    ip: "192.0.2.1",
    waitUntil: (promise) => background.push(promise),
    next: async () => new Response(PAGE, { headers: { "content-type": "text/html" } }),
  });
  const waited = performance.now() - started;
  assert.equal(response.status, 200);
  assert.equal(await response.text(), PAGE);
  assert.ok(waited < 1500, `waited ${Math.round(waited)}ms`);

  const closed = new Promise((resolve) => hanging.close(resolve)); // refuse new connections...
  for (const socket of sockets) socket.destroy(); // ...and drop the stuck ones
  await closed;
  await Promise.all(background); // the abandoned storage calls fail quietly
});

test("without up-to-the-second reads it falls back to the default ones", async () => {
  useStore(blobsPort, { strong: false });
  const handler = newInstance();
  const replies = await crowd(handler, 11);
  assert.equal(replies[10].mode, "lite");
  assert.equal((await recordedVisits()).length, 11);
  assert.equal(logs.filter(([level]) => level === "error").length, 0);
});

// ---- Netlify set-up ----------------------------------------------------------

test("the function Netlify runs is the guard, in front of the homepage only", async () => {
  const entry = await import("../netlify/edge-functions/guard.js");
  const { RATE_LIMIT } = await import("../netlify/guard/settings.js");
  assert.equal(typeof entry.default, "function");
  assert.deepEqual(entry.config, {
    path: ["/", "/index.html", "/portfolio", "/portfolio.html"],
    method: "GET",
    onError: "bypass",
    rateLimit: { windowLimit: RATE_LIMIT, windowSize: 60, aggregateBy: ["ip", "domain"] },
  });
  const reply = await visit(entry.default, newVisitor());
  assert.equal(reply.status, 200);
  assert.equal(reply.mode, "off");
});

test("every reply from the guard carries the security headers", async () => {
  const handler = newInstance();
  const replies = await crowd(handler, 11);
  const preview = await visit(handler, newVisitor(), { path: "/?busy=saver" });
  const unchanged = await visit(handler, newVisitor(), { origin: () => new Response(null, { status: 304 }) });
  const attacker = { ip: "192.0.2.77", cookie: null, agent: BROWSER };
  let refused;
  for (let i = 0; i < 301; i++) refused = await visit(handler, { ...attacker });
  assert.equal(refused.status, 429);

  for (const [label, reply] of Object.entries({ normal: replies[0], lite: replies[10], preview, unchanged, refused })) {
    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
      assert.equal(reply.headers.get(header), value, `${header} on the ${label} reply`);
    }
  }
});

test("netlify.toml sends the same security headers with every other file", () => {
  const toml = readFileSync(join(ROOT, "netlify.toml"), "utf8");
  const values = toml.slice(toml.indexOf("[headers.values]"));
  const inToml = Object.fromEntries([...values.matchAll(/^\s*([A-Za-z-]+) = "(.*)"$/gm)].map((match) => [match[1], match[2]]));
  assert.deepEqual(inToml, SECURITY_HEADERS);
  assert.match(toml, /^\s*for = "\/\*"$/m);
});

test("the published folder holds the website and none of the project's own files", () => {
  const toml = readFileSync(join(ROOT, "netlify.toml"), "utf8");
  assert.match(toml, /^\s*command = "sh tools\/build-site\.sh"$/m);
  assert.match(toml, /^\s*publish = "dist"$/m);

  const scratch = mkdtempSync(join(tmpdir(), "guard-site-"));
  const out = join(scratch, "site");
  try {
    execFileSync("sh", [join(ROOT, "tools/build-site.sh"), out], { stdio: "pipe" });
    const published = readdirSync(out, { recursive: true }).map((path) => String(path).replaceAll("\\", "/"));
    for (const needed of ["index.html", "css/site.css", "js/protect.js", "img/og-image.jpg", ...pagePhotos, ...Object.values(photoVariants).flatMap(({ lite, saver }) => [lite, saver]).filter(Boolean), ...Object.keys(photoVariants)]) {
      assert.ok(published.includes(needed), `${needed} is published`);
    }
    assert.ok(!published.some((path) => path.startsWith("photos")), "the original photos are not published");
    const allowed = new Set(["index.html", "css", "js", "img"]);
    const extra = readdirSync(out).filter((name) => !allowed.has(name));
    const privateFiles = ["netlify", "netlify.toml", "photos", "tests", "tools", "node_modules", "package.json", "package-lock.json", "README.md", "dist"];
    assert.deepEqual(extra.filter((name) => privateFiles.includes(name)), [], "none of the project's own files are published");
    assert.equal(readFileSync(join(out, "index.html"), "utf8"), PAGE);

    // The script empties its output folder, so it refuses one that already exists.
    assert.throws(() => execFileSync("sh", [join(ROOT, "tools/build-site.sh"), out], { stdio: "pipe" }), /already exists/);
    assert.ok(existsSync(join(out, "index.html")), "and leaves it untouched");
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});
