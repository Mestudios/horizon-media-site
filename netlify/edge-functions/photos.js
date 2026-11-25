// Runs in front of the built-in photo files (img/portfolio, img/cars and their
// thumbnail and busy-mode copies). A photo taken off the site in the studio,
// for example after a removal request, answers "Not found" at every address
// within a minute; every other photo is passed straight through.
// The list is read in ../guard/hidden.js.
import { builtInPath, createHiddenPhotos } from "../guard/hidden.js";
import { SECURITY_HEADERS } from "../guard/settings.js";

const photos = createHiddenPhotos();

export default async function photoGate(request) {
  const path = builtInPath(new URL(request.url).pathname);
  if (path === null || !(await photos.isHidden(path, Date.now()))) return;
  return new Response("Not found", {
    status: 404,
    headers: { ...SECURITY_HEADERS, "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

export const config = {
  path: ["/img/portfolio/*", "/img/cars/*", "/img/lite/portfolio/*", "/img/lite/cars/*", "/img/saver/portfolio/*", "/img/saver/cars/*"],
  method: "GET",
  // If the check ever fails, Netlify serves the file as before.
  onError: "bypass",
};
