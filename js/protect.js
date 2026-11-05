// Makes casual photo saving harder: blocks the right-click menu and dragging on photos.
// It won't stop screenshots or someone determined, but it stops quick "Save Image As…".
document.addEventListener("contextmenu", (e) => {
  if (e.target.closest("img, .hero-photo, .shot")) e.preventDefault();
});
document.addEventListener("dragstart", (e) => {
  if (e.target.closest("img")) e.preventDefault();
});
