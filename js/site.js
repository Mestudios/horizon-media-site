// On every page: the light/dark switch in the menu bar, and the "Add to home screen"
// button where the browser offers one.
(() => {
  const root = document.documentElement;
  const KEY = "hm-theme"; // the visitor's choice, kept only in their own browser
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)");
  const shown = () => root.dataset.theme || (prefersLight.matches ? "light" : "dark");
  const meta = document.querySelector('meta[name="theme-color"]');

  function update() {
    root.dataset.shownTheme = shown();
    if (meta) meta.content = shown() === "light" ? "#f6f4ef" : "#0a0a0a";
    if (toggle) toggle.setAttribute("aria-label", shown() === "light" ? "Switch to dark mode" : "Switch to light mode");
  }

  const links = document.querySelector(".nav-links") || document.querySelector(".nav .wrap");
  let toggle = null;
  if (links) {
    toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "theme-toggle";
    toggle.innerHTML =
      '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' +
      '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    toggle.addEventListener("click", () => {
      const next = shown() === "light" ? "dark" : "light";
      // Picking what the device already uses goes back to following the device.
      const matchesDevice = (next === "light") === prefersLight.matches;
      if (matchesDevice) delete root.dataset.theme;
      else root.dataset.theme = next;
      try {
        if (matchesDevice) localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, next);
      } catch (error) {}
      update();
    });
    links.append(toggle);
  }
  prefersLight.addEventListener("change", update);
  update();

  // The service worker (sw.js) lets team members share photos from a phone's
  // gallery straight into the studio. Only the studio installs it, and it only
  // covers /studio/, so visitors' browsers never get it.
  const inStudio = location.pathname === "/studio" || location.pathname.startsWith("/studio/");
  if (inStudio && "serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js", { scope: "/studio/" }).catch(() => {});

  // The studio link is not written into any page. It is added to the footer
  // only on devices that have signed in to the studio (which saves "hm-team"
  // in that browser), so visitors never see it.
  let team = false;
  try { team = localStorage.getItem("hm-team") === "1"; } catch (error) {}
  const footLinks = document.querySelector(".foot-links");
  if (team && footLinks) {
    const studio = document.createElement("a");
    studio.href = "/studio";
    studio.textContent = "Studio";
    footLinks.append(studio);
  }

  // Android and computer browsers offer to install the site; iPhones do it from the Share menu.
  let installPrompt = null;
  const brand = document.querySelector(".foot-brand");
  if (brand) {
    const install = document.createElement("button");
    install.type = "button";
    install.className = "btn install-app";
    install.textContent = "Add to home screen";
    install.hidden = true;
    brand.append(install);
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      installPrompt = event;
      install.hidden = false;
    });
    install.addEventListener("click", async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      await installPrompt.userChoice.catch(() => {});
      installPrompt = null;
      install.hidden = true;
    });
    window.addEventListener("appinstalled", () => { install.hidden = true; });
  }
})();
