// Portfolio page: the sport filter and the full-size photo viewer.
(() => {
  const gallery = document.querySelector(".gallery");
  const shots = [...document.querySelectorAll(".shot")];
  const filterGroup = document.querySelector(".filters");
  const filters = [...filterGroup.querySelectorAll("button")];
  const SPORT_NAMES = {
    football: "Football", soccer: "Soccer", volleyball: "Volleyball", "cross-country": "Cross Country",
    basketball: "Basketball", wrestling: "Wrestling", "indoor-track": "Indoor Track",
    lacrosse: "Lacrosse", baseball: "Baseball", softball: "Softball", "track-and-field": "Track & Field", other: "Other",
  };
  const viewer = document.querySelector(".viewer");
  const photo = viewer.querySelector("img");
  const caption = viewer.querySelector(".viewer-cap");
  const count = viewer.querySelector(".viewer-count");
  let open = -1; // position in visible() of the photo being shown
  let opener = null;

  const visible = () => shots.filter((shot) => !shot.hidden);

  function useFilter(button) {
    button.addEventListener("click", () => {
      for (const other of filters) other.setAttribute("aria-pressed", String(other === button));
      for (const shot of shots) shot.hidden = button.dataset.filter !== "all" && shot.dataset.sport !== button.dataset.filter;
    });
  }
  filters.forEach(useFilter);

  function show(index) {
    const list = visible();
    open = (index + list.length) % list.length;
    const shot = list[open];
    photo.src = shot.dataset.full;
    photo.alt = shot.querySelector("img").alt;
    caption.textContent = "";
    const title = document.createElement("b");
    title.textContent = shot.dataset.title;
    const link = document.createElement("a");
    link.href = shot.dataset.post;
    link.textContent = shot.dataset.credit ? "See more on Instagram" : "See the post on Instagram";
    caption.append(title, `Photo by @${shot.dataset.credit || "cb.framed.it"}. `, link);
    count.textContent = `${open + 1} / ${list.length}`;
  }

  function close() {
    viewer.hidden = true;
    photo.removeAttribute("src");
    document.body.style.overflow = "";
    if (opener) opener.focus();
  }

  function wire(shot) {
    shot.addEventListener("click", () => {
      opener = shot;
      show(visible().indexOf(shot));
      viewer.hidden = false;
      document.body.style.overflow = "hidden";
      viewer.querySelector(".viewer-close").focus();
    });
  }
  shots.forEach(wire);

  // Photos added through the studio (/studio) come first, newest at the top.
  fetch("portfolio-photos.json")
    .then((response) => (response.ok ? response.json() : []))
    .then((photos) => {
      const added = photos.map((photo) => {
        const shot = document.createElement("button");
        shot.className = "shot";
        shot.type = "button";
        shot.dataset.sport = photo.sport;
        shot.dataset.full = `uploads/${photo.id}/full.jpg`;
        shot.dataset.title = photo.title;
        shot.dataset.credit = photo.credit;
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
        credit.textContent = `Photo by @${photo.credit}`;
        info.append(title, credit);
        shot.append(image, info);
        wire(shot);
        return shot;
      });
      gallery.prepend(...added);
      shots.unshift(...added);
      // Add a button for any sport that has photos but no button yet.
      const order = Object.keys(SPORT_NAMES);
      const present = [...new Set(shots.map((shot) => shot.dataset.sport))].sort((a, b) => order.indexOf(a) - order.indexOf(b));
      for (const sport of present) {
        if (filters.some((button) => button.dataset.filter === sport)) continue;
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.filter = sport;
        button.setAttribute("aria-pressed", "false");
        button.append(`${SPORT_NAMES[sport] || "Other"} `, document.createElement("span"));
        const after = filters.filter((b) => b.dataset.filter !== "all" && order.indexOf(b.dataset.filter) > order.indexOf(sport))[0];
        filterGroup.insertBefore(button, after || null);
        filters.push(button);
        useFilter(button);
      }
      for (const button of filters) {
        const sport = button.dataset.filter;
        button.querySelector("span").textContent = shots.filter((shot) => sport === "all" || shot.dataset.sport === sport).length;
      }
    })
    .catch(() => {});
  viewer.querySelector(".viewer-close").addEventListener("click", close);
  viewer.querySelector(".viewer-prev").addEventListener("click", () => show(open - 1));
  viewer.querySelector(".viewer-next").addEventListener("click", () => show(open + 1));
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) close();
  });
  document.addEventListener("keydown", (event) => {
    if (viewer.hidden) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") show(open - 1);
    if (event.key === "ArrowRight") show(open + 1);
  });
})();
