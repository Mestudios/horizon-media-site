// Booking page: Google's form only loads once the visitor asks for it, because
// it lets Google set its own cookies. The choice can be remembered on this
// device (saved in the browser as "hm-forms"; never sent to us).
(() => {
  const KEY = "hm-forms";
  const consent = document.getElementById("book-consent");
  const frame = document.getElementById("book-frame");
  const fallback = document.getElementById("book-fallback");
  const remember = document.getElementById("remember-form");
  if (!consent || !frame) return;

  function load() {
    const iframe = frame.querySelector("iframe");
    iframe.src = iframe.dataset.src;
    consent.hidden = true;
    frame.hidden = false;
    fallback.hidden = false;
  }
  document.getElementById("load-form").addEventListener("click", () => {
    if (remember.checked) {
      try { localStorage.setItem(KEY, "yes"); } catch (error) {}
    }
    load();
    frame.querySelector("iframe").focus();
  });
  let remembered = false;
  try { remembered = localStorage.getItem(KEY) === "yes"; } catch (error) {}
  if (remembered) load();
})();
