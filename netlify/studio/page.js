// The team, as listed on the homepage. Tapping a name fills in the photo credit.
const TEAM = ["cb.framed.it", "visuals_alex_", "createddbyabby", "connors.visualss"];

// The studio's one page. `state` is "off" (no password set in Netlify yet),
// "out" (show the sign-in form) or "in" (show the add and remove tools).
const head = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Studio · Horizon Media</title><link rel="stylesheet" href="/css/site.css"><style>
.studio{width:min(720px,100% - 40px);margin:0 auto;padding:48px 0 80px}
.studio h1{font-family:var(--display);font-weight:800;text-transform:uppercase;font-size:clamp(40px,7vw,64px);line-height:.95;margin:0 0 20px}
.studio label{display:block;margin:16px 0 6px;font-weight:600;font-size:14px}
.studio input,.studio select{width:100%;padding:12px;font:inherit;color:var(--chalk);background:var(--panel);border:1px solid var(--line);border-radius:4px}
.studio button{margin-top:20px}
.studio .note{color:var(--dim);font-size:14px}
.studio [role=status]{min-height:1.5em;margin-top:14px;color:var(--flare-2)}
.studio ul{list-style:none;padding:0;margin:28px 0 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.studio li img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:6px;display:block}
.studio li b{display:block;font-size:14px;margin-top:6px}
.studio li button{margin-top:6px;padding:8px 12px;font-size:13px}
.studio .team{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.studio .team button{margin:0;padding:8px 14px;min-height:40px;font:600 14px/1 var(--body);color:var(--chalk);background:var(--panel);border:1px solid var(--line);border-radius:999px;cursor:pointer}
.studio .team button[aria-pressed=true]{background:var(--flare);border-color:var(--flare);color:#1a1402}
</style></head><body><main class="studio"><h1>Studio</h1>`;

const off = `<p>The studio is switched off because no sign-in has been set.</p><p class="note">To switch it on, add two environment variables in the Netlify project settings, STUDIO_USERNAME and STUDIO_PASSWORD (at least 12 characters), then redeploy.</p>`;

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
<label for="photo">Photo</label><input id="photo" type="file" accept="image/jpeg,image/png,image/webp,image/heic" required>
<label for="title">Title</label><input id="title" name="title" maxlength="60" required>
<label for="credit">Photographer's Instagram name</label><input id="credit" name="credit" maxlength="40" placeholder="cb.framed.it" required>
<div class="team" role="group" aria-label="Fill in a team member">${TEAM.map((name) => `<button type="button" data-name="${name}" aria-pressed="false">@${name}</button>`).join("")}</div>
<label for="sport">Sport</label><select id="sport" name="sport"><option value="football">Football</option><option value="soccer">Soccer</option><option value="volleyball">Volleyball</option><option value="basketball">Basketball</option><option value="other">Other</option></select>
<button class="btn btn-hot">Add to the portfolio</button> <button class="btn" type="button" id="logout">Sign out</button>
<p class="note">The photo is shrunk to website size on this device before it is sent. It appears on the portfolio page within a minute.</p>
<p role="status"></p></form>
<ul id="photos"></ul>
<script>
const status = document.querySelector("#add [role=status]");
const credit = document.getElementById("credit");
const teamButtons = [...document.querySelectorAll(".team button")];
const markTeam = () => teamButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.name === credit.value.replace(/^@+/, ""))));
teamButtons.forEach((button) => button.addEventListener("click", () => { credit.value = button.dataset.name; markTeam(); }));
credit.addEventListener("input", markTeam);
const list = document.getElementById("photos");

// Draws the photo at a smaller size and returns it as a JPEG file.
function shrink(image, width, quality) {
  const scale = Math.min(1, width / image.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

async function refresh() {
  const photos = await (await fetch("/portfolio-photos.json", { cache: "no-store" })).json();
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

document.getElementById("add").addEventListener("submit", async (event) => {
  event.preventDefault();
  status.textContent = "Preparing the photo...";
  try {
    const image = await createImageBitmap(document.getElementById("photo").files[0], { imageOrientation: "from-image" });
    const body = new FormData(event.target);
    body.set("full", await shrink(image, 1200, 0.82), "full.jpg");
    body.set("thumb", await shrink(image, 480, 0.7), "thumb.jpg");
    status.textContent = "Sending...";
    const response = await fetch("/studio/upload", { method: "POST", body });
    status.textContent = response.ok ? "Added." : (await response.json()).error;
    if (response.ok) { event.target.reset(); markTeam(); refresh(); }
  } catch (error) {
    status.textContent = "This device could not read that photo. Try a JPEG.";
  }
});
document.getElementById("logout").addEventListener("click", async () => {
  await fetch("/studio/logout", { method: "POST" });
  location.reload();
});
refresh();
</script>`;

export function studioPage({ state }) {
  return head + (state === "off" ? off : state === "in" ? signedIn : out) + "</main></body></html>";
}
