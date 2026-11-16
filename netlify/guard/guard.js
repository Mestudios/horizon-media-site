// The site guard: everything that stands between a visitor and the homepage.
//
//   1. Rate limit: an address that loads the page hundreds of times a minute
//      gets a tiny "timeout" page instead.
//   2. Busy mode: it counts the visitors who opened the page in the last two
//      minutes and, as that number climbs, serves the page with smaller photos
//      ("lite", then "saver"). It steps back down as traffic falls.
//   3. Security headers on everything it sends.
//   4. Kicked off: an address that keeps flooding after it is refused is banned
//      from the whole site for an hour (bans.js), and every page shows it a
//      short "Blocked" page instead.
//
// To see a mode yourself, add ?busy=lite or ?busy=saver to the address.
// The numbers are in settings.js. If anything in here fails, the normal page
// is served.
import { createBanList } from "./bans.js";
import { createHomepagePhoto } from "./homepage.js";
import { bannedPage, reply, timeoutPage } from "./replies.js";
import { createRateLimiter, isBot, isPrefetch, newVisitorId, previewMode, readVisitorCookie } from "./requests.js";
import { BAN_AFTER, MODES, RATE_LIMIT } from "./settings.js";

// The pages busy mode works on. The guard also stands in front of the other
// pages (see the function's config), but only to keep banned addresses out.
const PHOTO_PAGES = new Set(["/", "/index.html", "/portfolio", "/portfolio.html", "/cars", "/cars.html"]);
import { createVisitorCounter, pickMode, visitorLabel } from "./visitors.js";

// Makes one guard with its own memory. Netlify runs several at a time.
export function createGuard() {
  const limiter = createRateLimiter();
  const bans = createBanList();
  const homepage = createHomepagePhoto();
  const visitors = createVisitorCounter();
  let mode = 0; // position in MODES

  // Works out who this is, counts them and settles the mode. Never throws.
  async function welcome(request, context, now) {
    try {
      const counted = !isPrefetch(request);
      let id = counted ? readVisitorCookie(request) : null;
      let cookie;
      if (counted && id === null) {
        // A first visit, or a client that does not keep cookies: a new visitor.
        id = newVisitorId();
        cookie = id;
      }

      const count = await visitors.count(id, context, now);
      const next = pickMode(count, mode);
      if (next !== mode) {
        console.log(`guard: busy mode ${MODES[mode].name} -> ${MODES[next].name} (${visitorLabel(count)} visitors in the last two minutes)`);
        mode = next;
      }
      return { mode, visitors: count, cookie };
    } catch (error) {
      console.error("guard: counting failed; serving the normal page", error);
      return { mode: 0 };
    }
  }

  return async function guard(request, context) {
    if (request.method !== "GET") return;
    const now = Date.now();

    if (await bans.isBanned(context.ip, now)) return bannedPage();
    const loads = limiter.count(context.ip, now);
    if (loads > BAN_AFTER) {
      if (loads === BAN_AFTER + 1) await bans.ban(context.ip, now, `${loads} page loads in a minute`);
      return bannedPage();
    }
    if (loads > RATE_LIMIT) return timeoutPage();

    // Pages without photos only need the checks above.
    if (!PHOTO_PAGES.has(new URL(request.url).pathname)) return;

    const path = new URL(request.url).pathname;
    const hero = path === "/" || path === "/index.html" ? await homepage.current(now) : null;

    const preview = previewMode(request);
    if (preview !== null) return reply(await context.next(), { mode: preview, preview: true, hero });

    // Search engines and link-preview bots always get the normal page (with the
    // chosen homepage photo) and are not counted.
    if (isBot(request)) return hero ? reply(await context.next(), { hero }) : undefined;

    const [response, state] = await Promise.all([context.next(), welcome(request, context, now)]);
    return reply(response, { ...state, hero });
  };
}
