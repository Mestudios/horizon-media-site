// Portfolio and car pages: the full-size photo viewer, photos added through the
// studio (car photos on the car page, everything else on the portfolio), built-in
// photos the studio took off the site, and the "Request this photo" form.
(() => {
  const gallery = document.querySelector(".gallery");
  const shots = [...document.querySelectorAll(".shot")];
  const viewer = document.querySelector(".viewer");
  const canvas = viewer.querySelector(".viewer-photo");
  const caption = viewer.querySelector(".viewer-cap");
  const count = viewer.querySelector(".viewer-count");
  const requestButton = viewer.querySelector(".viewer-request");
  const requestForm = viewer.querySelector("form.request");
  const removal = viewer.querySelector(".removal");
  const removalButton = viewer.querySelector(".viewer-removal");
  const requestStatus = requestForm.querySelector("[role=status]");
  const requestAlert = requestForm.querySelector(".request-alert");
  // A problem sending a request pops up over the form in one plain sentence.
  function showProblem(message) {
    requestStatus.textContent = "";
    requestAlert.querySelector(".request-alert-text").textContent = message;
    requestAlert.hidden = false;
    requestAlert.querySelector(".request-alert-ok").focus();
  }
  requestAlert.querySelector(".request-alert-ok").addEventListener("click", () => {
    requestAlert.hidden = true;
    requestForm.querySelector("button[type=submit]").focus();
  });
  let open = -1; // position in shots of the photo being shown
  let opener = null;
  let loading = 0; // counts loads, so a slow photo never replaces a newer one

  // Busy mode points photos at smaller copies in img/lite/ or img/saver/; the
  // studio and requests always name the photo by its normal path.
  const original = (path) => path.replace(/^img\/(lite|saver)\//, "img/");

  // The Horizon Media mark (the logo's three slashes and the name) drawn at
  // (x0, y0), with its letters `size` pixels tall. Returns how wide it is.
  function mark(context, x0, y0, size, alpha) {
    context.font = "800 " + size + 'px "Big Shoulders Display", "Arial Narrow", Impact, sans-serif';
    const text = "HORIZON MEDIA";
    const metrics = context.measureText(text);
    const cap = metrics.actualBoundingBoxAscent || size * 0.7;
    const slash = cap * 0.62, gap = cap * 0.18;
    const width = 3 * slash + 2 * gap + cap * 0.35 + metrics.width;
    if (alpha === 0) return width;
    context.save();
    context.fillStyle = "rgba(255, 255, 255, " + alpha + ")";
    context.shadowColor = "rgba(0, 0, 0, " + alpha * 0.6 + ")";
    context.shadowBlur = Math.max(1, cap * 0.16);
    for (let i = 0; i < 3; i++) {
      const x = x0 + i * (slash + gap);
      context.beginPath();
      context.moveTo(x + slash * 0.45, y0);
      context.lineTo(x + slash, y0);
      context.lineTo(x + slash * 0.55, y0 + cap);
      context.lineTo(x, y0 + cap);
      context.closePath();
      context.fill();
    }
    context.fillText(text, x0 + 3 * slash + 2 * gap + cap * 0.35, y0 + cap);
    context.restore();
    return width;
  }

  // Covers the whole photo in the viewer with faint, slanted marks in staggered
  // rows, so no part of it can be cropped out unmarked.
  const TILE = { size: 0.055, alpha: 0.28, angle: -Math.PI / 7, across: 1.5, down: 4.2 };
  function watermark(context, width, height) {
    const size = Math.max(10, Math.round(width * TILE.size));
    context.save();
    context.translate(width / 2, height / 2);
    context.rotate(TILE.angle);
    const stepX = mark(context, 0, 0, size, 0) * TILE.across;
    const stepY = size * TILE.down;
    const reach = Math.hypot(width, height) / 2 + stepX;
    let row = 0;
    for (let y = -reach; y < reach; y += stepY, row++) {
      for (let x = -reach + (row % 2) * (stepX / 2); x < reach; x += stepX) mark(context, x, y, size, TILE.alpha);
    }
    context.restore();
  }
  const fontReady = document.fonts ? document.fonts.load('800 40px "Big Shoulders Display"').catch(() => {}) : Promise.resolve();

  // Draws the photo with the mark onto the viewer's canvas, so the photo in the
  // viewer (and anything saved from it) always carries the mark.
  function draw(src) {
    const ticket = ++loading;
    const image = new Image();
    image.onload = async () => {
      await fontReady;
      if (ticket !== loading) return;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      watermark(context, canvas.width, canvas.height);
      canvas.classList.remove("is-loading");
    };
    canvas.classList.add("is-loading");
    image.src = src;
  }

  // Each photo has its own link: the page address plus #photo=<name>, where the
  // name is the photo's file name (golden-hour) or, for studio photos, its id.
  const nameOf = (shot) => original(shot.dataset.full).replace(/^uploads\/([0-9a-f]{16})\/full\.jpg$/, "$1").replace(/^.*\//, "").replace(/\.jpg$/, "");
  const linkTo = (shot) => location.href.split("#")[0] + "#photo=" + nameOf(shot);
  const setAddress = (hash) => history.replaceState(null, "", location.pathname + location.search + hash);

  function show(index) {
    open = (index + shots.length) % shots.length;
    const shot = shots[open];
    setAddress("#photo=" + nameOf(shot));
    draw(shot.dataset.full);
    canvas.setAttribute("aria-label", shot.querySelector("img").alt);
    caption.textContent = "";
    const title = document.createElement("b");
    title.textContent = shot.dataset.title;
    const link = document.createElement("a");
    link.href = shot.dataset.post;
    link.textContent = shot.dataset.post.includes("/p/") ? "See the post on Instagram" : "See more on Instagram";
    const owner = shot.dataset.owner ? ` Car: @${shot.dataset.owner}.` : "";
    caption.append(title, `Photo by @${shot.dataset.credit}.${owner} `, link);
    count.textContent = `${open + 1} / ${shots.length}`;
    requestForm.hidden = true;
    removal.hidden = true;
  }

  function close() {
    viewer.hidden = true;
    setAddress("");
    loading++;
    requestForm.hidden = true;
    removal.hidden = true;
    document.body.style.overflow = "";
    if (opener) opener.focus();
  }

  function openShot(shot) {
    opener = shot;
    show(shots.indexOf(shot));
    viewer.hidden = false;
    document.body.style.overflow = "hidden";
    viewer.querySelector(".viewer-close").focus();
  }
  function wire(shot) {
    shot.addEventListener("click", () => openShot(shot));
  }
  // Opens the photo a shared link points at, once every photo is on the page.
  function openFromLink() {
    const wanted = /^#photo=([a-z0-9-]{1,60})$/.exec(location.hash);
    const shot = wanted && shots.find((s) => nameOf(s) === wanted[1]);
    if (shot) openShot(shot);
  }

  // ---- Share: the phone's own share menu, or copy the link on computers.
  const toast = viewer.querySelector(".viewer-toast");
  let toastTimer = 0;
  const say = (text) => { toast.textContent = text; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.textContent = ""; }, 2500); };
  viewer.querySelector(".viewer-share").addEventListener("click", async () => {
    const shot = shots[open];
    const data = { title: shot.dataset.title + " · Horizon Media", text: shot.dataset.title + ", photo by @" + shot.dataset.credit, url: linkTo(shot) };
    if (navigator.share) {
      try { await navigator.share(data); } catch (error) {}
      return;
    }
    try { await navigator.clipboard.writeText(data.url); say("Link copied"); }
    catch (error) { window.prompt("Copy this link:", data.url); }
  });
  shots.forEach(wire);

  // Photos fade in over their blurry preview as they arrive.
  function fadeIn(image) {
    if (image.complete) return;
    image.classList.add("is-loading");
    const done = () => image.classList.remove("is-loading");
    image.addEventListener("load", done, { once: true });
    image.addEventListener("error", done, { once: true });
  }
  shots.forEach((shot) => fadeIn(shot.querySelector("img")));

  // Phones: swipe left or right on an open photo to go to the next or previous one.
  let touch = null;
  viewer.addEventListener("touchstart", (event) => {
    touch = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  viewer.addEventListener("touchend", (event) => {
    if (!touch || !requestForm.hidden || !removal.hidden) return;
    const dx = event.changedTouches[0].clientX - touch.x;
    const dy = event.changedTouches[0].clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(open + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // ---- "Request this photo": a short form; requests appear in the studio.
  function openRequest() {
    const shot = shots[open];
    removal.hidden = true;
    requestForm.reset();
    requestForm.elements.photo.value = original(shot.dataset.full);
    requestForm.elements.title.value = shot.dataset.title;
    requestForm.querySelector(".request-photo").textContent = shot.dataset.title;
    requestStatus.textContent = "";
    requestAlert.hidden = true;
    requestForm.querySelector(".request-done").hidden = true;
    requestForm.querySelector(".request-fields").hidden = false;
    requestForm.hidden = false;
    requestForm.elements.name.focus();
  }
  function closeRequest() {
    if (requestForm.hidden) return;
    requestForm.hidden = true;
    if (!viewer.hidden) requestButton.focus();
  }
  requestButton.addEventListener("click", openRequest);

  // ---- "Request removal": a short form that goes straight to the studio, or
  // an email or Instagram message that names the photo, so anyone pictured (or
  // a parent or guardian, or a car's owner) can have it taken down.
  const removalForm = removal.querySelector(".removal-form");
  const removalStatus = removalForm.querySelector("[role=status]");
  const removalDone = removal.querySelector(".removal-done");
  function openRemoval() {
    const shot = shots[open];
    requestForm.hidden = true;
    removal.querySelector(".removal-photo").textContent = shot.dataset.title;
    const email = removal.querySelector(".removal-email");
    const subject = "Please remove a photo: " + shot.dataset.title;
    const body = "Please remove this photo from the Horizon Media website:\n\n" + shot.dataset.title + "\n" + linkTo(shot) + "\n\nI am (in the photo / a parent or guardian / the car's owner): ";
    email.href = email.href.split("?")[0] + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    removalForm.reset();
    removalForm.elements.photo.value = original(shot.dataset.full);
    removalForm.elements.title.value = shot.dataset.title;
    removalStatus.textContent = "";
    removalForm.hidden = false;
    removalDone.hidden = true;
    removal.hidden = false;
    removalForm.elements.name.focus();
  }
  removalForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const send = removalForm.querySelector("button[type=submit]");
    send.disabled = true;
    removalStatus.textContent = "Sending...";
    try {
      const response = await fetch("removal-request", { method: "POST", body: new FormData(removalForm) });
      if (response.ok) {
        removalStatus.textContent = "";
        removalForm.hidden = true;
        removalDone.hidden = false;
        removalDone.focus();
      } else {
        const reply = await response.json().catch(() => ({}));
        removalStatus.textContent = reply.error || "Something went wrong on our end, so please email us or message us on Instagram instead.";
      }
    } catch (error) {
      removalStatus.textContent = "Your request didn't go through because of a connection problem, so please try again or email us.";
    }
    send.disabled = false;
  });
  function closeRemoval() {
    if (removal.hidden) return;
    removal.hidden = true;
    if (!viewer.hidden) removalButton.focus();
  }
  removalButton.addEventListener("click", openRemoval);
  removal.querySelector(".removal-close").addEventListener("click", closeRemoval);
  // Instagram can't be opened with a message filled in, so the photo's name and
  // link are copied, ready to paste.
  removal.querySelector(".removal-dm").addEventListener("click", () => {
    const shot = shots[open];
    if (navigator.clipboard) navigator.clipboard.writeText("Please remove this photo: " + shot.dataset.title + " " + linkTo(shot)).catch(() => {});
  });
  requestForm.querySelector(".request-cancel").addEventListener("click", closeRequest);
  requestForm.querySelector(".request-close").addEventListener("click", closeRequest);
  requestForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const send = requestForm.querySelector("button[type=submit]");
    send.disabled = true;
    requestStatus.textContent = "Sending...";
    try {
      const response = await fetch("photo-request", { method: "POST", body: new FormData(requestForm) });
      if (response.ok) {
        requestStatus.textContent = "";
        requestForm.querySelector(".request-fields").hidden = true;
        const done = requestForm.querySelector(".request-done");
        done.hidden = false;
        done.focus(); // so keyboard and screen-reader users land on the thank-you
      } else {
        const reply = await response.json().catch(() => ({}));
        showProblem(reply.error || "Something went wrong on our end, so please try again later or message us on Instagram.");
      }
    } catch (error) {
      showProblem("Your request didn't go through because of a connection problem, so please check your internet and try again.");
    }
    send.disabled = false;
  });

  // ---- Photos added through the studio (/studio) come first, newest at the top;
  // built-in photos the studio removed are taken out.
  const forCars = gallery.dataset.studio === "cars";
  const forRecap = gallery.dataset.studio === "recap";
  const empty = document.querySelector(".gallery-empty");
  const showEmpty = () => {
    if (empty) empty.hidden = shots.length > 0;
  };
  // A shot for a photo given by its path, title and credit (studio photos and recaps).
  function makeShot({ path, title, credit, owner, alt, sport, isNew }) {
    const shot = document.createElement("button");
    shot.className = "shot";
    shot.type = "button";
    if (sport) shot.dataset.sport = sport;
    shot.dataset.full = path;
    shot.dataset.title = title;
    shot.dataset.credit = credit;
    if (owner) shot.dataset.owner = owner;
    shot.dataset.post = `https://www.instagram.com/${encodeURIComponent(credit)}/`;
    const image = document.createElement("img");
    image.src = path.replace(/\/full\.jpg$/, "/thumb.jpg").replace(/^img\/(portfolio|cars)\//, "img/$1/thumb/");
    image.alt = alt || title;
    image.loading = "lazy";
    fadeIn(image);
    const info = document.createElement("span");
    info.className = "shot-info";
    const name = document.createElement("b");
    name.textContent = title;
    const by = document.createElement("span");
    by.textContent = `Photo by @${credit}` + (owner ? ` · Car: @${owner}` : "");
    info.append(name, by);
    shot.append(image, info);
    if (isNew) {
      const tag = document.createElement("span");
      tag.className = "shot-new";
      tag.textContent = "New";
      shot.append(tag);
    }
    wire(shot);
    return shot;
  }

  // ---- A recap page (recap.html?r=<id>): only the photos chosen in the studio.
  function loadRecap() {
    const id = new URLSearchParams(location.search).get("r") || "";
    const heading = document.querySelector(".recap-title");
    const missing = () => {
      heading.textContent = "Recap not found";
      document.querySelector(".recap-text").textContent = "This recap has been taken down, or the link is wrong. See all our photos in the portfolio.";
      showEmpty();
    };
    if (!/^[0-9a-f]{16}$/.test(id)) return missing();
    fetch(`recaps/${id}.json`)
      .then((response) => (response.ok ? response.json() : null))
      .then((recap) => {
        if (!recap) return missing();
        heading.textContent = recap.title;
        document.title = recap.title + " · Horizon Media";
        document.querySelector(".recap-text").textContent = recap.text || "";
        const date = document.querySelector(".recap-date");
        date.textContent = new Date(recap.date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
        date.dateTime = recap.date;
        const added = recap.photos.map((photo) => makeShot(photo));
        gallery.append(...added);
        shots.push(...added);
        showEmpty();
        openFromLink();
      })
      .catch(missing);
  }

  if (forRecap) loadRecap();
  else fetch("portfolio-photos.json")
    .then((response) => (response.ok ? response.json() : {}))
    .then(({ photos = [], hidden = [], pins = [] }) => {
      for (const shot of [...shots]) {
        if (hidden.includes(original(shot.dataset.full))) {
          shot.remove();
          shots.splice(shots.indexOf(shot), 1);
        }
      }
      const added = photos.filter((photo) => (photo.sport === "cars") === forCars).map((photo) =>
        makeShot({ path: `uploads/${photo.id}/full.jpg`, title: photo.title, credit: photo.credit, owner: photo.owner, alt: photo.alt, sport: photo.sport, isNew: Date.now() - (photo.liveAt || photo.added) < 7 * 86_400_000 }));
      gallery.prepend(...added);
      shots.unshift(...added);
      // Pinned photos come first, in the studio's order.
      const pinned = pins.map((path) => shots.find((shot) => original(shot.dataset.full) === path)).filter(Boolean);
      // Each pinned photo gets a little pin in its top-right corner.
      for (const shot of pinned) {
        if (shot.querySelector(".shot-pin")) continue;
        const pin = document.createElement("span");
        pin.className = "shot-pin";
        pin.title = "Pinned";
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("aria-hidden", "true");
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M9 3h6l-1 6 4 4v2h-5v6l-1 1-1-1v-6H6v-2l4-4z");
        svg.append(path);
        const label = document.createElement("span");
        label.className = "visually-hidden";
        label.textContent = "Pinned";
        pin.append(svg, label);
        shot.append(pin);
      }
      if (pinned.length) {
        gallery.prepend(...pinned);
        shots.splice(0, shots.length, ...pinned, ...shots.filter((shot) => !pinned.includes(shot)));
      }
      showEmpty();
      openFromLink();
    })
    .catch(() => { showEmpty(); openFromLink(); });
  viewer.querySelector(".viewer-close").addEventListener("click", close);
  viewer.querySelector(".viewer-prev").addEventListener("click", () => show(open - 1));
  viewer.querySelector(".viewer-next").addEventListener("click", () => show(open + 1));
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) close();
  });
  // Keyboard: while the viewer is open, Tab and Shift+Tab stay inside it (inside
  // the request form, its pop-up or the removal box when one of those is open).
  function focusables() {
    const scope = !requestAlert.hidden ? requestAlert : !requestForm.hidden ? requestForm : !removal.hidden ? removal : viewer;
    return [...scope.querySelectorAll("a[href], button, input, textarea, select")].filter((el) => !el.disabled && el.offsetParent !== null && !el.closest("[hidden]") && el.tabIndex !== -1);
  }
  document.addEventListener("keydown", (event) => {
    if (viewer.hidden || event.key !== "Tab") return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || !items.includes(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !items.includes(document.activeElement))) { event.preventDefault(); first.focus(); }
  });
  document.addEventListener("keydown", (event) => {
    if (viewer.hidden) return;
    if (event.key === "Escape") {
      if (!removal.hidden) return closeRemoval();
      return requestForm.hidden ? close() : !requestAlert.hidden ? (requestAlert.hidden = true) : closeRequest();
    }
    if (!requestForm.hidden || !removal.hidden) return; // a box is open
    if (event.key === "ArrowLeft") show(open - 1);
    if (event.key === "ArrowRight") show(open + 1);
  });
})();
