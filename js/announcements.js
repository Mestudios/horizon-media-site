// Homepage: shows the announcements managed in the studio (/studio), newest
// three first. The cards written into index.html are only a fallback for when
// the list can't be loaded.
(() => {
  const list = document.querySelector(".ann-list");
  if (!list) return;
  const SHOW = 3;

  function card({ date, title, text, link, linkText }) {
    const article = document.createElement("article");
    article.className = "ann";
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
