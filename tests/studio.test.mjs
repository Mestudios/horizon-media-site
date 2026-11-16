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
// Today on the studio's calendar (it runs on New York time).
const TODAY = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 6]);
let blobs, directory, port, site = 0, studio;
const storageCalls = []; // every request the local storage server receives

before(async () => {
  directory = mkdtempSync(join(tmpdir(), "studio-blobs-"));
  blobs = new BlobsServer({ directory, token: "t", onRequest: (event) => storageCalls.push(event) });
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
  assert.deepEqual((await call("/portfolio-photos.json")).body, { photos: [], hidden: [], pins: [] });
});

test("a signed-in upload appears in the public list and can be fetched", async () => {
  const cookie = await signIn();
  const added = await call("/studio/upload", { method: "POST", cookie, form: photo() });
  assert.equal(added.status, 200);
  const { id } = added.body.photo;
  assert.match(id, /^[0-9a-f]{16}$/);

  const list = await call("/portfolio-photos.json");
  assert.equal(list.headers.get("cache-control"), "no-cache", "removals show on the next page load");
  assert.equal(list.body.photos.length, 1);
  assert.deepEqual({ ...list.body.photos[0], added: 0 }, { id, title: "Big win", credit: "cb.framed.it", sport: "football", added: 0 });

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
  assert.deepEqual((await call("/portfolio-photos.json")).body, { photos: [], hidden: [], pins: [] });
});

test("titles and credits are stored as plain text", async () => {
  const cookie = await signIn();
  await call("/studio/upload", { method: "POST", cookie, form: photo({ title: '<img src=x onerror=alert(1)> Win', credit: "@@<b>name</b>", sport: "curling" }) });
  const [stored] = (await call("/portfolio-photos.json")).body.photos;
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
  const photos = (await call("/portfolio-photos.json")).body.photos;
  assert.equal(photos.find((p) => p.sport === "cars").owner, "bowner/b");
  assert.equal(photos.find((p) => p.sport === "football").owner, undefined);
});

test("announcements: signed-in only, stored as plain text, newest date first, and removable", async () => {
  assert.equal((await call("/studio/announce", { method: "POST", form: { title: "x", text: "y" } })).status, 401);
  const cookie = await signIn();
  assert.equal((await call("/studio/announce", { method: "POST", cookie, form: { title: "", text: "y" } })).status, 400);
  assert.equal((await call("/studio/announce", { method: "POST", cookie, form: { title: "Older", text: "One", date: "2000-11-01" } })).status, 200);
  const newer = await call("/studio/announce", { method: "POST", cookie, form: { title: "<b>Newer</b>", text: "Two <script>x</script>", date: TODAY } });
  assert.equal(newer.status, 200);
  const list = await call("/announcements.json");
  assert.equal(list.headers.get("cache-control"), "no-cache", "removals show on the next page load");
  assert.deepEqual(list.body.map((a) => a.title).slice(0, 1), ["bNewer/b"]);
  assert.equal(list.body[0].text, "Two scriptx/script");
  assert.equal(list.body.at(-1).title, "Older");
  const bad = await call("/studio/announce", { method: "POST", cookie, form: { title: "No date", text: "Three", date: "tomorrow" } });
  assert.match(bad.body.announcement.date, /^\d{4}-\d{2}-\d{2}$/, "a bad date falls back to today");
  assert.equal(bad.body.announcement.date, TODAY);
  assert.equal((await call("/studio/announce-delete", { method: "POST", cookie, form: { id: "nope" } })).status, 400);
  assert.equal((await call("/studio/announce-delete", { method: "POST", cookie, form: { id: newer.body.announcement.id } })).status, 200);
  assert.ok(!(await call("/announcements.json")).body.some((a) => a.id === newer.body.announcement.id));
});

test("the two built-in announcements start in the list and can be edited or removed for good", async () => {
  const first = (await call("/announcements.json")).body;
  assert.deepEqual(first.map((a) => a.title), ["Car photography is here", "Indoor track and cross country"]);
  assert.equal(first[0].link, "cars.html");
  const cookie = await signIn();
  const car = first[0];
  const edited = await call("/studio/announce", { method: "POST", cookie, form: { id: car.id, title: "Car shoots now booking", text: "Edited text.", date: car.date, link: "cars.html", linkText: "See the car page" } });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.announcement.added, car.added, "editing keeps its place");
  await call("/studio/announce-delete", { method: "POST", cookie, form: { id: first[1].id } });
  const after = (await call("/announcements.json")).body;
  assert.deepEqual(after.map((a) => [a.title, a.text, a.linkText]), [["Car shoots now booking", "Edited text.", "See the car page"]]);
  assert.equal((await call("/studio/announce", { method: "POST", cookie, form: { id: "0123456789abcdef", title: "x", text: "y" } })).status, 404);
});

test("announcement links must be a page of this site or an https address", async () => {
  const cookie = await signIn();
  for (const link of ["javascript:alert(1)", "http://example.com", "//evil.example", "cars.html\"onmouseover=x", "data:text/html,x"]) {
    assert.equal((await call("/studio/announce", { method: "POST", cookie, form: { title: "t", text: "x", link } })).status, 400, link);
  }
  for (const link of ["cars.html", "portfolio.html#top", "https://www.instagram.com/hor1zonmedia/"]) {
    assert.equal((await call("/studio/announce", { method: "POST", cookie, form: { title: "t", text: "x", link } })).status, 200, link);
  }
  const noLinkText = await call("/studio/announce", { method: "POST", cookie, form: { title: "t", text: "x", link: "cars.html" } });
  assert.equal(noLinkText.body.announcement.linkText, "Read more");
});

test("scheduled announcements go up on their date and come down after their end date", async () => {
  const cookie = await signIn();
  const post = (form) => call("/studio/announce", { method: "POST", cookie, form: { text: "x", ...form } });
  assert.equal((await post({ title: "Backwards", date: "2026-05-02", until: "2026-05-01" })).status, 400);
  assert.equal((await post({ title: "Scheduled", date: "2099-01-01" })).status, 200);
  assert.equal((await post({ title: "Ended", date: "2000-01-01", until: "2000-01-02" })).status, 200);
  assert.equal((await post({ title: "Running", date: "2000-01-01", until: "2099-01-01" })).status, 200);
  assert.equal((await post({ title: "Last day", date: "2000-01-01", until: TODAY })).status, 200);
  const shown = (await call("/announcements.json")).body.map((a) => a.title);
  assert.ok(shown.includes("Running") && shown.includes("Last day"));
  assert.ok(!shown.includes("Scheduled") && !shown.includes("Ended"));

  // The studio sees every announcement, and today's date to label them.
  assert.equal((await call("/studio/announcements.json")).status, 401);
  const all = (await call("/studio/announcements.json", { cookie })).body;
  assert.equal(all.today, TODAY);
  for (const title of ["Scheduled", "Ended", "Running"]) assert.ok(all.items.some((a) => a.title === title), title);
  assert.equal(all.items.find((a) => a.title === "Running").until, "2099-01-01");
});

test("built-in photos can be taken off the site and put back, by signed-in team members only", async () => {
  const form = { path: "img/portfolio/golden-hour.jpg" };
  assert.equal((await call("/studio/hide", { method: "POST", form })).status, 401);
  const cookie = await signIn();
  for (const path of ["img/../netlify/x.jpg", "uploads/0123456789abcdef/full.jpg", "img/hero-sunset.jpg", "https://evil.example/a.jpg"]) {
    assert.equal((await call("/studio/hide", { method: "POST", cookie, form: { path } })).status, 400, path);
  }
  assert.equal((await call("/studio/hide", { method: "POST", cookie, form })).status, 200);
  await call("/studio/hide", { method: "POST", cookie, form }); // twice is still once
  await call("/studio/hide", { method: "POST", cookie, form: { path: "img/cars/grille.jpg" } });
  assert.deepEqual((await call("/portfolio-photos.json")).body.hidden, ["img/portfolio/golden-hour.jpg", "img/cars/grille.jpg"]);
  assert.equal((await call("/studio/unhide", { method: "POST", cookie, form })).status, 200);
  assert.deepEqual((await call("/portfolio-photos.json")).body.hidden, ["img/cars/grille.jpg"]);
});

test("visitors can request a photo; only the team can read requests, and Done deletes them", async () => {
  const ask = (form, options = {}) => call("/photo-request", { method: "POST", form: { photo: "img/portfolio/golden-hour.jpg", title: "Golden hour", name: "Sam", contact: "@sam", ...form }, ...options });
  assert.equal((await call("/photo-request")).status, 405);
  assert.equal((await ask({}, { origin: "https://evil.example" })).status, 403);
  assert.equal((await ask({ photo: "netlify/studio/studio.js" })).status, 400);
  assert.equal((await ask({ name: "" })).status, 400);
  assert.equal((await ask({ contact: "" })).status, 400);
  assert.equal((await ask({ website: "spam.example" })).status, 200, "a bot gets a quiet yes");
  assert.equal((await ask({ name: "<b>Sam</b>", message: "For my <script>mom</script>" })).status, 200);
  assert.equal((await ask({ photo: "uploads/0123456789abcdef/full.jpg" }, { ip: "198.51.100.9" })).status, 200);

  assert.equal((await call("/studio/requests.json")).status, 401);
  const cookie = await signIn();
  const requests = (await call("/studio/requests.json", { cookie })).body;
  assert.equal(requests.length, 2, "the bot's request was not stored");
  const sam = requests.find((r) => r.photo === "img/portfolio/golden-hour.jpg");
  assert.deepEqual([sam.name, sam.contact, sam.message, sam.title], ["bSam/b", "@sam", "For my scriptmom/script", "Golden hour"]);
  assert.equal((await call("/studio/request-done", { method: "POST", form: { id: sam.id } })).status, 401);
  assert.equal((await call("/studio/request-done", { method: "POST", cookie, form: { id: sam.id } })).status, 200);
  assert.equal((await call("/studio/requests.json", { cookie })).body.length, 1);
});

test("when 20 requests are waiting, new ones get a plain one-sentence message until the team presses Done", async () => {
  const ask = (i) => call("/photo-request", { method: "POST", form: { photo: "img/cars/grille.jpg", name: `Visitor ${i}`, contact: "a@b.c" }, ip: `192.0.2.${i}` });
  for (let i = 1; i <= 20; i++) assert.equal((await ask(i)).status, 200, `request ${i}`);
  const full = await ask(21);
  assert.equal(full.status, 503);
  assert.equal(full.body.full, true);
  assert.equal(full.body.error.split(/[.!?](\s|$)/).filter((part) => part && part.trim()).length, 1, "one sentence");
  assert.match(full.body.error, /try again/);
  const cookie = await signIn();
  const waiting = (await call("/studio/requests.json", { cookie })).body;
  assert.equal(waiting.length, 20, "nothing was deleted");
  assert.ok(waiting.some((r) => r.name === "Visitor 1"), "the oldest is kept");
  await call("/studio/request-done", { method: "POST", cookie, form: { id: waiting[0].id } });
  assert.equal((await ask(22)).status, 200, "Done makes room again");
});

test("one address can send only a few photo requests an hour", async () => {
  const ask = () => call("/photo-request", { method: "POST", form: { photo: "img/cars/grille.jpg", name: "A", contact: "a@b.c" }, ip: "203.0.113.7" });
  for (let i = 0; i < 5; i++) assert.equal((await ask()).status, 200);
  assert.equal((await ask()).status, 429);
  assert.equal((await call("/photo-request", { method: "POST", form: { photo: "img/cars/grille.jpg", name: "B", contact: "b" }, ip: "203.0.113.8" })).status, 200);
});

test("'keep me signed in' lasts 30 days; otherwise a session lasts 12 hours", async () => {
  const short = await call("/studio/login", { method: "POST", form: { username: USERNAME, password: PASSWORD } });
  assert.match(short.headers.get("set-cookie"), /Max-Age=43200;/);
  const long = await call("/studio/login", { method: "POST", form: { username: USERNAME, password: PASSWORD, remember: "on" } });
  assert.match(long.headers.get("set-cookie"), /Max-Age=2592000;/);
  const cookie = long.headers.get("set-cookie").split(";")[0];
  const expires = Number(/=(\d{13})\./.exec(cookie)[1]);
  assert.ok(expires > Date.now() + 29 * 86_400_000, "the signed expiry matches 30 days");
  assert.match((await call("/studio", { cookie })).body, /id="add"/);
});

test("an added photo's details can be edited, as plain text, by signed-in team members only", async () => {
  const cookie = await signIn();
  const { id } = (await call("/studio/upload", { method: "POST", cookie, form: photo() })).body.photo;
  const form = { id, title: "<b>New</b> title", credit: "@@createddbyabby", sport: "cars", owner: "@car_owner" };
  assert.equal((await call("/studio/edit-photo", { method: "POST", form })).status, 401);
  assert.equal((await call("/studio/edit-photo", { method: "POST", cookie, form: { ...form, id: "nope" } })).status, 400);
  assert.equal((await call("/studio/edit-photo", { method: "POST", cookie, form: { ...form, id: "0123456789abcdef" } })).status, 404);
  assert.equal((await call("/studio/edit-photo", { method: "POST", cookie, form: { ...form, credit: "" } })).status, 400);
  assert.equal((await call("/studio/edit-photo", { method: "POST", cookie, form })).status, 200);
  let [stored] = (await call("/portfolio-photos.json")).body.photos;
  assert.deepEqual([stored.id, stored.title, stored.credit, stored.sport, stored.owner], [id, "bNew/b title", "createddbyabby", "cars", "car_owner"]);
  await call("/studio/edit-photo", { method: "POST", cookie, form: { ...form, sport: "soccer" } });
  [stored] = (await call("/portfolio-photos.json")).body.photos;
  assert.equal(stored.owner, undefined, "only car photos credit an owner");
});

test("photos can be pinned in order; only real photo paths, by signed-in team members", async () => {
  const pins = JSON.stringify(["img/cars/grille.jpg", "uploads/0123456789abcdef/full.jpg", "img/portfolio/golden-hour.jpg"]);
  assert.equal((await call("/studio/pins", { method: "POST", form: { pins } })).status, 401);
  const cookie = await signIn();
  for (const bad of ["nope", JSON.stringify(["../netlify/x.jpg"]), JSON.stringify([5]), JSON.stringify(Array.from({ length: 25 }, (_, i) => `img/cars/p${i}.jpg`))]) {
    assert.equal((await call("/studio/pins", { method: "POST", cookie, form: { pins: bad } })).status, 400, bad);
  }
  assert.equal((await call("/studio/pins", { method: "POST", cookie, form: { pins } })).status, 200);
  assert.deepEqual((await call("/portfolio-photos.json")).body.pins, JSON.parse(pins));
  await call("/studio/pins", { method: "POST", cookie, form: { pins: "[]" } });
  assert.deepEqual((await call("/portfolio-photos.json")).body.pins, []);
});

test("an announcement can carry a photo, which can be replaced, removed, and goes with it", async () => {
  const cookie = await signIn();
  const posted = await call("/studio/announce", { method: "POST", cookie, form: { title: "Shoot day", text: "x", photo: new Blob([JPEG]) } });
  assert.equal(posted.status, 200);
  const { id, photo: version } = posted.body.announcement;
  assert.ok(version > 0);
  const image = await call(`/announcement-photos/${id}.jpg?v=${version}`);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/jpeg");
  assert.equal((await call("/studio/announce", { method: "POST", cookie, form: { title: "Bad", text: "x", photo: new Blob(["<svg/>"]) } })).status, 415);
  const shown = (await call("/announcements.json")).body.find((a) => a.id === id);
  assert.equal(shown.photo, version);
  // Editing without a new photo keeps it; ticking Remove drops it.
  await call("/studio/announce", { method: "POST", cookie, form: { id, title: "Shoot day", text: "y" } });
  assert.equal((await call(`/announcement-photos/${id}.jpg`)).status, 200);
  await call("/studio/announce", { method: "POST", cookie, form: { id, title: "Shoot day", text: "y", removePhoto: "1" } });
  assert.equal((await call(`/announcement-photos/${id}.jpg`)).status, 404);
  assert.equal((await call("/announcements.json")).body.find((a) => a.id === id).photo, undefined);
  // Removing the announcement removes its photo.
  await call("/studio/announce", { method: "POST", cookie, form: { id, title: "Shoot day", text: "y", photo: new Blob([JPEG]) } });
  await call("/studio/announce-delete", { method: "POST", cookie, form: { id } });
  assert.equal((await call(`/announcement-photos/${id}.jpg`)).status, 404);
});

test("ten wrong sign-ins from one address lock it out for 15 minutes, across Netlify's servers", async () => {
  const wrong = (s, ip = "198.51.100.77") => s(new Request(SITE + "/studio/login", { method: "POST", headers: { origin: SITE }, body: (() => { const f = new FormData(); f.set("username", USERNAME); f.set("password", "wrong password!!"); return f; })() }), { ip });
  // Each try goes to a fresh copy of the studio, as if to a different server, so
  // only the shared count in storage can stop them.
  for (let i = 0; i < 10; i++) assert.equal((await wrong(createStudio())).status, 401, `try ${i + 1}`);
  assert.equal((await wrong(createStudio())).status, 429);
  const right = await createStudio()(new Request(SITE + "/studio/login", { method: "POST", headers: { origin: SITE }, body: (() => { const f = new FormData(); f.set("username", USERNAME); f.set("password", PASSWORD); return f; })() }), { ip: "198.51.100.77" });
  assert.equal(right.status, 429, "even the right password waits out the lock");
  assert.equal((await wrong(createStudio(), "198.51.100.78")).status, 401, "other addresses are not affected");
});

test("public lists cost one storage read per view and still change right away", async () => {
  const cookie = await signIn();
  for (let i = 0; i < 3; i++) await call("/studio/upload", { method: "POST", cookie, form: photo({ title: `P${i}` }) });
  await call("/studio/announce", { method: "POST", cookie, form: { title: "News", text: "x" } });
  // The first load after a change may rebuild; after that, one read each.
  await call("/portfolio-photos.json");
  await call("/announcements.json");
  storageCalls.length = 0;
  await call("/portfolio-photos.json");
  await call("/announcements.json");
  assert.deepEqual(storageCalls.map((c) => c.type), ["get", "get"], JSON.stringify(storageCalls));
  const { photos } = (await call("/portfolio-photos.json")).body;
  assert.equal(photos.length, 3);
  await call("/studio/delete", { method: "POST", cookie, form: { id: photos[0].id } });
  assert.equal((await call("/portfolio-photos.json")).body.photos.length, 2, "a removal shows on the next load");
});

test("one visitor loading the public lists too fast is told to slow down", async () => {
  let last;
  for (let i = 0; i < 121; i++) last = await call("/announcements.json", { ip: "203.0.113.50" });
  assert.equal(last.status, 429);
  assert.equal((await call("/announcements.json", { ip: "203.0.113.51" })).status, 200);
});

test("removing a photo deletes it everywhere", async () => {
  const cookie = await signIn();
  const { id } = (await call("/studio/upload", { method: "POST", cookie, form: photo() })).body.photo;
  assert.equal((await call("/studio/delete", { method: "POST", cookie, form: { id: "not-an-id" } })).status, 400);
  assert.equal((await call("/studio/delete", { method: "POST", cookie, form: { id } })).status, 200);
  assert.deepEqual((await call("/portfolio-photos.json")).body, { photos: [], hidden: [], pins: [] });
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
