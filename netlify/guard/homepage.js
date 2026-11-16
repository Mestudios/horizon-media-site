// The homepage background photo chosen in the studio (stored by the studio as
// "hero" in its Netlify Blobs store). Each server re-reads it in the
// background at most once a minute, so it costs almost nothing and never
// holds up the page; only a server's very first page waits for it, briefly.
import { getStore } from "@netlify/blobs";

const REFRESH_MS = 60_000;
const FIRST_WAIT_MS = 300;
const CALL_TIMEOUT_MS = 1_500;
const fetchWithTimeout = (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(CALL_TIMEOUT_MS) });
// Only photos of this site: a built-in photo or one added in the studio.
export const HERO_PATH = /^(img\/(portfolio|cars)\/[a-z0-9-]{1,60}\.jpg|uploads\/[0-9a-f]{16}\/full\.jpg)$/;

export function createHomepagePhoto() {
  let path = null;
  let readAt = -Infinity;
  let pending = null;

  function refresh(now) {
    if (!pending) {
      readAt = now;
      pending = getStore({ name: "studio-photos", fetch: fetchWithTimeout })
        .get("hero", { type: "json" })
        .then((value) => { path = value && HERO_PATH.test(value.path) ? value.path : null; })
        .catch((error) => console.warn("homepage: could not read the chosen photo; keeping the last one", error?.message || error))
        .finally(() => { pending = null; });
    }
    return pending;
  }

  // The chosen photo's path, or null for the one written into index.html.
  async function current(now) {
    if (readAt === -Infinity) await Promise.race([refresh(now), new Promise((resolve) => setTimeout(resolve, FIRST_WAIT_MS))]);
    else if (now - readAt >= REFRESH_MS) refresh(now);
    return path;
  }

  return { current };
}

// Points the homepage's background at the chosen photo.
export function useHero(html, path) {
  return html.replace(/(<div class="hero-photo"[^>]*url\(')[^']+('\))/, (whole, before, after) => before + path + after);
}
