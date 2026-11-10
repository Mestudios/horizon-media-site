// The studio: one password-protected page where Horizon Media adds photos to
// the portfolio from any phone or computer, without touching the code.
//
//   /studio                  sign in, then add or remove photos
//   /portfolio-photos.json   the list of added photos (public; the portfolio page reads it)
//   /uploads/<id>/full.jpg   an added photo (public), and /thumb.jpg its small copy
//
// The sign-in is two environment variables in Netlify: STUDIO_USERNAME and
// STUDIO_PASSWORD. Until both are set, signing in is switched off. They are
// never written in this code, because this code is public. Photos are kept
// in Netlify Blobs.
import { getStore } from "@netlify/blobs";
import { studioPage } from "./page.js";

const SESSION_HOURS = 12;
const COOKIE = "hm_studio";
const MAX_FULL = 1_500_000; // bytes; the page shrinks photos before sending them
const MAX_THUMB = 250_000;
const MAX_PHOTOS = 200;
const SPORTS = ["football", "soccer", "volleyball", "basketball", "other"];
const SECURITY = { "x-frame-options": "DENY", "content-security-policy": "frame-ancestors 'none'", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" };

const encoder = new TextEncoder();
const hex = (buffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha256 = async (text) => hex(await crypto.subtle.digest("SHA-256", encoder.encode(text)));
const store = () => getStore({ name: "studio-photos", consistency: "strong" });

const setting = (name) => globalThis.Netlify?.env?.get?.(name) || "";

function password() {
  const value = setting("STUDIO_PASSWORD");
  // A short password, or no username, is treated as not set.
  return value.length >= 12 && setting("STUDIO_USERNAME") !== "" ? value : null;
}

// Compares two strings without leaking, through timing, how much of them matched.
async function same(a, b) {
  const [x, y] = await Promise.all([sha256(`cmp:${a}`), sha256(`cmp:${b}`)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

async function sign(expires, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(`studio-session:${secret}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, encoder.encode(String(expires))));
}

async function signedIn(request, secret, now) {
  const match = new RegExp(`(?:^|;\\s*)${COOKIE}=(\\d{13})\\.([0-9a-f]{64})(?:;|$)`).exec(request.headers.get("cookie") || "");
  if (!match || Number(match[1]) <= now) return false;
  return same(match[2], await sign(match[1], secret));
}

const reply = (body, status = 200, headers = {}) =>
  new Response(body, { status, headers: { ...SECURITY, "cache-control": "no-store", "content-type": "text/html; charset=utf-8", ...headers } });
const json = (data, status = 200, headers = {}) => reply(JSON.stringify(data), status, { "content-type": "application/json", ...headers });
const isJpeg = (bytes) => bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
const clean = (value, max) => String(value || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);

export function createStudio() {
  const attempts = new Map(); // address -> { minute, count }

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

  async function listPhotos() {
    const { blobs } = await store().list({ prefix: "meta/" });
    const photos = (await Promise.all(blobs.map(({ key }) => store().get(key, { type: "json" })))).filter(Boolean);
    return photos.sort((a, b) => b.added - a.added);
  }

  return async function studio(request, context) {
    const url = new URL(request.url);
    const now = Date.now();

    // ---- Public: the list and the photos themselves
    if (request.method === "GET" && url.pathname === "/portfolio-photos.json") {
      return json(await listPhotos(), 200, { "cache-control": "public, max-age=60" });
    }
    const file = /^\/uploads\/([0-9a-f]{16})\/(full|thumb)\.jpg$/.exec(url.pathname);
    if (file) {
      if (request.method !== "GET") return reply("Not allowed", 405);
      const bytes = await store().get(`photo/${file[1]}/${file[2]}`, { type: "arrayBuffer" });
      if (!bytes) return reply("Not found", 404);
      return new Response(bytes, { headers: { ...SECURITY, "content-type": "image/jpeg", "cache-control": "public, max-age=31536000, immutable" } });
    }
    if (!url.pathname.startsWith("/studio")) return;

    // ---- Private: everything under /studio
    const secret = password();
    if (secret === null) return reply(studioPage({ state: "off" }), 503);

    if (request.method === "GET") {
      if (url.pathname !== "/studio" && url.pathname !== "/studio/") return reply("Not found", 404);
      return reply(studioPage({ state: (await signedIn(request, secret, now)) ? "in" : "out" }));
    }
    if (request.method !== "POST") return reply("Not allowed", 405);
    // Forms must come from this site itself.
    if (request.headers.get("origin") !== url.origin) return json({ error: "Wrong origin" }, 403);

    if (url.pathname === "/studio/login") {
      if (tooManyAttempts(context.ip || "unknown", now)) return json({ error: "Too many tries. Wait a minute." }, 429);
      const form = await request.formData();
      // Check both every time, so the reply does not reveal which one was wrong.
      const nameOk = await same(String(form.get("username") || ""), setting("STUDIO_USERNAME"));
      const passwordOk = await same(String(form.get("password") || ""), secret);
      if (!nameOk || !passwordOk) {
        console.warn(`studio: failed sign-in from ${context.ip}`);
        return json({ error: "Wrong username or password." }, 401);
      }
      const expires = now + SESSION_HOURS * 3_600_000;
      return json({ ok: true }, 200, {
        "set-cookie": `${COOKIE}=${expires}.${await sign(expires, secret)}; Max-Age=${SESSION_HOURS * 3600}; Path=/studio; Secure; HttpOnly; SameSite=Strict`,
      });
    }
    if (url.pathname === "/studio/logout") {
      return json({ ok: true }, 200, { "set-cookie": `${COOKIE}=; Max-Age=0; Path=/studio; Secure; HttpOnly; SameSite=Strict` });
    }

    if (!(await signedIn(request, secret, now))) return json({ error: "Sign in first." }, 401);
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
      await Promise.all([
        store().set(`photo/${id}/full`, fullBytes.buffer),
        store().set(`photo/${id}/thumb`, thumbBytes.buffer),
      ]);
      await store().setJSON(`meta/${id}`, photo);
      console.log(`studio: added photo ${id}`);
      return json({ ok: true, photo });
    }

    if (url.pathname === "/studio/delete") {
      const id = String(form.get("id") || "");
      if (!/^[0-9a-f]{16}$/.test(id)) return json({ error: "Unknown photo." }, 400);
      await Promise.all([store().delete(`meta/${id}`), store().delete(`photo/${id}/full`), store().delete(`photo/${id}/thumb`)]);
      console.log(`studio: removed photo ${id}`);
      return json({ ok: true });
    }
    return json({ error: "Not found" }, 404);
  };
}
