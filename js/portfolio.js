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
  const requestForm = viewer.querySelector(".request");
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

  function show(index) {
    open = (index + shots.length) % shots.length;
    const shot = shots[open];
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
    closeRequest();
  }

  function close() {
    viewer.hidden = true;
    loading++;
    closeRequest();
    document.body.style.overflow = "";
    if (opener) opener.focus();
  }

  function wire(shot) {
    shot.addEventListener("click", () => {
      opener = shot;
      show(shots.indexOf(shot));
      viewer.hidden = false;
      document.body.style.overflow = "hidden";
      viewer.querySelector(".viewer-close").focus();
    });
  }
  shots.forEach(wire);

  // ---- "Request this photo": a short form; requests appear in the studio.
  function openRequest() {
    const shot = shots[open];
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
    requestForm.hidden = true;
  }
  requestButton.addEventListener("click", openRequest);
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
        requestForm.querySelector(".request-done").hidden = false;
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
  const empty = document.querySelector(".gallery-empty");
  const showEmpty = () => {
    if (empty) empty.hidden = shots.length > 0;
  };
  fetch("portfolio-photos.json")
    .then((response) => (response.ok ? response.json() : {}))
    .then(({ photos = [], hidden = [] }) => {
      for (const shot of [...shots]) {
        if (hidden.includes(original(shot.dataset.full))) {
          shot.remove();
          shots.splice(shots.indexOf(shot), 1);
        }
      }
      const added = photos.filter((photo) => (photo.sport === "cars") === forCars).map((photo) => {
        const shot = document.createElement("button");
        shot.className = "shot";
        shot.type = "button";
        shot.dataset.sport = photo.sport;
        shot.dataset.full = `uploads/${photo.id}/full.jpg`;
        shot.dataset.title = photo.title;
        shot.dataset.credit = photo.credit;
        if (photo.owner) shot.dataset.owner = photo.owner;
        shot.dataset.post = `https://www.instagram.com/${encodeURIComponent(photo.credit)}/`;
        const image = document.createElement("img");
        image.src = `uploads/${photo.id}/thumb.jpg`;
        image.alt = photo.title;
        image.loading = "lazy";
        const info = document.createElement("span");
        info.className = "shot-info";
        const title = document.createElement("b");
        title.textContent = photo.title;
        const credit = document.createElement("span");
        credit.textContent = `Photo by @${photo.credit}` + (photo.owner ? ` · Car: @${photo.owner}` : "");
        info.append(title, credit);
        shot.append(image, info);
        wire(shot);
        return shot;
      });
      gallery.prepend(...added);
      shots.unshift(...added);
      showEmpty();
    })
    .catch(showEmpty);
  viewer.querySelector(".viewer-close").addEventListener("click", close);
  viewer.querySelector(".viewer-prev").addEventListener("click", () => show(open - 1));
  viewer.querySelector(".viewer-next").addEventListener("click", () => show(open + 1));
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) close();
  });
  document.addEventListener("keydown", (event) => {
    if (viewer.hidden) return;
    if (event.key === "Escape") return requestForm.hidden ? close() : !requestAlert.hidden ? (requestAlert.hidden = true) : closeRequest();
    if (!requestForm.hidden) return; // typing in the form
    if (event.key === "ArrowLeft") show(open - 1);
    if (event.key === "ArrowRight") show(open + 1);
  });
})();
