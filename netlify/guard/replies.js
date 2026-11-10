// What the guard sends back: the page (with the right photos and headers) or
// the short "timeout" page for an address that is asking too often.
import photoVariants from "./photo-variants.js";
import { COOKIE, MODES, SECURITY_HEADERS } from "./settings.js";
import { visitorLabel } from "./visitors.js";

// Finishes the reply Netlify prepared for the page.
//   mode: position in MODES; visitors: the count, when one was taken;
//   cookie: a new visitor id to hand out; preview: the mode was asked for with ?busy=
export async function reply(response, { mode = 0, visitors, cookie, preview = false }) {
  const name = MODES[mode].name;
  const headers = new Headers(response.headers);
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) headers.set(header, value);
  headers.set("x-busy-mode", preview ? `${name} (preview)` : name);
  if (visitors !== undefined) headers.set("x-busy-visitors", visitorLabel(visitors));
  if (cookie) {
    headers.append("set-cookie", `${COOKIE.name}=${cookie}; Max-Age=${COOKIE.maxAgeSeconds}; Path=/; Secure; HttpOnly; SameSite=Lax`);
  }

  const isPage = response.status === 200 && (response.headers.get("content-type") || "").includes("text/html");
  if (mode === 0 || !isPage) {
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }

  const html = swapPhotos(await response.text(), mode);
  for (const header of ["content-length", "content-encoding", "etag", "last-modified"]) headers.delete(header);
  headers.set("cache-control", "no-store");
  return new Response(html, { status: 200, headers });
}

// Any photo path in quotes or url(...): src="img/x.jpg", url('img/x.jpg').
const PHOTO_PATH = /(["'(])(img\/[^"'()\s?#]+)(?=["')])/g;

// Points every photo that has a smaller copy at that copy. A photo without
// one is left alone, so a newly added photo can never show up broken.
export function swapPhotos(html, mode) {
  return html
    .replace(/<html\b/i, `<html data-busy="${MODES[mode].name}"`)
    .replace(PHOTO_PATH, (whole, opener, path) => {
      const copies = photoVariants[path];
      if (copies === undefined) return whole;
      // This mode's copy, or the next size up if it has none.
      for (let i = mode; i >= 1; i--) {
        const copy = copies[MODES[i].name];
        if (copy) return opener + copy;
      }
      return whole;
    });
}

// Sent instead of the page to an address that is asking too often. It is
// deliberately tiny and loads nothing else, and reloads itself after a minute.
const TIMEOUT_PAGE = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="60"><title>Horizon Media</title><style>
body{margin:0;min-height:100vh;display:flex;flex-direction:column;justify-content:center;background:#0a0a0a;color:#a6a6a6;font:17px/1.55 "Helvetica Neue",Arial,sans-serif}
header,h1{color:#f4f4f4;font-family:"DIN Condensed","Avenir Next Condensed",Impact,"Arial Narrow",sans-serif-condensed,sans-serif;font-weight:800;text-transform:uppercase}
header{position:absolute;top:18px;left:5vw;font-size:22px;letter-spacing:.06em}
h1{margin:0;padding:0 5vw;font-size:clamp(64px,19vw,240px);line-height:.8;border-bottom:3px solid #ffc61a}
p{max-width:32em;margin:28px 5vw 22px}
a{align-self:flex-start;margin:0 5vw;padding:12px 20px;border-radius:4px;background:#ffc61a;color:#1a1402;font-weight:600;text-decoration:none}
a:focus-visible{outline:2px solid #ffe27a;outline-offset:3px}
</style><header>Horizon Media</header><h1>Timeout</h1><p>Too many page loads from your network in the last minute. This page reloads by itself in one minute.</p><a href="">Reload now</a>`;

export function timeoutPage() {
  return new Response(TIMEOUT_PAGE, {
    status: 429,
    headers: {
      ...SECURITY_HEADERS,
      "content-type": "text/html; charset=utf-8",
      "retry-after": "60",
      "cache-control": "no-store",
      "x-busy-mode": "timeout",
    },
  });
}
