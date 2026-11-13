import { SEASONS } from "./sports.js";

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
.studio [role=status]{min-height:1.5em;margin-top:14px;color:var(--flare-2)}
.studio ul{list-style:none;padding:0;margin:28px 0 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.studio li img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:6px;display:block}
.studio li b{display:block;font-size:14px;margin-top:6px}
.studio li button{margin-top:6px;padding:8px 12px;font-size:13px}
.studio h2{font-family:var(--display);font-weight:800;text-transform:uppercase;font-size:34px;margin:56px 0 4px}
.studio textarea{width:100%;padding:12px;font:inherit;color:var(--chalk);background:var(--panel);border:1px solid var(--line);border-radius:4px;resize:vertical}
.studio .ann-admin{display:block}
.studio .ann-admin li{padding:14px 0;border-bottom:1px solid var(--line)}
.studio .ann-admin time{display:block;color:var(--flare-2);font-size:13px}
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
.studio .requests p b{color:var(--chalk)}
</style></head><body><nav class="nav"><div class="wrap"><a class="logo" href="/"><span class="logo-mark" aria-hidden="true"><svg width="30" height="22" viewBox="0 0 150 110"><polygon points="38,0 66,0 28,110 0,110" fill="#ffe27a"/><polygon points="80,0 108,0 70,110 42,110" fill="#ffc61a"/><polygon points="122,0 150,0 112,110 84,110" fill="#e0a000"/></svg></span>Horizon Media</a></div></nav><main class="studio"><h1>Studio</h1>`;

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

const signedIn = `<form id="add">
<label for="photo">Photos (pick one or several)</label><input id="photo" type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple required>
<label for="title">Title (several photos share it)</label><input id="title" name="title" maxlength="60" required>
<label for="credit">Photographer's Instagram name</label><input id="credit" name="credit" maxlength="40" placeholder="cb.framed.it" required>
<div class="team" role="group" aria-label="Fill in a team member">${TEAM.map((name) => `<button type="button" data-name="${name}" aria-pressed="false">@${name}</button>`).join("")}</div>
<label for="sport">Category</label><select id="sport" name="sport">${SEASONS.map(([season, sports]) => {
  const options = sports.map(([value, label]) => `<option value="${value}">${label.replace("&", "&amp;")}</option>`).join("");
  return season ? `<optgroup label="${season}">${options}</optgroup>` : options;
}).join("")}</select>
<label for="owner">Car owner's Instagram name (car photos only, optional)</label><p class="note">Blur license plates before uploading a car photo: the site's privacy page promises they are blurred.</p><input id="owner" name="owner" maxlength="40" placeholder="thatdernrs7">
<button class="btn btn-hot">Add to the portfolio</button> <button class="btn" type="button" id="logout">Sign out</button>
<p class="note">Photos are shrunk to website size on this device before they are sent. They appear on the site right away.</p>
<p role="status"></p></form>
<h2>Added here</h2>
<p class="note">Photos added in the studio. Remove deletes them for good.</p>
<ul id="photos"></ul>
<h2>Photo requests</h2>
<p class="note">Visitors who asked for a photo. Reach out to them, then press Done to delete the request.</p>
<ul id="requests" class="requests"></ul>
<h2>Announcements</h2>
<p class="note">The newest three that are up show on the homepage, newest date first. Press Edit on one below to change it.</p>
<form id="announce"><input type="hidden" name="id" id="ann-id">
<label for="ann-title">Headline</label><input id="ann-title" name="title" maxlength="80" required>
<label for="ann-text">Text</label><textarea id="ann-text" name="text" maxlength="400" rows="4" required></textarea>
<label for="ann-date">Goes up on</label><input id="ann-date" name="date" type="date" required>
<label for="ann-until">Comes down after (optional)</label><input id="ann-until" name="until" type="date">
<p class="note">Pick a future date to schedule it. Leave the second date empty to keep it up.</p>
<label for="ann-link">Link (optional)</label><input id="ann-link" name="link" maxlength="300" placeholder="cars.html or https://...">
<label for="ann-link-text">Link text (optional)</label><input id="ann-link-text" name="linkText" maxlength="40" placeholder="See car shoots">
<button class="btn btn-hot" id="ann-submit">Post announcement</button> <button class="btn" type="button" id="ann-cancel" hidden>Cancel editing</button>
<p role="status"></p></form>
<ul id="announcements" class="ann-admin"></ul>
<h2>On the site</h2>
<p class="note">The photos built into the portfolio and car pages. Remove takes one off the site right away; Put back shows it again.</p>
<ul id="site-photos"></ul>
<script>
const status = document.querySelector("#add [role=status]");
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
  for (const photo of photos) {
    const item = document.createElement("li");
    const image = document.createElement("img");
    image.src = "/uploads/" + photo.id + "/thumb.jpg";
    image.alt = "";
    const title = document.createElement("b");
    title.textContent = photo.title;
    const remove = document.createElement("button");
    remove.className = "btn";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", async () => {
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
      status.textContent = "Preparing photo" + of + "...";
      const image = await createImageBitmap(file, { imageOrientation: "from-image" });
      const body = new FormData(event.target);
      body.set("full", await shrink(image, 1200, 0.82), "full.jpg");
      body.set("thumb", await shrink(image, 480, 0.7), "thumb.jpg");
      status.textContent = "Sending photo" + of + "...";
      const response = await fetch("/studio/upload", { method: "POST", body });
      if (response.ok) added += 1;
      else { problems.push(file.name + ": " + (await response.json()).error); if (response.status === 409 || response.status === 401) break; }
    } catch (error) {
      problems.push(file.name + ": this device could not read it. Try a JPEG.");
    }
  }
  button.disabled = false;
  status.textContent = (added ? "Added " + added + (added === 1 ? " photo." : " photos.") : "Nothing was added.") + (problems.length ? " " + problems.join(" ") : "");
  if (added) { event.target.reset(); markTeam(); refresh(); }
});
document.getElementById("logout").addEventListener("click", async () => {
  await fetch("/studio/logout", { method: "POST" });
  location.reload();
});
const announceForm = document.getElementById("announce");
const announceStatus = announceForm.querySelector("[role=status]");
const announceList = document.getElementById("announcements");
const dateBox = document.getElementById("ann-date");
const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
dateBox.value = today();

async function refreshAnnouncements() {
  const { today: day, items } = await (await fetch("/studio/announcements.json", { cache: "no-store" })).json();
  announceList.textContent = "";
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
    remove.className = "btn";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", async () => {
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
  return head + (state === "off" ? off : state === "in" ? signedIn : out) + '</main><script src="/js/site.js"></script></body></html>';
}
