// The studio: one password-protected page where Horizon Media adds photos to
// the portfolio from any phone or computer, without touching the code.
//
//   /studio                  sign in, then add or remove photos
//   /portfolio-photos.json   added photos, and built-in photos taken off the site
//                            (public; the portfolio and car pages read it)
//   /announcements.json      announcements that are up today (public; the homepage reads it)
//   /uploads/<id>/full.jpg   an added photo (public), and /thumb.jpg its small copy
//   /photo-request           visitors ask for a photo (public form; the studio lists them)
//   /announcement-photos/<id>.jpg  an announcement's optional photo (public)
//
// Each sign-in is a pair of environment variables in Netlify: STUDIO_USERNAME and
// STUDIO_PASSWORD, then STUDIO_USERNAME_2 / STUDIO_PASSWORD_2 and so on up to _5
// (see accounts()). Until one pair is set, signing in is switched off. They are
// never written in this code, because this code is public. Photos are kept
// in Netlify Blobs.
import { getStore } from "@netlify/blobs";
import { studioPage } from "./page.js";
import { SPORTS } from "./sports.js";
import { MAX_REQUESTS } from "./limits.js";
import { createBanList } from "../guard/bans.js";
import { HERO_PATH } from "../guard/homepage.js";

const SESSION_HOURS = 12;
const REMEMBER_DAYS = 30; // "Keep me signed in on this device"
const COOKIE = "hm_studio";
const MAX_FULL = 1_500_000; // bytes; the page shrinks photos before sending them
const MAX_THUMB = 250_000;
const MAX_PHOTOS = 200;
const MAX_ANNOUNCEMENTS = 50;
const MAX_PINS = 24;
// Password guessing: this many wrong sign-ins from one address locks it out for
// LOCK_MINUTES. Counted in Netlify Blobs, so it holds across all of Netlify's servers.
const LOCK_AFTER = 10;
const LOCK_MINUTES = 15;
// Public addresses one visitor may load per minute before getting a short "slow
// down" (high enough for a whole school on one network), and the number that
// gets them kicked off the site for an hour (see ../guard/bans.js).
const PUBLIC_PER_MINUTE = { list: 300, image: 1500 };
const BAN_PER_MINUTE = { list: 1200, image: 6000 };
const REQUESTS_PER_HOUR = 5; // from one address
// Announcements go up on their date and come down after their end date, by the
// calendar in this time zone.
const TIME_ZONE = "America/New_York";
// A built-in photo on the portfolio or car page, by the path its page uses.
const BUILT_IN = /^img\/(portfolio|cars)\/[a-z0-9-]{1,60}\.jpg$/;
// A photo a visitor can ask for: a built-in one or one added in the studio.
const REQUESTABLE = /^(img\/(portfolio|cars)\/[a-z0-9-]{1,60}\.jpg|uploads\/[0-9a-f]{16}\/full\.jpg)$/;
const SECURITY = { "x-frame-options": "DENY", "content-security-policy": "frame-ancestors 'none'", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" };

const encoder = new TextEncoder();
const hex = (buffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha256 = async (text) => hex(await crypto.subtle.digest("SHA-256", encoder.encode(text)));
const store = () => getStore({ name: "studio-photos", consistency: "strong" });

const setting = (name) => globalThis.Netlify?.env?.get?.(name) || "";

const MAX_ACCOUNTS = 5;

// The team's sign-ins: STUDIO_USERNAME and STUDIO_PASSWORD, then
// STUDIO_USERNAME_2 and STUDIO_PASSWORD_2, and so on up to _5. A pair with no
// username, or a password shorter than 12 characters, is ignored.
function accounts() {
  const found = [];
  for (let n = 1; n <= MAX_ACCOUNTS; n++) {
    const suffix = n === 1 ? "" : `_${n}`;
    const username = setting(`STUDIO_USERNAME${suffix}`);
    const password = setting(`STUDIO_PASSWORD${suffix}`);
    if (username !== "" && password.length >= 12) found.push({ n, username, password });
  }
  return found;
}

// Compares two strings without leaking, through timing, how much of them matched.
async function same(a, b) {
  const [x, y] = await Promise.all([sha256(`cmp:${a}`), sha256(`cmp:${b}`)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

// A session is signed with the account's own username and password, so
// changing one account's password signs out only that account.
async function sign(expires, account) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(`studio-session:${account.username}:${account.password}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, encoder.encode(`${account.n}:${expires}`)));
}

async function signedIn(request, list, now) {
  const match = new RegExp(`(?:^|;\\s*)${COOKIE}=(\\d{13})\\.([1-9])\\.([0-9a-f]{64})(?:;|$)`).exec(request.headers.get("cookie") || "");
  if (!match || Number(match[1]) <= now) return false;
  const account = list.find((a) => a.n === Number(match[2]));
  return account !== undefined && same(match[3], await sign(match[1], account));
}

const reply = (body, status = 200, headers = {}) =>
  new Response(body, { status, headers: { ...SECURITY, "cache-control": "no-store", "content-type": "text/html; charset=utf-8", ...headers } });
const json = (data, status = 200, headers = {}) => reply(JSON.stringify(data), status, { "content-type": "application/json", ...headers });
const isJpeg = (bytes) => bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
const clean = (value, max) => String(value || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const todayIn = (now) => new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now));
// Whether an announcement is up on the given day: from its date to its end date, if it has one.
const isUp = (item, today) => item.date <= today && (!item.until || item.until >= today);

export function createStudio() {
  const attempts = new Map(); // address -> { minute, count }
  const requestsFrom = new Map(); // address -> { hour, count }
  const publicLoads = new Map(); // "kind:address" -> { minute, count }
  const bans = createBanList();

  // Counts a public load. Returns a reply to send instead ("slow down", or
  // "blocked" once the address keeps going), or nothing to carry on.
  async function tooManyLoads(kind, ip, now) {
    const minute = Math.floor(now / 60_000);
    const key = `${kind}:${ip}`;
    let entry = publicLoads.get(key);
    if (!entry || entry.minute !== minute) {
      if (publicLoads.size > 5000) publicLoads.clear();
      entry = { minute, count: 0 };
      publicLoads.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > BAN_PER_MINUTE[kind]) {
      if (entry.count === BAN_PER_MINUTE[kind] + 1) await bans.ban(ip, now, `${entry.count} ${kind} loads in a minute`);
      return blocked();
    }
    if (entry.count > PUBLIC_PER_MINUTE[kind]) return reply("Too many requests. Wait a minute.", 429, { "retry-after": "60", "content-type": "text/plain; charset=utf-8" });
  }
  const blocked = () => reply("This network is blocked from Horizon Media for an hour for sending far too many requests.", 403, { "content-type": "text/plain; charset=utf-8" });

  // Failed sign-ins per address, kept under a scrambled form of the address.
  const lockKey = async (ip) => `login-fail/${(await sha256(`lock:${ip}`)).slice(0, 24)}`;
  async function lockedOut(ip, now) {
    const entry = await store().get(await lockKey(ip), { type: "json" });
    return !!entry && entry.count >= LOCK_AFTER && now - entry.since < LOCK_MINUTES * 60_000;
  }
  async function countFailure(ip, now) {
    const key = await lockKey(ip);
    const entry = await store().get(key, { type: "json" });
    const fresh = !entry || now - entry.since >= LOCK_MINUTES * 60_000;
    await store().setJSON(key, fresh ? { since: now, count: 1 } : { since: entry.since, count: entry.count + 1 });
  }

  function tooManyRequests(ip, now) {
    const hour = Math.floor(now / 3_600_000);
    const entry = requestsFrom.get(ip);
    if (!entry || entry.hour !== hour) {
      if (requestsFrom.size > 2000) requestsFrom.clear();
      requestsFrom.set(ip, { hour, count: 1 });
      return false;
    }
    entry.count += 1;
    return entry.count > REQUESTS_PER_HOUR;
  }

  function tooManyAttempts(ip, now) {
    const minute = Math.floor(now / 60_000);
    const entry = attempts.get(ip);
    if (!entry || entry.minute !== minute) {
      if (attempts.size > 2000) attempts.clear();
      attempts.set(ip, { minute, count: 1 });
      return false;
    }
    entry.count += 1;
    return entry.count > 5;
  }

  // The announcements that were written into index.html before the studio could
  // manage them. They are copied into the store once, so they can be edited or
  // removed like any other.
  const STARTING_ANNOUNCEMENTS = [
    { id: "0000000000000001", date: "2026-11-02", title: "Indoor track and cross country", text: "Indoor track joins our coverage this winter, and cross country follows in fall 2027.", link: "", linkText: "" },
    { id: "0000000000000002", date: "2026-11-13", title: "Car photography is here", text: "Horizon Media now photographs cars. Book a shoot through our booking form.", link: "cars.html", linkText: "See car shoots" },
  ];

  async function seedAnnouncements() {
    if (await store().get("ann-seeded")) return;
    await Promise.all(STARTING_ANNOUNCEMENTS.map((a, i) => store().setJSON(`ann/${a.id}`, { ...a, added: i + 1 })));
    await store().set("ann-seeded", "1");
  }

  // Newest date first; on the same date, the most recently added first.
  async function listAnnouncements() {
    await seedAnnouncements();
    const { blobs } = await store().list({ prefix: "ann/" });
    const items = (await Promise.all(blobs.map(({ key }) => store().get(key, { type: "json" })))).filter(Boolean);
    return items.sort((a, b) => b.date.localeCompare(a.date) || b.added - a.added);
  }

  async function listPhotos() {
    const { blobs } = await store().list({ prefix: "meta/" });
    const photos = (await Promise.all(blobs.map(({ key }) => store().get(key, { type: "json" })))).filter(Boolean);
    return photos.sort((a, b) => b.added - a.added);
  }

  // Built-in photos taken off the site in the studio, by their img/ path.
  const listHidden = async () => (await store().get("hidden", { type: "json" })) || [];
  const listPins = async () => (await store().get("pins", { type: "json" })) || [];

  // What the public pages read: one stored copy of each list, rebuilt whenever
  // the studio changes something, so a page view costs one storage read
  // however many photos or announcements there are.
  // Each copy is also rebuilt when it is older than INDEX_MINUTES, in case a
  // change ever reached storage without rebuilding it.
  const INDEX_MINUTES = 10;
  async function rebuildPhotoIndex() {
    const [photos, hidden, pins, hero] = await Promise.all([listPhotos(), listHidden(), listPins(), store().get("hero", { type: "json" })]);
    const data = { photos, hidden, pins, hero: hero ? hero.path : "" };
    await store().setJSON("index/photos", { built: Date.now(), data });
    return data;
  }
  async function rebuildAnnouncementIndex() {
    const items = await listAnnouncements();
    await store().setJSON("index/announcements", { built: Date.now(), data: items });
    return items;
  }
  async function readIndex(key, rebuild) {
    const index = await store().get(key, { type: "json" });
    return index && Date.now() - index.built < INDEX_MINUTES * 60_000 ? index.data : rebuild();
  }
  const photoIndex = () => readIndex("index/photos", rebuildPhotoIndex);
  const announcementIndex = () => readIndex("index/announcements", rebuildAnnouncementIndex);

  async function listRequests() {
    const { blobs } = await store().list({ prefix: "req/" });
    const items = (await Promise.all(blobs.map(({ key }) => store().get(key, { type: "json" })))).filter(Boolean);
    return items.sort((a, b) => b.added - a.added);
  }

  return async function studio(request, context) {
    const url = new URL(request.url);
    const now = Date.now();

    // ---- Public: the list and the photos themselves
    const ip = context.ip || "unknown";
    // Kicked off the site: nothing here answers a banned address.
    if (await bans.isBanned(context.ip, now)) return blocked();
    let limited;
    if (request.method === "GET" && url.pathname === "/portfolio-photos.json") {
      if ((limited = await tooManyLoads("list", ip, now))) return limited;
      // Not kept by browsers: a photo or announcement removed in the studio
      // disappears from the site on the next page load.
      return json(await photoIndex(), 200, { "cache-control": "no-cache" });
    }
    if (request.method === "GET" && url.pathname === "/announcements.json") {
      if ((limited = await tooManyLoads("list", ip, now))) return limited;
      const today = todayIn(now);
      const up = (await announcementIndex()).filter((item) => isUp(item, today));
      return json(up, 200, { "cache-control": "no-cache" });
    }
    if (url.pathname === "/photo-request") {
      if (request.method !== "POST") return reply("Not allowed", 405);
      if (request.headers.get("origin") !== url.origin) return json({ error: "Wrong origin" }, 403);
      if (tooManyRequests(context.ip || "unknown", now)) return json({ error: "You have sent a lot of requests in a short time, so please wait an hour and try again or message us on Instagram." }, 429);
      const form = await request.formData();
      // A field people never see: forms that fill it in are bots.
      if (String(form.get("website") || "") !== "") return json({ ok: true });
      const name = clean(form.get("name"), 60);
      const contact = clean(form.get("contact"), 100);
      const message = clean(form.get("message"), 500);
      const photoPath = String(form.get("photo") || "");
      if (!REQUESTABLE.test(photoPath)) return json({ error: "Unknown photo." }, 400);
      if (!name || !contact) return json({ error: "Give your name and an Instagram name or email so we can reach you." }, 400);
      if ((await store().list({ prefix: "req/" })).blobs.length >= MAX_REQUESTS) return json({ full: true, error: "We have too many photo requests to answer right now, so please try again in a few days or message us on Instagram." }, 503);
      const id = hex(crypto.getRandomValues(new Uint8Array(8)));
      await store().setJSON(`req/${id}`, { id, photo: photoPath, title: clean(form.get("title"), 60), name, contact, message, added: now });
      // How often each photo is asked for, kept after requests are handled.
      const counts = (await store().get("request-counts", { type: "json" })) || {};
      counts[photoPath] = (counts[photoPath] || 0) + 1;
      await store().setJSON("request-counts", counts);
      console.log(`studio: photo request ${id}`);
      return json({ ok: true });
    }
    const annPhoto = /^\/announcement-photos\/([0-9a-f]{16})\.jpg$/.exec(url.pathname);
    if (annPhoto) {
      if (request.method !== "GET") return reply("Not allowed", 405);
      if ((limited = await tooManyLoads("image", ip, now))) return limited;
      const bytes = await store().get(`ann-photo/${annPhoto[1]}`, { type: "arrayBuffer" });
      if (!bytes) return reply("Not found", 404);
      // The page asks for it with ?v=<when it was added>, so a new photo gets a new address.
      return new Response(bytes, { headers: { ...SECURITY, "content-type": "image/jpeg", "cache-control": "public, max-age=31536000, immutable" } });
    }
    const file = /^\/uploads\/([0-9a-f]{16})\/(full|thumb)\.jpg$/.exec(url.pathname);
    if (file) {
      if (request.method !== "GET") return reply("Not allowed", 405);
      if ((limited = await tooManyLoads("image", ip, now))) return limited;
      const bytes = await store().get(`photo/${file[1]}/${file[2]}`, { type: "arrayBuffer" });
      if (!bytes) return reply("Not found", 404);
      return new Response(bytes, { headers: { ...SECURITY, "content-type": "image/jpeg", "cache-control": "public, max-age=31536000, immutable" } });
    }
    if (!url.pathname.startsWith("/studio")) return;

    // ---- Private: everything under /studio
    const list = accounts();
    if (list.length === 0) return reply(studioPage({ state: "off" }), 503);

    if (request.method === "GET") {
      // Lists only the team sees: every announcement (with scheduled and ended
      // ones) and the photo requests.
      if (url.pathname === "/studio/announcements.json" || url.pathname === "/studio/requests.json" || url.pathname === "/studio/stats.json") {
        if (!(await signedIn(request, list, now))) return json({ error: "Sign in first." }, 401);
        if (url.pathname === "/studio/stats.json") return json({ requestCounts: (await store().get("request-counts", { type: "json" })) || {} });
        if (url.pathname === "/studio/requests.json") return json(await listRequests());
        return json({ today: todayIn(now), items: await listAnnouncements() });
      }
      if (url.pathname !== "/studio" && url.pathname !== "/studio/") return reply("Not found", 404);
      return reply(studioPage({ state: (await signedIn(request, list, now)) ? "in" : "out" }));
    }
    if (request.method !== "POST") return reply("Not allowed", 405);
    // Forms must come from this site itself.
    if (request.headers.get("origin") !== url.origin) return json({ error: "Wrong origin" }, 403);

    if (url.pathname === "/studio/login") {
      if (tooManyAttempts(ip, now)) return json({ error: "Too many tries. Wait a minute." }, 429);
      if (await lockedOut(ip, now)) return json({ error: `Too many wrong tries from here. Wait ${LOCK_MINUTES} minutes.` }, 429);
      const form = await request.formData();
      // Check every account, both fields each time, so the reply does not reveal
      // which account exists or which field was wrong.
      const username = String(form.get("username") || "");
      const password = String(form.get("password") || "");
      let account;
      for (const candidate of list) {
        const nameOk = await same(username, candidate.username);
        const passwordOk = await same(password, candidate.password);
        if (nameOk && passwordOk && account === undefined) account = candidate;
      }
      if (account === undefined) {
        console.warn(`studio: failed sign-in from ${context.ip}`);
        await countFailure(ip, now);
        return json({ error: "Wrong username or password." }, 401);
      }
      console.log(`studio: ${account.username} signed in`);
      await store().delete(await lockKey(ip));
      const seconds = form.get("remember") === "on" ? REMEMBER_DAYS * 86_400 : SESSION_HOURS * 3600;
      const expires = now + seconds * 1000;
      return json({ ok: true }, 200, {
        "set-cookie": `${COOKIE}=${expires}.${account.n}.${await sign(expires, account)}; Max-Age=${seconds}; Path=/studio; Secure; HttpOnly; SameSite=Strict`,
      });
    }
    if (url.pathname === "/studio/logout") {
      return json({ ok: true }, 200, { "set-cookie": `${COOKIE}=; Max-Age=0; Path=/studio; Secure; HttpOnly; SameSite=Strict` });
    }

    if (!(await signedIn(request, list, now))) return json({ error: "Sign in first." }, 401);
    const form = await request.formData();

    if (url.pathname === "/studio/upload") {
      const [full, thumb] = [form.get("full"), form.get("thumb")];
      if (!(full instanceof Blob) || !(thumb instanceof Blob)) return json({ error: "No photo was sent." }, 400);
      if (full.size > MAX_FULL || thumb.size > MAX_THUMB) return json({ error: "That photo is too large." }, 413);
      const [fullBytes, thumbBytes] = [new Uint8Array(await full.arrayBuffer()), new Uint8Array(await thumb.arrayBuffer())];
      if (!isJpeg(fullBytes) || !isJpeg(thumbBytes)) return json({ error: "Only JPEG photos are accepted." }, 415);
      if ((await store().list({ prefix: "meta/" })).blobs.length >= MAX_PHOTOS) return json({ error: `The studio holds ${MAX_PHOTOS} photos at most. Remove some first.` }, 409);

      const id = hex(crypto.getRandomValues(new Uint8Array(8)));
      const sport = SPORTS.includes(form.get("sport")) ? form.get("sport") : "other";
      const photo = { id, title: clean(form.get("title"), 60) || "Untitled", credit: clean(form.get("credit"), 40).replace(/^@+/, ""), sport, added: now };
      const owner = clean(form.get("owner"), 40).replace(/^@+/, "");
      if (sport === "cars" && owner) photo.owner = owner; // the car's owner, credited on the car page
      await Promise.all([
        store().set(`photo/${id}/full`, fullBytes.buffer),
        store().set(`photo/${id}/thumb`, thumbBytes.buffer),
      ]);
      await store().setJSON(`meta/${id}`, photo);
      await rebuildPhotoIndex();
      console.log(`studio: added photo ${id}`);
      return json({ ok: true, photo });
    }

    // Changes an added photo's title, credit, category or car owner.
    if (url.pathname === "/studio/edit-photo") {
      const id = String(form.get("id") || "");
      if (!/^[0-9a-f]{16}$/.test(id)) return json({ error: "Unknown photo." }, 400);
      const old = await store().get(`meta/${id}`, { type: "json" });
      if (!old) return json({ error: "That photo no longer exists." }, 404);
      const sport = SPORTS.includes(form.get("sport")) ? form.get("sport") : "other";
      const photo = { ...old, title: clean(form.get("title"), 60) || "Untitled", credit: clean(form.get("credit"), 40).replace(/^@+/, ""), sport };
      const owner = clean(form.get("owner"), 40).replace(/^@+/, "");
      if (sport === "cars" && owner) photo.owner = owner;
      else delete photo.owner;
      if (!photo.credit) return json({ error: "Give the photographer's Instagram name." }, 400);
      await store().setJSON(`meta/${id}`, photo);
      await rebuildPhotoIndex();
      console.log(`studio: edited photo ${id}`);
      return json({ ok: true, photo });
    }

    // Pinned photos show first on their page, in this order. Any photo can be
    // pinned: a built-in one by its img/ path, an added one by its uploads/ path.
    // The homepage background: any photo of the site, or "" for the default.
    if (url.pathname === "/studio/hero") {
      const path = String(form.get("path") || "");
      if (path && !HERO_PATH.test(path)) return json({ error: "Unknown photo." }, 400);
      if (path) await store().setJSON("hero", { path, set: now });
      else await store().delete("hero");
      await rebuildPhotoIndex();
      console.log(`studio: homepage photo set to ${path || "the default"}`);
      return json({ ok: true, hero: path });
    }

    if (url.pathname === "/studio/pins") {
      let pins;
      try { pins = JSON.parse(String(form.get("pins") || "[]")); } catch { pins = null; }
      if (!Array.isArray(pins) || pins.length > MAX_PINS || !pins.every((p) => typeof p === "string" && REQUESTABLE.test(p))) return json({ error: `Pin up to ${MAX_PINS} photos.` }, 400);
      pins = [...new Set(pins)];
      await store().setJSON("pins", pins);
      await rebuildPhotoIndex();
      return json({ ok: true, pins });
    }

    if (url.pathname === "/studio/announce" || url.pathname === "/studio/announce-delete") await seedAnnouncements();

    if (url.pathname === "/studio/announce") {
      const title = clean(form.get("title"), 80);
      const text = clean(form.get("text"), 400);
      const today = todayIn(now);
      const date = DAY.test(String(form.get("date") || "")) ? String(form.get("date")) : today;
      // Optional: the last day it shows. Empty means it stays up.
      const until = DAY.test(String(form.get("until") || "")) ? String(form.get("until")) : "";
      if (!title || !text) return json({ error: "Give the announcement a headline and some text." }, 400);
      if (until && until < date) return json({ error: "The take-down date must be on or after the date it goes up." }, 400);
      if (!form.get("id") && (await store().list({ prefix: "ann/" })).blobs.length >= MAX_ANNOUNCEMENTS) return json({ error: `The studio holds ${MAX_ANNOUNCEMENTS} announcements at most. Remove some first.` }, 409);
      // An optional link: a page of this site (cars.html, portfolio.html#x) or an https address.
      const rawLink = String(form.get("link") || "").trim();
      const link = /^(https:\/\/[^\s<>"']{1,300}|[a-z0-9-]{1,40}\.html(#[a-z0-9-]{1,40})?)$/i.test(rawLink) ? rawLink : "";
      if (rawLink && !link) return json({ error: "The link must be a page of this site, like cars.html, or start with https://." }, 400);
      const linkText = link ? clean(form.get("linkText"), 40) || "Read more" : "";
      // An optional photo, shrunk on the device like portfolio photos.
      const upload = form.get("photo");
      let photoBytes = null;
      if (upload instanceof Blob && upload.size > 0) {
        if (upload.size > MAX_FULL) return json({ error: "That photo is too large." }, 413);
        photoBytes = new Uint8Array(await upload.arrayBuffer());
        if (!isJpeg(photoBytes)) return json({ error: "Only JPEG photos are accepted." }, 415);
      }
      const dropPhoto = form.get("removePhoto") === "1";

      // Editing: an existing id keeps its place; otherwise a new announcement.
      const editing = String(form.get("id") || "");
      if (editing) {
        if (!/^[0-9a-f]{16}$/.test(editing)) return json({ error: "Unknown announcement." }, 400);
        const old = await store().get(`ann/${editing}`, { type: "json" });
        if (!old) return json({ error: "That announcement no longer exists." }, 404);
        const announcement = { ...old, title, text, date, until, link, linkText };
        if (photoBytes) {
          await store().set(`ann-photo/${editing}`, photoBytes.buffer);
          announcement.photo = now;
        } else if (dropPhoto && old.photo) {
          await store().delete(`ann-photo/${editing}`);
          delete announcement.photo;
        }
        await store().setJSON(`ann/${editing}`, announcement);
        await rebuildAnnouncementIndex();
        console.log(`studio: edited announcement ${editing}`);
        return json({ ok: true, announcement });
      }
      const id = hex(crypto.getRandomValues(new Uint8Array(8)));
      const announcement = { id, title, text, date, until, link, linkText, added: now };
      if (photoBytes) {
        await store().set(`ann-photo/${id}`, photoBytes.buffer);
        announcement.photo = now;
      }
      await store().setJSON(`ann/${id}`, announcement);
      await rebuildAnnouncementIndex();
      console.log(`studio: added announcement ${id}`);
      return json({ ok: true, announcement });
    }

    if (url.pathname === "/studio/announce-delete") {
      const id = String(form.get("id") || "");
      if (!/^[0-9a-f]{16}$/.test(id)) return json({ error: "Unknown announcement." }, 400);
      await Promise.all([store().delete(`ann/${id}`), store().delete(`ann-photo/${id}`)]);
      await rebuildAnnouncementIndex();
      console.log(`studio: removed announcement ${id}`);
      return json({ ok: true });
    }

    // Takes a built-in photo off the portfolio or car page, or puts it back.
    if (url.pathname === "/studio/hide" || url.pathname === "/studio/unhide") {
      const path = String(form.get("path") || "");
      if (!BUILT_IN.test(path)) return json({ error: "Unknown photo." }, 400);
      const hidden = (await listHidden()).filter((p) => p !== path);
      if (url.pathname === "/studio/hide") hidden.push(path);
      await store().setJSON("hidden", hidden.slice(-500));
      await rebuildPhotoIndex();
      console.log(`studio: ${url.pathname === "/studio/hide" ? "removed" : "put back"} ${path}`);
      return json({ ok: true, hidden });
    }

    // Marks a photo request as handled, which deletes it.
    if (url.pathname === "/studio/request-done") {
      const id = String(form.get("id") || "");
      if (!/^[0-9a-f]{16}$/.test(id)) return json({ error: "Unknown request." }, 400);
      await store().delete(`req/${id}`);
      return json({ ok: true });
    }

    if (url.pathname === "/studio/delete") {
      const id = String(form.get("id") || "");
      if (!/^[0-9a-f]{16}$/.test(id)) return json({ error: "Unknown photo." }, 400);
      await Promise.all([store().delete(`meta/${id}`), store().delete(`photo/${id}/full`), store().delete(`photo/${id}/thumb`)]);
      await rebuildPhotoIndex();
      console.log(`studio: removed photo ${id}`);
      return json({ ok: true });
    }
    return json({ error: "Not found" }, 404);
  };
}
