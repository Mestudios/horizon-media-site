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
//   5. Honeypot: an address that asks for a break-in page this site has never
//      had (TRAPS in settings.js, like /wp-login.php) is banned the same way.
//
// To see a mode yourself, add ?busy=lite or ?busy=saver to the address.
// The numbers are in settings.js. If anything in here fails, the normal page
// is served.
import { createBanList } from "./bans.js";
import { createHomepagePhoto } from "./homepage.js";
import { createNoticeReader } from "./notice.js";
import { bannedPage, notFoundPage, reply, timeoutPage } from "./replies.js";
import { cookiesAllowed, createRateLimiter, hasVisitorCookie, isBot, isPrefetch, newVisitorId, previewMode, readVisitorCookie } from "./requests.js";
import { BAN_AFTER, MODES, RATE_LIMIT, TRAP_FOLDERS, TRAPS } from "./settings.js";

// The pages busy mode works on. The guard also stands in front of the other
// pages (see the function's config), but only to keep banned addresses out.
const PHOTO_PAGES = new Set(["/", "/index.html", "/portfolio", "/portfolio.html", "/cars", "/cars.html"]);
import { createVisitorCounter, pickMode, visitorLabel } from "./visitors.js";

// The same request without the browser's "has it changed?" headers.
function withoutRevalidation(request) {
  const headers = new Headers(request.headers);
  headers.delete("if-none-match");
  headers.delete("if-modified-since");
  return new Request(request, { headers });
}

// Makes one guard with its own memory. Netlify runs several at a time.
export function createGuard() {
  const limiter = createRateLimiter();
  const bans = createBanList();
  const homepage = createHomepagePhoto();
  const notices = createNoticeReader();
  const visitors = createVisitorCounter();
  let mode = 0; // position in MODES

  // Works out who this is, counts them and settles the mode. Never throws.
  async function welcome(request, context, now) {
    try {
      const counted = !isPrefetch(request);
      // Only visitors who said yes to cookies are told apart by one.
      const allowed = cookiesAllowed(request);
      let id = counted && allowed ? readVisitorCookie(request) : null;
      let cookie;
      if (counted && id === null) {
        // A first visit, someone who said no to cookies, or a client that does
        // not keep them: a new visitor. Only those who said yes get the cookie.
        id = newVisitorId();
        if (allowed) cookie = id;
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

    // Honeypot: only a break-in bot asks for these. Ban it, and let it think
    // there is nothing here.
    const asked = new URL(request.url).pathname;
    if (TRAPS.includes(asked) || TRAP_FOLDERS.some((folder) => asked.startsWith(folder))) {
      await bans.ban(context.ip, now, `honeypot: asked for ${asked.slice(0, 80)}`);
      return notFoundPage();
    }
    const loads = limiter.count(context.ip, now);
    if (loads > BAN_AFTER) {
      if (loads === BAN_AFTER + 1) await bans.ban(context.ip, now, `${loads} page loads in a minute`);
      return bannedPage();
    }
    if (loads > RATE_LIMIT) return timeoutPage();

    // Said no to cookies (or never answered) but still holding a visitor
    // cookie from before: every reply tells the browser to delete it.
    const forget = !cookiesAllowed(request) && hasVisitorCookie(request);

    // Pages without photos only need the checks above, and the notice bar if one is on.
    const notice = await notices.current(now);
    // A page the guard changes (notice bar, homepage photo, busy mode) is always
    // fetched whole: a browser's "has it changed?" check would otherwise get
    // "not modified" and keep showing its saved copy without the change.
    const whole = () => context.next(withoutRevalidation(request));

    if (!PHOTO_PAGES.has(new URL(request.url).pathname)) return notice || forget ? reply(await (notice ? whole() : context.next()), { notice, forget }) : undefined;

    const path = new URL(request.url).pathname;
    const hero = path === "/" || path === "/index.html" ? await homepage.current(now) : null;

    const preview = previewMode(request);
    if (preview !== null) return reply(await whole(), { mode: preview, preview: true, hero, notice, forget });

    // Search engines and link-preview bots always get the normal page (with the
    // chosen homepage photo) and are not counted.
    if (isBot(request)) return hero || notice || forget ? reply(await (hero || notice ? whole() : context.next()), { hero, notice, forget }) : undefined;

    // Busy mode is decided while the page is fetched, so the last mode stands in for it.
    const changes = hero || notice || mode !== 0;
    const [response, state] = await Promise.all([changes ? whole() : context.next(), welcome(request, context, now)]);
    return reply(response, { ...state, hero, notice, forget });
  };
}
