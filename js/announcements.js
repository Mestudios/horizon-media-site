// Homepage: adds announcements posted in the studio (/studio) to the ones
// written into index.html, and shows the newest three, newest date first.
(() => {
  const list = document.querySelector(".ann-list");
  if (!list) return;
  const SHOW = 3;
  const builtIn = [...list.querySelectorAll(".ann")].map((card) => ({
    date: card.querySelector("time").getAttribute("datetime"),
    added: 0,
    card,
  }));

  function card({ date, title, text }) {
    const article = document.createElement("article");
    article.className = "ann";
    const when = document.createElement("time");
    when.setAttribute("datetime", date);
    when.textContent = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const heading = document.createElement("h3");
    heading.textContent = title;
    const body = document.createElement("p");
    body.textContent = text;
    article.append(when, heading, body);
    return article;
  }

  fetch("announcements.json")
    .then((response) => (response.ok ? response.json() : []))
    .then((posted) => {
      if (posted.length === 0) return;
      const all = [...posted.map((item) => ({ date: item.date, added: item.added, card: card(item) })), ...builtIn];
      all.sort((a, b) => b.date.localeCompare(a.date) || b.added - a.added);
      list.replaceChildren(...all.slice(0, SHOW).map((item) => item.card));
    })
    .catch(() => {});
})();
