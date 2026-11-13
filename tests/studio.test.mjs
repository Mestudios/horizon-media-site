// Tests for the studio (netlify/studio/): one password, add and remove portfolio photos.
// Run with:  npm test
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, beforeEach, test } from "node:test";

process.env.NODE_ENV = "test";
const { BlobsServer } = await import("@netlify/blobs/server");
const { createStudio } = await import("../netlify/studio/studio.js");

const SITE = "https://horizon.example";
const USERNAME = "studio-owner";
const PASSWORD = "correct horse battery";
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 6]);
let blobs, directory, port, site = 0, studio;

before(async () => {
  directory = mkdtempSync(join(tmpdir(), "studio-blobs-"));
  blobs = new BlobsServer({ directory, token: "t" });
  port = (await blobs.start()).port;
});
after(async () => {
  await blobs.stop();
  rmSync(directory, { recursive: true, force: true });
  delete globalThis.Netlify;
});
beforeEach(() => {
  const url = `http://localhost:${port}`;
  globalThis.netlifyBlobsContext = Buffer.from(JSON.stringify({ edgeURL: url, uncachedEdgeURL: url, token: "t", siteID: `studio-${++site}`, deployID: "d", primaryRegion: "us-east-2" })).toString("base64");
  globalThis.Netlify = { env: { get: (name) => ({ STUDIO_USERNAME: USERNAME, STUDIO_PASSWORD: PASSWORD })[name] } };
  studio = createStudio();
});

async function call(path, { method = "GET", form, cookie, origin = SITE, ip = "198.51.100.1" } = {}) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  if (method === "POST" && origin) headers.set("origin", origin);
  let body;
  if (form) {
    body = new FormData();
    for (const [key, value] of Object.entries(form)) value instanceof Blob ? body.set(key, value, `${key}.jpg`) : body.set(key, value);
  }
  const response = await studio(new Request(SITE + path, { method, headers, body }), { ip });
  if (response === undefined) return { passedThrough: true };
  const type = response.headers.get("content-type") || "";
  return { status: response.status, headers: response.headers, body: type.includes("json") ? await response.json() : type.includes("image") ? new Uint8Array(await response.arrayBuffer()) : await response.text() };
}

async function signIn() {
  const reply = await call("/studio/login", { method: "POST", form: { username: USERNAME, password: PASSWORD } });
  assert.equal(reply.status, 200);
  return reply.headers.get("set-cookie").split(";")[0];
}
const photo = (extra = {}) => ({ title: "Big win", credit: "@cb.framed.it", sport: "football", full: new Blob([JPEG]), thumb: new Blob([JPEG]), ...extra });

test("without a password set in Netlify the studio is switched off", async () => {
  for (const value of [undefined, "", "short"]) {
    globalThis.Netlify = { env: { get: (name) => (name === "STUDIO_USERNAME" ? USERNAME : value) } };
    assert.equal((await call("/studio")).status, 503);
    assert.equal((await call("/studio/login", { method: "POST", form: { password: value || "" } })).status, 503);
  }
});

test("a password without a username also leaves it switched off", async () => {
  globalThis.Netlify = { env: { get: (name) => (name === "STUDIO_PASSWORD" ? PASSWORD : undefined) } };
  assert.equal((await call("/studio")).status, 503);
});

test("a second sign-in (STUDIO_USERNAME_2 / STUDIO_PASSWORD_2) works on its own, and short or half-set pairs are ignored", async () => {
  const env = { STUDIO_USERNAME: USERNAME, STUDIO_PASSWORD: PASSWORD, STUDIO_USERNAME_2: "second-person", STUDIO_PASSWORD_2: "another long password", STUDIO_USERNAME_3: "too-short", STUDIO_PASSWORD_3: "short", STUDIO_PASSWORD_4: "no username for this one" };
  globalThis.Netlify = { env: { get: (name) => env[name] } };
  const second = await call("/studio/login", { method: "POST", form: { username: "second-person", password: "another long password" } });
  assert.equal(second.status, 200);
  const cookie = second.headers.get("set-cookie").split(";")[0];
  assert.match(cookie, /^hm_studio=\d{13}\.2\./);
  assert.equal((await call("/studio/upload", { method: "POST", cookie, form: photo() })).status, 200, "the second person can add photos");
  for (const form of [{ username: "second-person", password: PASSWORD }, { username: USERNAME, password: "another long password" }, { username: "too-short", password: "short" }, { username: "", password: "no username for this one" }]) {
    assert.equal((await call("/studio/login", { method: "POST", form, ip: "198.51.100.77" })).status, 401, JSON.stringify(form));
  }
  // Changing the second password signs out only the second person.
  const first = (await call("/studio/login", { method: "POST", form: { username: USERNAME, password: PASSWORD } })).headers.get("set-cookie").split(";")[0];
  env.STUDIO_PASSWORD_2 = "a brand new password";
  assert.equal((await call("/studio/upload", { method: "POST", cookie, form: photo() })).status, 401);
  assert.equal((await call("/studio/upload", { method: "POST", cookie: first, form: photo() })).status, 200);
});

test("the sign-in page shows no tools until the password is given", async () => {
  const page = await call("/studio");
  assert.equal(page.status, 200);
  assert.match(page.body, /id="login"/);
  assert.doesNotMatch(page.body, /id="add"/);
  assert.equal(page.headers.get("cache-control"), "no-store");
  assert.equal(page.headers.get("x-frame-options"), "DENY");
});

test("a wrong password is refused, the right one signs in", async () => {
  for (const form of [{ username: USERNAME, password: "correct horse batterx" }, { username: "someone-else", password: PASSWORD }, { password: PASSWORD }]) {
    const wrong = await call("/studio/login", { method: "POST", form });
    assert.equal(wrong.status, 401);
    assert.equal(wrong.body.error, "Wrong username or password.", "the reply never says which one was wrong");
    assert.equal(wrong.headers.get("set-cookie"), null);
  }

  const cookie = await signIn();
  assert.match(cookie, /^hm_studio=\d{13}\.1\.[0-9a-f]{64}$/);
  const page = await call("/studio", { cookie });
  assert.match(page.body, /id="add"/);
});

test("the session cookie is locked down and cannot be forged or extended", async () => {
  const reply = await call("/studio/login", { method: "POST", form: { username: USERNAME, password: PASSWORD } });
  const header = reply.headers.get("set-cookie");
  for (const part of ["Path=/studio", "Secure", "HttpOnly", "SameSite=Strict", "Max-Age=43200"]) assert.ok(header.includes(part), part);
  const [expires, n, signature] = header.split(";")[0].split("=")[1].split(".");
  assert.equal(n, "1");
  const later = String(Number(expires) + 86_400_000);
  for (const forged of [`hm_studio=${later}.1.${signature}`, `hm_studio=${expires}.1.${"0".repeat(64)}`, `hm_studio=${Date.now() - 1000}.1.${signature}`, `hm_studio=${expires}.2.${signature}`, `hm_studio=${expires}.${signature}`, "hm_studio=1"]) {
    assert.equal((await call("/studio/upload", { method: "POST", cookie: forged, form: photo() })).status, 401, forged);
    assert.doesNotMatch((await call("/studio", { cookie: forged })).body, /id="add"/);
  }
});

test("six wrong tries in a minute from one address are cut off", async () => {
  let reply;
  for (let i = 0; i < 6; i++) reply = await call("/studio/login", { method: "POST", form: { password: "nope" }, ip: "203.0.113.9" });
  assert.equal(reply.status, 429);
  assert.equal((await call("/studio/login", { method: "POST", form: { username: USERNAME, password: PASSWORD }, ip: "203.0.113.9" })).status, 429, "even the right password waits");
  assert.equal((await call("/studio/login", { method: "POST", form: { username: USERNAME, password: PASSWORD }, ip: "203.0.113.10" })).status, 200);
});

test("requests from another site are refused", async () => {
  const cookie = await signIn();
  assert.equal((await call("/studio/upload", { method: "POST", cookie, form: photo(), origin: "https://evil.example" })).status, 403);
  assert.equal((await call("/studio/login", { method: "POST", form: { username: USERNAME, password: PASSWORD }, origin: null })).status, 403);
});

test("nobody can add or remove photos without signing in", async () => {
  assert.equal((await call("/studio/upload", { method: "POST", form: photo() })).status, 401);
  assert.equal((await call("/studio/delete", { method: "POST", form: { id: "0123456789abcdef" } })).status, 401);
  assert.deepEqual((await call("/portfolio-photos.json")).body, []);
});

test("a signed-in upload appears in the public list and can be fetched", async () => {
  const cookie = await signIn();
  const added = await call("/studio/upload", { method: "POST", cookie, form: photo() });
  assert.equal(added.status, 200);
  const { id } = added.body.photo;
  assert.match(id, /^[0-9a-f]{16}$/);

  const list = await call("/portfolio-photos.json");
  assert.equal(list.headers.get("cache-control"), "public, max-age=60");
  assert.equal(list.body.length, 1);
  assert.deepEqual({ ...list.body[0], added: 0 }, { id, title: "Big win", credit: "cb.framed.it", sport: "football", added: 0 });

  for (const size of ["full", "thumb"]) {
    const image = await call(`/uploads/${id}/${size}.jpg`);
    assert.equal(image.status, 200);
    assert.equal(image.headers.get("content-type"), "image/jpeg");
    assert.equal(image.headers.get("x-content-type-options"), "nosniff");
    assert.deepEqual(image.body, JPEG);
  }
  assert.equal((await call("/uploads/0123456789abcdef/full.jpg")).status, 404);
  assert.ok((await call("/uploads/../meta/x/full.jpg")).passedThrough, "a path that climbs out of /uploads is not the studio's to answer");
});

test("uploads that are not JPEG photos, or are too large, are refused", async () => {
  const cookie = await signIn();
  const html = new Blob(["<script>alert(1)</script>"]);
  assert.equal((await call("/studio/upload", { method: "POST", cookie, form: photo({ full: html }) })).status, 415);
  assert.equal((await call("/studio/upload", { method: "POST", cookie, form: photo({ thumb: html }) })).status, 415);
  assert.equal((await call("/studio/upload", { method: "POST", cookie, form: photo({ full: new Blob([JPEG, new Uint8Array(1_500_001)]) }) })).status, 413);
  assert.equal((await call("/studio/upload", { method: "POST", cookie, form: { title: "x", credit: "y", sport: "football" } })).status, 400);
  assert.deepEqual((await call("/portfolio-photos.json")).body, []);
});

test("titles and credits are stored as plain text", async () => {
  const cookie = await signIn();
  await call("/studio/upload", { method: "POST", cookie, form: photo({ title: '<img src=x onerror=alert(1)> Win', credit: "@@<b>name</b>", sport: "curling" }) });
  const [stored] = (await call("/portfolio-photos.json")).body;
  assert.equal(stored.title, "img src=x onerror=alert(1) Win");
  assert.equal(stored.credit, "bname/b");
  assert.equal(stored.sport, "other");
});

test("every season's sports and cars can be chosen, and the form offers exactly those", async () => {
  const { SPORTS } = await import("../netlify/studio/sports.js");
  assert.deepEqual(SPORTS, ["football", "soccer", "volleyball", "cross-country", "basketball", "wrestling", "indoor-track", "lacrosse", "baseball", "softball", "track-and-field", "cars", "other"]);
  const cookie = await signIn();
  const page = (await call("/studio", { cookie })).body;
  assert.deepEqual([...page.matchAll(/<option value="([a-z-]+)">/g)].map((m) => m[1]), SPORTS);
  assert.match(page, /<optgroup label="Winter">/);
  assert.match(page, /Track &amp; Field/);
  for (const sport of SPORTS) {
    const added = await call("/studio/upload", { method: "POST", cookie, form: photo({ sport }) });
    assert.equal(added.body.photo.sport, sport);
  }
});

test("a car photo can credit the car's owner; other photos ignore it", async () => {
  const cookie = await signIn();
  await call("/studio/upload", { method: "POST", cookie, form: photo({ sport: "cars", owner: "@@<b>owner</b>" }) });
  await call("/studio/upload", { method: "POST", cookie, form: photo({ sport: "football", owner: "someone" }) });
  const photos = (await call("/portfolio-photos.json")).body;
  assert.equal(photos.find((p) => p.sport === "cars").owner, "bowner/b");
  assert.equal(photos.find((p) => p.sport === "football").owner, undefined);
});

test("removing a photo deletes it everywhere", async () => {
  const cookie = await signIn();
  const { id } = (await call("/studio/upload", { method: "POST", cookie, form: photo() })).body.photo;
  assert.equal((await call("/studio/delete", { method: "POST", cookie, form: { id: "not-an-id" } })).status, 400);
  assert.equal((await call("/studio/delete", { method: "POST", cookie, form: { id } })).status, 200);
  assert.deepEqual((await call("/portfolio-photos.json")).body, []);
  assert.equal((await call(`/uploads/${id}/full.jpg`)).status, 404);
});

test("signing out ends the session in the browser", async () => {
  const out = await call("/studio/logout", { method: "POST" });
  assert.match(out.headers.get("set-cookie"), /^hm_studio=; Max-Age=0/);
});

test("the studio leaves every other address alone", async () => {
  assert.ok((await call("/")).passedThrough);
  assert.ok((await call("/portfolio.html")).passedThrough);
});
