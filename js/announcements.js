// Homepage: shows the announcements managed in the studio (/studio), newest
// three first. The cards written into index.html are only a fallback for when
// the list can't be loaded.
(() => {
  const list = document.querySelector(".ann-list");
  if (!list) return;
  const SHOW = 3;

  // A photo picked from the portfolio or car page shows its smaller copy.
  const smallCopy = (path) => path.replace(/\/full\.jpg$/, "/thumb.jpg").replace(/^img\/(portfolio|cars)\//, "img/$1/thumb/");
  function card({ id, date, title, text, link, linkText, photo, photoPath }) {
    const article = document.createElement("article");
    article.className = "ann" + (photo || photoPath ? " has-photo" : "");
    if (photo || photoPath) {
      const image = document.createElement("img");
      image.src = photo ? `announcement-photos/${id}.jpg?v=${photo}` : smallCopy(photoPath);
      image.alt = "";
      image.loading = "lazy";
      // If the photo can't be loaded, the card simply goes without it.
      image.addEventListener("error", () => { image.remove(); article.classList.remove("has-photo"); });
      article.append(image);
    }
    const when = document.createElement("time");
    when.setAttribute("datetime", date);
    when.textContent = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const heading = document.createElement("h3");
    heading.textContent = title;
    const body = document.createElement("p");
    body.textContent = text;
    if (link) {
      const anchor = document.createElement("a");
      anchor.href = link;
      anchor.textContent = linkText || "Read more";
      body.append(" ", anchor);
    }
    article.append(when, heading, body);
    return article;
  }

  fetch("announcements.json")
    .then((response) => {
      if (!response.ok) throw new Error("no list");
      return response.json();
    })
    .then((items) => {
      if (items.length === 0) {
        const none = document.createElement("p");
        none.className = "lede";
        none.textContent = "No announcements right now. Follow us on Instagram for the latest.";
        list.replaceChildren(none);
        return;
      }
      list.replaceChildren(...items.slice(0, SHOW).map(card));
    })
    .catch(() => {});
})();
