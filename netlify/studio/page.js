import { SEASONS } from "./sports.js";
import { MAX_REQUESTS, WARN_REQUESTS } from "./limits.js";

// The team, as listed on the homepage. Tapping a name fills in the photo credit.
const TEAM = ["cb.framed.it", "visuals_alex_", "createddbyabby", "connors.visualss"];

// The studio's one page. `state` is "off" (no password set in Netlify yet),
// "out" (show the sign-in form) or "in" (show the add and remove tools).
const head = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Studio · Horizon Media</title><script>try{var t=localStorage.getItem("hm-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}</script><link rel="stylesheet" href="/css/site.css"><style>
.studio{width:min(720px,100% - 40px);margin:0 auto;padding:48px 0 80px}
.studio h1{font-family:var(--display);font-weight:800;text-transform:uppercase;font-size:clamp(40px,7vw,64px);line-height:.95;margin:0 0 20px}
.studio label{display:block;margin:16px 0 6px;font-weight:600;font-size:14px}
.studio input,.studio select{width:100%;padding:12px;font:inherit;color:var(--chalk);background:var(--panel);border:1px solid var(--line);border-radius:4px}
.studio button{margin-top:20px}
.studio .note{color:var(--dim);font-size:14px}
#login button{display:block;margin:28px auto 0;padding:16px 48px;min-width:240px;font-size:19px}
#login [role=status]{text-align:center}
.studio [role=status]{min-height:1.5em;margin-top:14px;color:var(--accent-2)}
.studio ul{list-style:none;padding:0;margin:28px 0 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.studio li img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:6px;display:block}
.studio li b{display:block;font-size:14px;margin-top:6px}
.studio li button{margin-top:8px;padding:10px 18px;min-height:44px;font-size:15px}
.studio .btn-danger{border-color:#b3261e;color:var(--danger)}
.studio .btn-danger:hover{background:#b3261e;border-color:#b3261e;color:#fff}
.studio h2{font-family:var(--display);font-weight:800;text-transform:uppercase;font-size:34px;margin:56px 0 4px}
.studio textarea{width:100%;padding:12px;font:inherit;color:var(--chalk);background:var(--panel);border:1px solid var(--line);border-radius:4px;resize:vertical}
.studio .ann-admin{display:block}
.studio .ann-admin li{padding:14px 0;border-bottom:1px solid var(--line)}
.studio .ann-admin time{display:block;color:var(--accent-2);font-size:13px}
.studio .ann-admin p{margin:4px 0 0;color:var(--dim);font-size:14px}
.studio .team{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.studio .team button{margin:0;padding:8px 14px;min-height:40px;font:600 14px/1 var(--body);color:var(--chalk);background:var(--panel);border:1px solid var(--line);border-radius:999px;cursor:pointer}
.studio .team button[aria-pressed=true]{background:var(--flare);border-color:var(--flare);color:#1a1402}
.studio li.off img{opacity:.35}
.studio .tag{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;background:var(--panel);border:1px solid var(--line);color:var(--dim)}
.studio .tag.live{background:var(--flare);border-color:var(--flare);color:#1a1402}
.studio .requests{display:block}
.studio .requests li{display:grid;grid-template-columns:72px 1fr;gap:14px;padding:14px 0;border-bottom:1px solid var(--line)}
.studio .requests li img{aspect-ratio:3/4}
.studio .requests p{margin:2px 0;font-size:14px;color:var(--dim)}
.studio .requests p b{display:inline;margin:0;color:var(--chalk)}
.studio .note.full{color:var(--danger);font-weight:600}
.inbox-warn{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin:18px 0 0;padding:14px 18px;border:1px solid var(--flare);border-left-width:5px;border-radius:8px;background:color-mix(in srgb,var(--flare) 12%,var(--panel))}
.inbox-warn p{margin:0;flex:1 1 260px;font-weight:600;font-size:15px;color:var(--chalk)}
.studio .inbox-warn .btn{margin:0;padding:9px 16px;font-size:14px}
.inbox-warn.full{border-color:var(--danger);background:color-mix(in srgb,var(--danger) 14%,var(--panel))}
/* Signed in: a dashboard with a side menu (a bottom bar on phones). */
.shell{display:grid;grid-template-columns:220px 1fr;min-height:calc(100vh - 61px)}
.side{border-right:1px solid var(--line);background:var(--panel);padding:22px 12px;display:flex;flex-direction:column;gap:2px;position:sticky;top:61px;height:calc(100vh - 61px)}
.side button{display:flex;align-items:center;gap:8px;width:100%;margin:0;padding:11px 14px;border:0;border-radius:6px;background:none;color:var(--dim);font:600 15px/1.2 var(--body);text-align:left;cursor:pointer}
.side button:hover{color:var(--chalk)}
.side button[aria-current=page]{background:var(--night);color:var(--chalk);box-shadow:inset 3px 0 var(--flare)}
.side .short{display:none}
.side #logout{margin-top:auto;border:1px solid var(--line);justify-content:center}
.badge{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 6px;margin-left:auto;border-radius:999px;background:var(--flare);color:#1a1402;font-size:12px;font-weight:700}
.shell .studio{width:min(980px,100% - 48px);margin:0 auto;padding:32px 0 80px}
.shell .studio h1{font-size:clamp(36px,5vw,48px);margin:0}
.view-top{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:8px}
.view-top .btn{margin:0}
.narrow{max-width:640px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:20px}
.card h2{font-size:24px;margin:0 0 6px}
.card input,.card select,.card textarea{background:var(--night)}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:20px 0 14px}
.studio .stats button{margin:0;text-align:left;font:inherit;color:inherit;cursor:pointer}
.stats button:hover{border-color:var(--dim)}
.stats b{display:block;font-family:var(--display);font-weight:800;font-size:44px;line-height:1}
.stats span{display:block;margin-top:8px;color:var(--dim);font-size:12px;line-height:1.35;letter-spacing:.1em;text-transform:uppercase}
.stats{align-items:stretch}.studio .stats button{display:block}
.studio section{padding:0}
.two{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
.studio ul.mini{display:block;margin:6px 0 0}
.mini li{padding:10px 0;border-bottom:1px solid var(--line);font-size:14px;color:var(--dim)}
.mini li b{display:inline;color:var(--chalk);margin:0}
.studio .card .btn{margin-top:14px;padding:9px 16px;font-size:14px}
.studio ul.latest{grid-template-columns:repeat(5,1fr);margin-top:12px}
@media (max-width:760px){
  .shell{display:block}
  .side{position:fixed;inset:auto 0 0 0;top:auto;z-index:20;height:auto;flex-direction:row;padding:6px 6px calc(6px + env(safe-area-inset-bottom));border-right:0;border-top:1px solid var(--line);gap:0}
  .side button{flex:1;flex-direction:column;gap:3px;padding:9px 2px;font-size:11px;text-align:center;justify-content:center;position:relative}
  .side button[aria-current=page]{box-shadow:inset 0 3px var(--flare)}
  .side .long{display:none}.side .short{display:inline}
  .side #logout{display:none}
  .side .badge{position:absolute;top:-9px;right:2px;margin:0;min-width:20px;height:20px;padding:0 5px;font-size:11px;box-shadow:0 0 0 2px var(--panel)}
  .shell .studio{width:calc(100% - 32px);padding:24px 0 110px}
  .stats{grid-template-columns:1fr 1fr 1fr;gap:8px}.stats .card{padding:12px}.stats b{font-size:32px}.stats span{font-size:10px;letter-spacing:.04em}
  .two{grid-template-columns:1fr}
  .studio ul.latest{grid-template-columns:repeat(3,1fr)}
  .view-top #logout-top{display:inline-flex}
}
#logout-top{display:none;margin:0;padding:8px 14px;font-size:13px}
</style></head><body><nav class="nav"><div class="wrap"><a class="logo" href="/"><span class="logo-mark" aria-hidden="true"><svg width="30" height="22" viewBox="0 0 150 110"><polygon points="38,0 66,0 28,110 0,110" fill="#ffe27a"/><polygon points="80,0 108,0 70,110 42,110" fill="#ffc61a"/><polygon points="122,0 150,0 112,110 84,110" fill="#e0a000"/></svg></span>Horizon Media</a></div></nav>`;
const plainTop = `<main class="studio"><h1>Studio</h1>`;

const off = `<p>The studio is switched off because no sign-in has been set.</p><p class="note">To switch it on, add two environment variables in the Netlify project settings, STUDIO_USERNAME and STUDIO_PASSWORD (at least 12 characters), then redeploy. More people can sign in with STUDIO_USERNAME_2 and STUDIO_PASSWORD_2, and so on up to _5.</p>`;

const out = `<form id="login"><label for="username">Username</label><input id="username" name="username" autocomplete="username" autocapitalize="none" required><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required><button class="btn btn-hot">Sign in</button><p role="status"></p></form>
<script>
document.getElementById("login").addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = event.target.querySelector("[role=status]");
  const response = await fetch("/studio/login", { method: "POST", body: new FormData(event.target) });
  if (response.ok) location.reload(); else status.textContent = (await response.json()).error;
});
</script>`;

const signedIn = `<div class="shell"><aside class="side" aria-label="Studio sections"><button type="button" data-view="overview"><span class="long">Overview</span><span class="short">Home</span></button><button type="button" data-view="add"><span class="long">Add photos</span><span class="short">Add</span></button><button type="button" data-view="photos"><span class="long">All photos</span><span class="short">Photos</span></button><button type="button" data-view="requests"><span class="long">Requests</span><span class="short">Requests</span><span class="badge" id="nav-requests" hidden></span></button><button type="button" data-view="announcements"><span class="long">Announcements</span><span class="short">News</span></button><button type="button" id="logout">Sign out</button></aside><main class="studio">
<section data-view="overview">
<div class="view-top"><h1>Overview</h1><span><button class="btn btn-hot" type="button" data-go="add">+ Add photos</button> <button class="btn" type="button" id="logout-top">Sign out</button></span></div>
<div class="inbox-warn" id="ov-warn" role="status" hidden><p></p><button class="btn" type="button" data-go="requests">Answer requests</button></div>
<div class="stats"><button type="button" class="card" data-go="requests"><b id="stat-requests">-</b><span>Requests waiting</span></button><button type="button" class="card" data-go="photos"><b id="stat-photos">-</b><span>Photos on the site</span></button><button type="button" class="card" data-go="announcements"><b id="stat-ann">-</b><span id="stat-ann-label">Announcements live</span></button></div>
<div class="two"><div class="card"><h2>Photo requests</h2><ul class="mini" id="ov-requests"></ul><button class="btn" type="button" data-go="requests">Open requests</button></div>
<div class="card"><h2>Announcements</h2><ul class="mini" id="ov-ann"></ul><button class="btn" type="button" data-go="announcements">+ New announcement</button></div></div>
<div class="card"><h2>Latest photos</h2><ul class="latest" id="ov-photos"></ul><button class="btn" type="button" data-go="photos">See all photos</button></div>
</section>
<section data-view="add" hidden><div class="view-top"><h1>Add photos</h1></div>
<div class="card narrow"><form id="add">
<label for="photo">Photos (pick one or several)</label><input id="photo" type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple required>
<label for="title">Title (several photos share it)</label><input id="title" name="title" maxlength="60" required>
<label for="credit">Photographer's Instagram name</label><input id="credit" name="credit" maxlength="40" placeholder="cb.framed.it" required>
<div class="team" role="group" aria-label="Fill in a team member">${TEAM.map((name) => `<button type="button" data-name="${name}" aria-pressed="false">@${name}</button>`).join("")}</div>
<label for="sport">Category</label><select id="sport" name="sport">${SEASONS.map(([season, sports]) => {
  const options = sports.map(([value, label]) => `<option value="${value}">${label.replace("&", "&amp;")}</option>`).join("");
  return season ? `<optgroup label="${season}">${options}</optgroup>` : options;
}).join("")}</select>
<label for="owner">Car owner's Instagram name (car photos only, optional)</label><p class="note">Blur license plates before uploading a car photo: the site's privacy page promises they are blurred.</p><input id="owner" name="owner" maxlength="40" placeholder="thatdernrs7">
<button class="btn btn-hot">Add to the portfolio</button>
<p class="note">Photos are shrunk to website size on this device before they are sent. They appear on the site right away.</p>
<p role="status"></p></form></div></section>
<section data-view="photos" hidden><div class="view-top"><h1>All photos</h1><button class="btn btn-hot" type="button" data-go="add">+ Add photos</button></div>
<p role="status" id="photos-status"></p>
<h2 style="margin-top:20px">Added here</h2>
<p class="note">Photos added in the studio. Remove deletes them for good.</p>
<ul id="photos"></ul>
<h2>On the site</h2>
<p class="note">The photos built into the portfolio and car pages. Remove takes one off the site right away; Put back shows it again.</p>
<ul id="site-photos"></ul></section>
<section data-view="requests" hidden><div class="view-top"><h1>Photo requests</h1></div>
<p class="note">Visitors who asked for a photo. Reach out to them, then press Done to delete the request.</p>
<p class="note" id="requests-room"></p>
<ul id="requests" class="requests"></ul></section>
<section data-view="announcements" hidden><div class="view-top"><h1>Announcements</h1></div>
<p class="note">The newest three that are up show on the homepage, newest date first. Press Edit on one below to change it.</p>
<div class="card narrow"><form id="announce"><input type="hidden" name="id" id="ann-id">
<label for="ann-title">Headline</label><input id="ann-title" name="title" maxlength="80" required>
<label for="ann-text">Text</label><textarea id="ann-text" name="text" maxlength="400" rows="4" required></textarea>
<label for="ann-date">Goes up on</label><input id="ann-date" name="date" type="date" required>
<label for="ann-until">Comes down after (optional)</label><input id="ann-until" name="until" type="date">
<p class="note">Pick a future date to schedule it. Leave the second date empty to keep it up.</p>
<label for="ann-link">Link (optional)</label><input id="ann-link" name="link" maxlength="300" placeholder="cars.html or https://...">
<label for="ann-link-text">Link text (optional)</label><input id="ann-link-text" name="linkText" maxlength="40" placeholder="See car shoots">
<button class="btn btn-hot" id="ann-submit">Post announcement</button> <button class="btn" type="button" id="ann-cancel" hidden>Cancel editing</button>
<p role="status"></p></form></div>
<ul id="announcements" class="ann-admin"></ul></section>
<script>
// The side menu: one section shows at a time, and the address remembers which.
const views = [...document.querySelectorAll("section[data-view]")];
const menu = [...document.querySelectorAll(".side button[data-view]")];
function go(name, keep) {
  if (!views.some((v) => v.dataset.view === name)) name = "overview";
  views.forEach((v) => { v.hidden = v.dataset.view !== name; });
  menu.forEach((b) => { if (b.dataset.view === name) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  if (!keep) { history.replaceState(null, "", "#" + name); window.scrollTo(0, 0); }
}
menu.forEach((b) => b.addEventListener("click", () => go(b.dataset.view)));
document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));
go(location.hash.slice(1), true);
const setText = (id, value) => { document.getElementById(id).textContent = value; };
const miniRow = (strong, rest) => { const li = document.createElement("li"); const b = document.createElement("b"); b.textContent = strong; li.append(b, rest); return li; };
const counts = { added: 0, builtIn: 0 };
const showPhotoCount = () => setText("stat-photos", counts.added + counts.builtIn);

const addStatus = document.querySelector("#add [role=status]");
const status = document.getElementById("photos-status");
const credit = document.getElementById("credit");
const teamButtons = [...document.querySelectorAll(".team button")];
const markTeam = () => teamButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.name === credit.value.replace(/^@+/, ""))));
teamButtons.forEach((button) => button.addEventListener("click", () => { credit.value = button.dataset.name; markTeam(); }));
credit.addEventListener("input", markTeam);
const list = document.getElementById("photos");

// Whether uploads get the Horizon Media watermark; off, like the site's other photos.
const WATERMARK = false;

// Draws the Horizon Media watermark the same way tools/make_photo_variants.py
// does: the logo's three slashes and the name, right-aligned, its bottom edge
// 76% of the way down, 30% of the photo's width.
function watermark(context, width, height) {
  const size = Math.max(8, Math.round((width * 0.3) / 5.2));
  context.font = "800 " + size + 'px "Big Shoulders Display", "Arial Narrow", Impact, sans-serif';
  const text = "HORIZON MEDIA";
  const metrics = context.measureText(text);
  const cap = metrics.actualBoundingBoxAscent || size * 0.7;
  const slash = cap * 0.62, gap = cap * 0.18;
  const markWidth = 3 * slash + 2 * gap + cap * 0.35 + metrics.width;
  const x0 = width * 0.95 - markWidth, y0 = height * 0.76 - cap;
  context.save();
  context.fillStyle = "rgba(255, 255, 255, 0.72)";
  context.shadowColor = "rgba(0, 0, 0, 0.45)";
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
  context.textBaseline = "alphabetic";
  context.fillText(text, x0 + 3 * slash + 2 * gap + cap * 0.35, y0 + cap);
  context.restore();
}

// Draws the photo at a smaller size (watermarked if WATERMARK is on) and returns it as a JPEG file.
// The original never leaves this device.
function shrink(image, width, quality) {
  const scale = Math.min(1, width / image.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  if (WATERMARK) watermark(context, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

async function refresh() {
  const { photos, hidden } = await (await fetch("/portfolio-photos.json", { cache: "no-store" })).json();
  refreshSitePhotos(hidden);
  list.textContent = "";
  counts.added = photos.length;
  showPhotoCount();
  const latest = document.getElementById("ov-photos");
  latest.textContent = "";
  for (const photo of photos.slice(0, 5)) {
    const item = document.createElement("li");
    const image = document.createElement("img");
    image.src = "/uploads/" + photo.id + "/thumb.jpg";
    image.alt = photo.title;
    item.append(image);
    latest.append(item);
  }
  if (!photos.length) latest.append(miniRow("Nothing added in the studio yet.", ""));
  for (const photo of photos) {
    const item = document.createElement("li");
    const image = document.createElement("img");
    image.src = "/uploads/" + photo.id + "/thumb.jpg";
    image.alt = "";
    const title = document.createElement("b");
    title.textContent = photo.title;
    const remove = document.createElement("button");
    remove.className = "btn btn-danger";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", async () => {
      if (!confirm('Remove "' + photo.title + '" from the site? This deletes it for good.')) return;
      remove.disabled = true;
      const body = new FormData();
      body.set("id", photo.id);
      const response = await fetch("/studio/delete", { method: "POST", body });
      status.textContent = response.ok ? "Removed." : (await response.json()).error;
      refresh();
    });
    item.append(image, title, remove);
    list.append(item);
  }
}

// The photos written into the portfolio and car pages, read from the pages themselves.
const sitePhotos = document.getElementById("site-photos");
let builtIn = null;
async function refreshSitePhotos(hidden) {
  if (builtIn === null) {
    builtIn = [];
    for (const page of ["/portfolio.html", "/cars.html"]) {
      const html = await (await fetch(page, { cache: "no-store" })).text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      for (const shot of doc.querySelectorAll(".shot")) builtIn.push({ path: shot.dataset.full.replace(/^img\\/(lite|saver)\\//, "img/"), title: shot.dataset.title, thumb: shot.querySelector("img").getAttribute("src"), page });
    }
  }
  sitePhotos.textContent = "";
  counts.builtIn = builtIn.filter((photo) => !hidden.includes(photo.path)).length;
  showPhotoCount();
  for (const photo of builtIn) {
    const off = hidden.includes(photo.path);
    const item = document.createElement("li");
    if (off) item.className = "off";
    const image = document.createElement("img");
    image.src = "/" + photo.thumb;
    image.alt = "";
    image.loading = "lazy";
    const title = document.createElement("b");
    title.textContent = photo.title + (photo.page === "/cars.html" ? " (cars)" : "");
    const button = document.createElement("button");
    button.className = "btn";
    button.type = "button";
    button.textContent = off ? "Put back" : "Remove";
    button.addEventListener("click", async () => {
      button.disabled = true;
      const body = new FormData();
      body.set("path", photo.path);
      const response = await fetch(off ? "/studio/unhide" : "/studio/hide", { method: "POST", body });
      if (response.ok) refreshSitePhotos((await response.json()).hidden);
      else { status.textContent = (await response.json()).error; button.disabled = false; }
    });
    item.append(image, title, button);
    sitePhotos.append(item);
  }
}

const requestList = document.getElementById("requests");
async function refreshRequests() {
  const items = await (await fetch("/studio/requests.json", { cache: "no-store" })).json();
  requestList.textContent = "";
  setText("stat-requests", items.length);
  const full = items.length >= ${MAX_REQUESTS};
  const room = document.getElementById("requests-room");
  room.textContent = items.length + " of ${MAX_REQUESTS} waiting." + (full ? " The inbox is full: visitors can\u2019t send new requests until you press Done on some." : "");
  room.className = "note" + (full ? " full" : "");
  // The overview warns from ${WARN_REQUESTS} waiting requests, and louder when the inbox is full.
  const warn = document.getElementById("ov-warn");
  warn.hidden = items.length < ${WARN_REQUESTS};
  warn.className = "inbox-warn" + (full ? " full" : "");
  warn.querySelector("p").textContent = full
    ? "The request inbox is full (" + items.length + " of ${MAX_REQUESTS}), so visitors can\u2019t ask for photos until you answer some and press Done."
    : items.length + " of ${MAX_REQUESTS} photo requests are waiting. Answer some soon: at ${MAX_REQUESTS}, visitors can\u2019t send new ones.";
  const badge = document.getElementById("nav-requests");
  badge.textContent = items.length;
  badge.hidden = items.length === 0;
  const ovRequests = document.getElementById("ov-requests");
  ovRequests.textContent = "";
  for (const item of items.slice(0, 3)) ovRequests.append(miniRow(item.name, " wants " + (item.title || "a photo") + " · " + item.contact));
  if (!items.length) ovRequests.append(miniRow("No requests right now.", ""));
  if (!items.length) {
    const none = document.createElement("li");
    none.textContent = "No requests right now.";
    requestList.append(none);
  }
  for (const item of items) {
    const row = document.createElement("li");
    const image = document.createElement("img");
    image.src = "/" + item.photo.replace("/full.jpg", "/thumb.jpg").replace(/^img\\/(portfolio|cars)\\//, "img/$1/thumb/");
    image.alt = "";
    const info = document.createElement("div");
    const line = (label, value) => { const p = document.createElement("p"); const b = document.createElement("b"); b.textContent = label + " "; p.append(b, value); return p; };
    info.append(line("Photo:", item.title || item.photo), line("From:", item.name), line("Reach them at:", item.contact));
    if (item.message) info.append(line("Message:", item.message));
    info.append(line("Sent:", new Date(item.added).toLocaleString()));
    const done = document.createElement("button");
    done.className = "btn";
    done.type = "button";
    done.textContent = "Done";
    done.addEventListener("click", async () => {
      done.disabled = true;
      const body = new FormData();
      body.set("id", item.id);
      await fetch("/studio/request-done", { method: "POST", body });
      refreshRequests();
    });
    info.append(done);
    row.append(image, info);
    requestList.append(row);
  }
}

document.getElementById("add").addEventListener("submit", async (event) => {
  event.preventDefault();
  const files = [...document.getElementById("photo").files];
  const button = event.target.querySelector(".btn-hot");
  button.disabled = true;
  if (WATERMARK) await document.fonts.load('800 40px "Big Shoulders Display"').catch(() => {});
  let added = 0;
  const problems = [];
  for (const [i, file] of files.entries()) {
    const of = files.length > 1 ? " " + (i + 1) + " of " + files.length : "";
    try {
      addStatus.textContent = "Preparing photo" + of + "...";
      const image = await createImageBitmap(file, { imageOrientation: "from-image" });
      const body = new FormData(event.target);
      body.set("full", await shrink(image, 1200, 0.82), "full.jpg");
      body.set("thumb", await shrink(image, 480, 0.7), "thumb.jpg");
      addStatus.textContent = "Sending photo" + of + "...";
      const response = await fetch("/studio/upload", { method: "POST", body });
      if (response.ok) added += 1;
      else { problems.push(file.name + ": " + (await response.json()).error); if (response.status === 409 || response.status === 401) break; }
    } catch (error) {
      problems.push(file.name + ": this device could not read it. Try a JPEG.");
    }
  }
  button.disabled = false;
  addStatus.textContent = (added ? "Added " + added + (added === 1 ? " photo." : " photos.") : "Nothing was added.") + (problems.length ? " " + problems.join(" ") : "");
  if (added) { event.target.reset(); markTeam(); refresh(); }
});
const signOut = async () => {
  await fetch("/studio/logout", { method: "POST" });
  location.reload();
};
document.getElementById("logout").addEventListener("click", signOut);
document.getElementById("logout-top").addEventListener("click", signOut);
const announceForm = document.getElementById("announce");
const announceStatus = announceForm.querySelector("[role=status]");
const announceList = document.getElementById("announcements");
const dateBox = document.getElementById("ann-date");
const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
dateBox.value = today();

async function refreshAnnouncements() {
  const { today: day, items } = await (await fetch("/studio/announcements.json", { cache: "no-store" })).json();
  announceList.textContent = "";
  const stateOf = (item) => (item.date > day ? "Scheduled" : item.until && item.until < day ? "Ended" : "Live");
  const live = items.filter((item) => stateOf(item) === "Live").length;
  const scheduled = items.filter((item) => stateOf(item) === "Scheduled").length;
  setText("stat-ann", live);
  setText("stat-ann-label", (live === 1 ? "Announcement live" : "Announcements live") + (scheduled ? " · " + scheduled + " scheduled" : ""));
  const ovAnn = document.getElementById("ov-ann");
  ovAnn.textContent = "";
  for (const item of items.filter((item) => stateOf(item) !== "Ended").slice(0, 3)) ovAnn.append(miniRow(item.title, " · " + stateOf(item) + (stateOf(item) === "Scheduled" ? ", goes up " + item.date : "")));
  if (!ovAnn.children.length) ovAnn.append(miniRow("No announcements up.", ""));
  for (const item of items) {
    const row = document.createElement("li");
    const when = document.createElement("time");
    when.textContent = item.date + (item.until ? " to " + item.until : "");
    const tag = document.createElement("span");
    const state = item.date > day ? "Scheduled" : item.until && item.until < day ? "Ended" : "Live";
    tag.className = "tag" + (state === "Live" ? " live" : "");
    tag.textContent = state;
    when.append(tag);
    const title = document.createElement("b");
    title.textContent = item.title;
    const text = document.createElement("p");
    text.textContent = item.text;
    const editButton = document.createElement("button");
    editButton.className = "btn";
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => {
      document.getElementById("ann-id").value = item.id;
      document.getElementById("ann-title").value = item.title;
      document.getElementById("ann-text").value = item.text;
      dateBox.value = item.date;
      document.getElementById("ann-until").value = item.until || "";
      document.getElementById("ann-link").value = item.link || "";
      document.getElementById("ann-link-text").value = item.linkText || "";
      document.getElementById("ann-submit").textContent = "Save changes";
      document.getElementById("ann-cancel").hidden = false;
      announceStatus.textContent = "Editing: " + item.title;
      announceForm.scrollIntoView({ behavior: "smooth" });
    });
    const remove = document.createElement("button");
    remove.className = "btn btn-danger";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", async () => {
      if (!confirm('Remove the announcement "' + item.title + '"? This cannot be undone.')) return;
      remove.disabled = true;
      const body = new FormData();
      body.set("id", item.id);
      const response = await fetch("/studio/announce-delete", { method: "POST", body });
      announceStatus.textContent = response.ok ? "Removed. It is gone from the homepage." : (await response.json()).error;
      refreshAnnouncements();
    });
    row.append(when, title, text, editButton, document.createTextNode(" "), remove);
    announceList.append(row);
  }
}

function stopEditing() {
  announceForm.reset();
  document.getElementById("ann-id").value = "";
  dateBox.value = today();
  document.getElementById("ann-submit").textContent = "Post announcement";
  document.getElementById("ann-cancel").hidden = true;
  document.getElementById("ann-until").value = "";
}
document.getElementById("ann-cancel").addEventListener("click", () => { stopEditing(); announceStatus.textContent = ""; });

announceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const editing = document.getElementById("ann-id").value !== "";
  announceStatus.textContent = editing ? "Saving..." : "Posting...";
  const response = await fetch("/studio/announce", { method: "POST", body: new FormData(announceForm) });
  const scheduled = dateBox.value > today();
  announceStatus.textContent = response.ok ? (editing ? "Saved." : "Posted.") + (scheduled ? " It goes up on " + dateBox.value + "." : " It shows on the homepage right away.") : (await response.json()).error;
  if (response.ok) { stopEditing(); refreshAnnouncements(); }
});

refresh();
refreshAnnouncements();
refreshRequests();
</script>`;

export function studioPage({ state }) {
  const body = state === "in" ? signedIn + "</main></div>" : plainTop + (state === "off" ? off : out) + "</main>";
  return head + body + '<script src="/js/site.js"></script></body></html>';
}
