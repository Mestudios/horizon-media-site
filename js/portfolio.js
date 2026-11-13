// Portfolio and car pages: the full-size photo viewer, and photos added through the
// studio (car photos on the car page, everything else on the portfolio).
(() => {
  const gallery = document.querySelector(".gallery");
  const shots = [...document.querySelectorAll(".shot")];
  const viewer = document.querySelector(".viewer");
  const photo = viewer.querySelector("img");
  const caption = viewer.querySelector(".viewer-cap");
  const count = viewer.querySelector(".viewer-count");
  let open = -1; // position in visible() of the photo being shown
  let opener = null;

  const visible = () => shots;


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
    link.textContent = shot.dataset.post.includes("/p/") ? "See the post on Instagram" : "See more on Instagram";
    caption.append(title, `Photo by @${shot.dataset.credit}. `, link);
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
  const forCars = gallery.dataset.studio === "cars";
  const empty = document.querySelector(".gallery-empty");
  const showEmpty = () => {
    if (empty) empty.hidden = shots.length > 0;
  };
  fetch("portfolio-photos.json")
    .then((response) => (response.ok ? response.json() : []))
    .then((all) => {
      const photos = all.filter((photo) => (photo.sport === "cars") === forCars);
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
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") show(open - 1);
    if (event.key === "ArrowRight") show(open + 1);
  });
})();
