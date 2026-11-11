// Photo protection. NOT A SECURITY CONTROL: these are deterrents against
// casual copying, and anyone determined can get round every one of them (or
// simply turn JavaScript off). Nothing should rely on this file.
//
// What actually protects the photos happens before they reach the browser:
// the site only publishes watermarked, web-sized copies, and the originals
// stay out of the public site (see tools/make_photo_variants.py).

// 1. Saving: blocks the right-click menu and dragging on photos, which stops
//    the quick "Save Image As…".
document.addEventListener("contextmenu", (e) => {
  if (e.target.closest("img, .hero-photo, .shot")) e.preventDefault();
});
document.addEventListener("dragstart", (e) => {
  if (e.target.closest("img")) e.preventDefault();
});

// 2. Screenshots, on computers only. A web page is never told that a screenshot
//    is being taken. But the usual ways of taking one either start with a
//    recognisable key combination or move focus away from the page first, so
//    the photos are blurred the moment either happens (.shield in site.css) and
//    sharpen again when the visitor comes back.
//    On phones and tablets a screenshot is taken with hardware buttons the page
//    cannot see, so nothing is done there.
(() => {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const HOLD_MS = 3000; // stay blurred at least this long after a screenshot shortcut
  const GIVE_UP_MS = 10000; // then sharpen by itself, even if the visitor does nothing
  const root = document.documentElement;
  const isMac = /mac/i.test((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "");
  let holdUntil = 0;
  let giveUp;

  const blurPhotos = () => root.classList.add("shield");
  const sharpen = () => {
    if (performance.now() >= holdUntil) root.classList.remove("shield");
  };
  const sharpenIfActive = () => {
    if (document.hasFocus()) sharpen();
  };

  // Leaving the page: another window or tab, or the browser's own menus and tools.
  window.addEventListener("blur", blurPhotos);
  window.addEventListener("focus", sharpen);
  window.addEventListener("pageshow", sharpenIfActive);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) blurPhotos();
    else sharpenIfActive();
  });

  // Screenshot shortcuts: Cmd+Shift+3/4/5 on a Mac; the Windows key (Win+Shift+S)
  // or Print Screen elsewhere; Ctrl+Shift+S for the browser's own screenshot tool.
  const isScreenshotKey = (e) => {
    const key = e.key || "";
    return (
      key === "PrintScreen" ||
      (isMac ? e.metaKey && e.shiftKey : key === "Meta") ||
      (e.ctrlKey && e.shiftKey && key.toLowerCase() === "s")
    );
  };
  const onKey = (e) => {
    if (isScreenshotKey(e)) {
      holdUntil = performance.now() + HOLD_MS;
      blurPhotos();
      clearTimeout(giveUp);
      giveUp = setTimeout(sharpenIfActive, GIVE_UP_MS);
    } else if (e.type === "keydown") {
      sharpen();
    }
  };
  document.addEventListener("keydown", onKey, true);
  document.addEventListener("keyup", onKey, true); // Print Screen is only reported on release

  // Coming back: using the page sharpens the photos again.
  document.addEventListener("pointerdown", sharpen, true);
  document.addEventListener("pointermove", sharpenIfActive, { passive: true });
  document.addEventListener("wheel", sharpenIfActive, { passive: true });
})();
