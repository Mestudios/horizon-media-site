// Built-in photos taken off the site in the studio (its "hidden" list, set by
// Remove on a built-in photo or by Take down on a removal request). Their
// files stay in the published site until the next release removes them, so
// netlify/edge-functions/photos.js answers "Not found" for every copy of
// them: the full photo, its thumbnail and its busy-mode (lite, saver) copies.
//
// Each server re-reads the list in the background at most once a minute, so
// a check costs almost nothing; only a server's very first check waits for
// it, briefly.
import { getStore } from "@netlify/blobs";

const REFRESH_MS = 60_000;
const FIRST_WAIT_MS = 300;
const CALL_TIMEOUT_MS = 1_500;
const fetchWithTimeout = (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(CALL_TIMEOUT_MS) });

// Any copy of a built-in photo, to the path the studio stores:
//   /img/portfolio/x.jpg, /img/portfolio/thumb/x.jpg, /img/lite/portfolio/x.jpg,
//   /img/saver/cars/thumb/x.jpg ... -> img/portfolio/x.jpg or img/cars/x.jpg
const COPY = /^\/img\/(?:(?:lite|saver)\/)?(portfolio|cars)\/(?:thumb\/)?([a-z0-9-]{1,60})\.jpg$/;
export function builtInPath(pathname) {
  const match = COPY.exec(pathname);
  return match ? `img/${match[1]}/${match[2]}.jpg` : null;
}

export function createHiddenPhotos() {
  let hidden = new Set();
  let readAt = -Infinity;
  let pending = null;

  function refresh(now) {
    if (!pending) {
      readAt = now;
      pending = getStore({ name: "studio-photos", fetch: fetchWithTimeout })
        .get("hidden", { type: "json" })
        .then((list) => { hidden = new Set(Array.isArray(list) ? list : []); })
        .catch((error) => console.warn("photos: could not read the hidden list; using the last one", error?.message || error))
        .finally(() => { pending = null; });
    }
    return pending;
  }

  // Whether this built-in photo path has been taken off the site.
  async function isHidden(path, now) {
    if (readAt === -Infinity) await Promise.race([refresh(now), new Promise((resolve) => setTimeout(resolve, FIRST_WAIT_MS))]);
    else if (now - readAt >= REFRESH_MS) refresh(now);
    return hidden.has(path);
  }

  return { isHidden };
}
