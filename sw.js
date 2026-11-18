// Horizon Media's service worker. It does one thing: when the site is installed
// on a phone's home screen and photos are shared to it from the gallery
// (manifest.webmanifest's share_target), it keeps them on the device for a
// moment and opens the studio's Add photos page, which picks them up.
// Every other request goes to the network as usual; nothing is cached.
const SHARE = "/studio/share-target";
const BOX = "studio-share";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "POST" || url.origin !== self.location.origin || url.pathname !== SHARE) return;
  event.respondWith((async () => {
    const form = await event.request.formData();
    const files = form.getAll("photos").filter((file) => file instanceof File && file.type.startsWith("image/")).slice(0, 30);
    await caches.delete(BOX);
    const box = await caches.open(BOX);
    await Promise.all(files.map((file, i) => box.put(`/studio/shared/${i}`, new Response(file, { headers: { "content-type": file.type, "x-file-name": encodeURIComponent(file.name) } }))));
    return Response.redirect(`/studio?shared=${files.length}#add`, 303);
  })());
});
