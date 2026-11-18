// Presets page: shows the free presets added in the studio (/presets.json),
// each with a before/after slider and its downloads. Until there are any, the
// "Coming December 2026" cards written into presets.html stay.
(() => {
  const list = document.querySelector(".presets-list");
  if (!list) return;

  function compare(preset) {
    const box = document.createElement("div");
    box.className = "compare";
    const after = document.createElement("img");
    after.src = `preset-files/${preset.id}/after?v=${preset.added}`;
    after.alt = `${preset.name}: after the preset`;
    const beforeWrap = document.createElement("div");
    beforeWrap.className = "compare-before";
    const before = document.createElement("img");
    before.src = `preset-files/${preset.id}/before?v=${preset.added}`;
    before.alt = `${preset.name}: before the preset`;
    beforeWrap.append(before);
    const labels = document.createElement("div");
    labels.className = "compare-labels";
    labels.innerHTML = "<span>Before</span><span>After</span>";
    labels.setAttribute("aria-hidden", "true");
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = "50";
    slider.setAttribute("aria-label", `Compare ${preset.name} before and after`);
    const set = () => box.style.setProperty("--split", slider.value + "%");
    slider.addEventListener("input", set);
    set();
    box.append(after, beforeWrap, labels, slider);
    return box;
  }

  function card(preset) {
    const article = document.createElement("article");
    article.className = "ann preset";
    if (preset.has.before && preset.has.after) article.append(compare(preset));
    else if (preset.has.after || preset.has.before) {
      const image = document.createElement("img");
      image.className = "preset-photo";
      image.src = `preset-files/${preset.id}/${preset.has.after ? "after" : "before"}?v=${preset.added}`;
      image.alt = preset.name;
      article.append(image);
    }
    const name = document.createElement("h3");
    name.textContent = preset.name;
    const text = document.createElement("p");
    text.textContent = preset.text || "";
    const downloads = document.createElement("div");
    downloads.className = "btns";
    for (const [kind, label] of [["dng", "Phone (.dng)"], ["xmp", "Computer (.xmp)"]]) {
      if (!preset.has[kind]) continue;
      const link = document.createElement("a");
      link.className = "btn" + (kind === "dng" ? " btn-hot" : "");
      link.href = `preset-files/${preset.id}/${kind}`;
      link.setAttribute("download", "");
      link.textContent = `Download for ${label}`;
      downloads.append(link);
    }
    article.append(name, text, downloads);
    return article;
  }

  fetch("presets.json")
    .then((response) => (response.ok ? response.json() : []))
    .then((presets) => {
      if (!presets.length) return;
      list.replaceChildren(...presets.map(card));
      list.classList.add("has-presets");
      const kicker = document.querySelector(".page-top .kicker");
      if (kicker) kicker.textContent = "Free to download";
      const section = list.closest("section");
      section.querySelector("h2").textContent = "Pick a look";
      section.querySelector(".lede").textContent = "Drag across each photo to see it before and after. Download the file for your phone or computer, then follow the steps below.";
      const cta = document.querySelector(".page-top .page-cta a");
      if (cta) cta.textContent = "Follow @hor1zonmedia for new presets";
    })
    .catch(() => {});
})();
