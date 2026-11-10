// Who is asking: reading a request, and limiting how often one address may ask.
import { COOKIE, MODES, RATE_LIMIT } from "./settings.js";

const COOKIE_VALUE = new RegExp(`(?:^|;\\s*)${COOKIE.name}=([0-9a-f]{16})(?:;|$)`);

// The visitor id from the cookie, or null. Only our own format is accepted,
// because the id becomes part of a storage record's name.
export function readVisitorCookie(request) {
  const match = COOKIE_VALUE.exec(request.headers.get("cookie") || "");
  return match === null ? null : match[1];
}

export function newVisitorId() {
  return [...crypto.getRandomValues(new Uint8Array(8))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

const BOT =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|preview|embedly|lighthouse|pagespeed|pingdom|uptime|monitor|headless|phantomjs|python|curl\/|wget|go-http-client|java\/|okhttp|axios|node-fetch|undici|libwww|scrapy|feedfetcher|mediapartners/i;

// Search engines, link-preview fetchers and scripts that say what they are.
export function isBot(request) {
  const agent = request.headers.get("user-agent") || "";
  return agent === "" || BOT.test(agent);
}

// Browsers sometimes load a page in advance, before anyone looks at it.
export function isPrefetch(request) {
  const purpose = ["sec-purpose", "purpose", "x-purpose", "x-moz"].map((name) => request.headers.get(name) || "").join(" ");
  return /prefetch|prerender|preview/i.test(purpose);
}

// ?busy=lite or ?busy=saver on the address shows that mode. Returns its
// position in MODES, or null when the address does not ask for one.
export function previewMode(request) {
  const wanted = new URL(request.url).searchParams.get("busy");
  const index = MODES.findIndex(({ name }) => name === wanted);
  return index === -1 ? null : index;
}

const TABLE_MAX = 5_000; // most addresses tracked per minute

// A per-instance backstop for Netlify's own rate limit (see the function's config).
export function createRateLimiter() {
  let minute = 0;
  const loads = new Map(); // address -> page loads this minute

  // Counts this page load; true once the address is past the limit.
  function over(ip, now) {
    if (!ip) return false;
    if (Math.floor(now / 60_000) !== minute) {
      minute = Math.floor(now / 60_000);
      loads.clear();
    }
    const from = network(ip);
    const count = (loads.get(from) ?? 0) + 1;
    if (count > 1 || loads.size < TABLE_MAX) loads.set(from, count);
    if (count === RATE_LIMIT + 1) {
      console.warn(`guard: ${ip} passed ${RATE_LIMIT} page loads this minute; refusing the rest`);
    }
    return count > RATE_LIMIT;
  }

  return { over };
}

// IPv4: the address itself. IPv6: its /64 network, because one device or
// household can use any address inside it.
function network(ip) {
  if (!ip.includes(":")) return ip;
  const [head, tail] = ip.split("::");
  const groups = head.split(":").filter(Boolean);
  if (tail !== undefined) {
    const rest = tail.split(":").filter(Boolean);
    while (groups.length + rest.length < 8) groups.push("0");
    groups.push(...rest);
  }
  return groups.slice(0, 4).join(":");
}
