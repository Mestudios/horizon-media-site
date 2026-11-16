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
#login .remember{display:flex;align-items:center;gap:10px;margin-top:18px;font-weight:500}#login .remember input{width:20px;height:20px;margin:0}.studio .remember-note{margin:6px 0 0 30px;font-size:13px}
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
.studio li.off .ph img{opacity:.35}
.studio .tag{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;background:var(--panel);border:1px solid var(--line);color:var(--dim)}
.studio .tag.live{background:var(--flare);border-color:var(--flare);color:#1a1402}
.studio .requests{display:block}
.studio .requests li{display:grid;grid-template-columns:72px 1fr;gap:14px;padding:14px 0;border-bottom:1px solid var(--line)}
.studio .requests li img{aspect-ratio:3/4}
.studio .requests p{margin:2px 0;font-size:14px;color:var(--dim)}
.studio .requests p b{display:inline;margin:0;color:var(--chalk)}
.ann-photo-now{display:flex;align-items:center;gap:14px;margin-top:10px}.ann-photo-now img{width:120px;aspect-ratio:16/10;object-fit:cover;border-radius:6px}.studio .ann-photo-now label{margin:0;display:flex;gap:8px;align-items:center}.studio .ann-photo-now input{width:auto}
.studio ul.pinned li.empty{grid-column:1/-1;color:var(--dim);font-size:14px}
.studio li .btn{margin:6px 6px 0 0}
.studio li .btn.arrow{min-width:44px;padding:10px 0;justify-content:center}
.studio li .btn.pin.on{border-color:var(--flare);color:var(--accent-2)}
.studio .photo-edit{grid-column:1/-1;margin-top:10px}
.studio .photo-edit label{margin:10px 0 4px;font-size:13px}
.studio .photo-edit input,.studio .photo-edit select{padding:9px;font-size:14px}
.undo{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:30;display:flex;align-items:center;gap:16px;padding:10px 10px 10px 18px;background:var(--chalk);color:var(--night);border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.35);font-weight:600;font-size:15px;max-width:calc(100% - 32px)}
.undo span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.studio .undo .btn,.undo .btn{margin:0;padding:9px 18px;min-height:40px}
@media (max-width:760px){.undo{bottom:84px}}
.studio ul.picked{grid-template-columns:repeat(auto-fill,minmax(110px,1fr));margin:12px 0 0}
.blur-tool{position:fixed;inset:0;z-index:40;display:grid;place-items:center;padding:16px;background:rgba(5,5,5,.85)}
.blur-panel{width:min(900px,100%);max-height:100%;overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:20px}
.studio .blur-panel h2{margin:0 0 4px;font-size:28px}
.blur-panel canvas{display:block;max-width:100%;max-height:62vh;margin:14px auto 0;touch-action:none;cursor:crosshair;border-radius:6px}
.studio .blur-panel .btns{margin-top:14px}.studio .blur-panel .btn{margin:0}
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
.shell .studio{width:min(1400px,100% - 64px);margin:0 auto;padding:32px 0 80px}
.shell .studio h1{font-size:clamp(36px,5vw,48px);margin:0}
.view-top{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:8px}
.view-top .btn{margin:0}
.narrow{max-width:640px}
/* Forms use the whole width on computers: two columns side by side. */
.form-cols{display:grid;grid-template-columns:1fr 1fr;gap:0 36px}
.form-cols .col>label:first-child{margin-top:0}
.studio .form-end{display:flex;flex-wrap:wrap;align-items:center;gap:12px 18px;margin-top:22px;padding-top:20px;border-top:1px solid var(--line)}
.studio .form-end .btn{margin:0}
.studio .form-end .note{margin:0;flex:1 1 280px}
.studio ul.picked{grid-template-columns:repeat(auto-fill,minmax(130px,1fr))}
.studio label.drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:230px;margin:0;padding:24px;text-align:center;border:2px dashed var(--line);border-radius:12px;background:var(--night);cursor:pointer;color:var(--dim);font-weight:500}
.studio label.drop b{font-family:var(--display);font-weight:800;font-size:30px;text-transform:uppercase;color:var(--chalk)}
.studio label.drop:hover,.studio label.drop.over{border-color:var(--flare);color:var(--chalk)}
.studio .drop-input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.studio label.drop:focus-within{outline:2px solid var(--flare-2);outline-offset:3px}
.studio .has-picks label.drop{min-height:0;padding:14px;flex-direction:row}
.studio .has-picks label.drop b{font-size:20px}
.studio .has-picks label.drop span{display:none}
.photo-tools{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0 0}
.studio .photo-tools input{flex:1 1 260px;width:auto}
.studio .photo-tools select{flex:0 1 220px;width:auto}
.studio li .tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
.studio li .tags .tag{margin:0}
.studio .tool-bar{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.studio .tool-modes{display:flex;gap:0}
.studio .tool-bar .btn{margin:0;padding:9px 14px;font-size:14px}
.studio .tool-modes .btn:first-child{border-radius:4px 0 0 4px}.studio .tool-modes .btn:last-child{border-radius:0 4px 4px 0;margin-left:-1px}
.studio .tool-modes .btn[aria-pressed=true]{background:var(--flare);border-color:var(--flare);color:#1a1402}
.studio .tool-note{margin:10px 0 0}
.studio ul.picked li img{transition:transform .2s}
.studio p.twin{margin:4px 0 0;font-size:12px;font-weight:600;color:var(--danger)}
.ann-preview{margin-top:22px;padding-top:18px;border-top:1px solid var(--line)}
.studio h2.preview-label{font-family:var(--body);margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
.ann-preview .ann-list{grid-template-columns:minmax(0,380px)}
.ann-preview .ann a{pointer-events:none}
.studio li .ph{position:relative}
.studio li .ph .flag{position:absolute;top:8px;left:8px;margin:0}
.studio li .bar{position:absolute;left:8px;right:8px;bottom:8px;display:flex;justify-content:space-between;gap:4px}
.studio .ib{display:inline-grid;place-items:center;width:38px;height:38px;min-height:0;margin:0;padding:0;border:0;border-radius:50%;background:rgba(10,10,10,.72);color:#fff;cursor:pointer;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.studio .ib:hover{background:rgba(10,10,10,.9)}
.studio .ib.on{background:var(--flare);color:#1a1402}
.studio .ib.danger{color:#ff8a80}
.studio .ib.danger:hover{background:#b3261e;color:#fff}
.studio .ib:disabled{opacity:.35;cursor:default}
.studio .requests li.empty{display:block;color:var(--dim);font-size:15px}
body:has(.shell) .nav .wrap{width:calc(100% - 52px)}
@media (max-width:900px){.form-cols{grid-template-columns:1fr}.form-cols .col+.col>label:first-child{margin-top:16px}}
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

/* Sign-in (and switched-off) page: a photo behind a frosted card. */
body:has(.signin){background:#0a0a0a}
.signin-bg{position:fixed;inset:0;background:#0a0a0a url("/img/portfolio/under-the-lights.jpg") center/cover no-repeat}
.signin-bg::after{content:"";position:absolute;inset:0;background:radial-gradient(60% 60% at 50% 45%,rgba(10,10,10,.35),rgba(10,10,10,.85))}
.signin{position:relative;min-height:100vh;min-height:100dvh;display:grid;place-items:center;padding:24px 16px 48px;
  --night:#0a0a0a;--panel:#151515;--line:#2b2b2b;--chalk:#f4f4f4;--dim:#b4b4b4;--accent-2:var(--flare-2);color:var(--chalk)}
.signin-card{width:min(420px,100%);padding:30px;border-radius:16px;background:rgba(18,18,18,.7);-webkit-backdrop-filter:blur(18px) saturate(1.2);backdrop-filter:blur(18px) saturate(1.2);border:1px solid rgba(255,255,255,.14);box-shadow:0 30px 80px rgba(0,0,0,.5)}
.signin-brand{display:flex;align-items:center;gap:12px;font-family:var(--display);font-weight:800;font-size:22px;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;color:var(--chalk)}
.signin h1{font-family:var(--display);font-weight:800;text-transform:uppercase;font-size:64px;line-height:.9;margin:18px 0 2px}
.signin-sub{margin:0 0 6px;color:var(--dim);letter-spacing:.18em;text-transform:uppercase;font-size:12px;font-weight:600}
.signin label{display:block;margin:16px 0 6px;font-weight:600;font-size:14px}
.signin input:not([type=checkbox]){width:100%;padding:13px;font:inherit;font-size:16px;color:var(--chalk);background:rgba(10,10,10,.55);border:1px solid rgba(255,255,255,.18);border-radius:6px}
.signin input:not([type=checkbox]):focus{outline:none;border-color:var(--flare-2)}
.signin #login .remember{display:flex;align-items:center;gap:10px;margin-top:18px;font-weight:500}
.signin #login .remember input{width:20px;height:20px;margin:0;accent-color:var(--flare)}
.signin .remember-note{margin:6px 0 0 30px;font-size:13px;color:var(--dim)}
.signin #login button{display:flex;justify-content:center;width:100%;min-width:0;margin:24px 0 0;padding:16px;font-size:18px}
.signin [role=status]{min-height:1.4em;margin:12px 0 0;text-align:center;color:var(--flare-2)}
.signin-back{display:block;text-align:center;margin-top:14px;color:var(--dim);font-size:14px;text-decoration:none}
.signin-back:hover{color:var(--chalk)}
.signin p.off-note{color:var(--dim);font-size:14px}
.signin-credit{position:fixed;right:14px;bottom:10px;margin:0;color:rgba(255,255,255,.7);font-size:12px;text-shadow:0 1px 6px rgba(0,0,0,.8)}
.signin [role=status]:empty{min-height:0;margin:0}
@media (max-width:600px){
  .signin-bg{bottom:auto;height:46vh;background-size:cover;background-position:center 78%}
  .signin-bg::after{background:linear-gradient(180deg,rgba(10,10,10,.15),rgba(10,10,10,.35) 60%,#0a0a0a)}
  .signin{align-content:end;padding:24vh 12px 16px}
  .signin-card{padding:22px 20px;background:rgba(18,18,18,.68)}
  .signin h1{font-size:48px;margin-top:12px}
  .signin-brand{font-size:18px}.signin-brand svg{width:32px;height:23px}
  .signin label{margin-top:12px}
  .signin .remember-note{display:none}
  .signin-credit{top:12px;bottom:auto}
}
</style></head><body><a class="skip" href="#main">Skip to content</a>`;
const nav = `<nav class="nav"><div class="wrap"><a class="logo" href="/"><span class="logo-mark" aria-hidden="true"><svg width="30" height="22" viewBox="0 0 150 110"><polygon points="38,0 66,0 28,110 0,110" fill="#ffe27a"/><polygon points="80,0 108,0 70,110 42,110" fill="#ffc61a"/><polygon points="122,0 150,0 112,110 84,110" fill="#e0a000"/></svg></span>Horizon Media</a></div></nav>`;
const LOGO = `<svg width="40" height="29" viewBox="0 0 150 110" aria-hidden="true"><polygon points="38,0 66,0 28,110 0,110" fill="#ffe27a"/><polygon points="80,0 108,0 70,110 42,110" fill="#ffc61a"/><polygon points="122,0 150,0 112,110 84,110" fill="#e0a000"/></svg>`;
// The sign-in and switched-off pages: a photo behind a frosted card.
const signinTop = `<div class="signin-bg" aria-hidden="true"></div><main class="signin" id="main"><div class="signin-card"><a class="signin-brand" href="/">${LOGO}<span>Horizon Media</span></a><h1>Studio</h1><p class="signin-sub">Team sign-in</p>`;
const signinEnd = `<a class="signin-back" href="/">&larr; Back to the site</a></div><p class="signin-credit">Photo by @cb.framed.it</p></main>`;

const off = `<p>The studio is switched off because no sign-in has been set.</p><p class="note off-note">To switch it on, add two environment variables in the Netlify project settings, STUDIO_USERNAME and STUDIO_PASSWORD (at least 12 characters), then redeploy. More people can sign in with STUDIO_USERNAME_2 and STUDIO_PASSWORD_2, and so on up to _5.</p>`;

const out = `<form id="login"><label for="username">Username</label><input id="username" name="username" autocomplete="username" autocapitalize="none" required><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required><label class="remember"><input type="checkbox" name="remember"> Keep me signed in on this device for 30 days</label><p class="note remember-note">Only tick this on your own phone or computer.</p><button class="btn btn-hot">Sign in</button><p role="status"></p></form>
<script>
document.getElementById("login").addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = event.target.querySelector("[role=status]");
  const response = await fetch("/studio/login", { method: "POST", body: new FormData(event.target) });
  if (response.ok) location.reload(); else status.textContent = (await response.json()).error;
});
</script>`;

const signedIn = `<div class="shell"><aside class="side" aria-label="Studio sections"><button type="button" data-view="overview"><span class="long">Overview</span><span class="short">Home</span></button><button type="button" data-view="add"><span class="long">Add photos</span><span class="short">Add</span></button><button type="button" data-view="photos"><span class="long">All photos</span><span class="short">Photos</span></button><button type="button" data-view="requests"><span class="long">Requests</span><span class="short">Requests</span><span class="badge" id="nav-requests" hidden></span></button><button type="button" data-view="announcements"><span class="long">Announcements</span><span class="short">News</span></button><button type="button" id="logout">Sign out</button></aside><main class="studio" id="main">
<section data-view="overview">
<div class="view-top"><h1>Overview</h1><span><button class="btn btn-hot" type="button" data-go="add">+ Add photos</button> <button class="btn" type="button" id="logout-top">Sign out</button></span></div>
<div class="inbox-warn" id="ov-warn" role="status" hidden><p></p><button class="btn" type="button" data-go="requests">Answer requests</button></div>
<div class="stats"><button type="button" class="card" data-go="requests"><b id="stat-requests">-</b><span>Requests waiting</span></button><button type="button" class="card" data-go="photos"><b id="stat-photos">-</b><span>Photos on the site</span></button><button type="button" class="card" data-go="announcements"><b id="stat-ann">-</b><span id="stat-ann-label">Announcements live</span></button></div>
<div class="two"><div class="card"><h2>Photo requests</h2><ul class="mini" id="ov-requests"></ul><button class="btn" type="button" data-go="requests">Open requests</button></div>
<div class="card"><h2>Announcements</h2><ul class="mini" id="ov-ann"></ul><button class="btn" type="button" data-go="announcements">+ New announcement</button></div></div>
<div class="card"><h2>Latest photos</h2><ul class="latest" id="ov-photos"></ul><button class="btn" type="button" data-go="photos">See all photos</button></div>
</section>
<section data-view="add" hidden><div class="view-top"><h1>Add photos</h1></div>
<div class="card"><form id="add"><div class="form-cols"><div class="col">
<label class="drop" id="drop"><b>Choose photos</b><span>Tap here to pick one or several, or drag them in from your computer.</span><input id="photo" class="drop-input" type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple></label>
<ul id="picked" class="picked"></ul>
</div><div class="col">
<label for="title">Title (several photos share it)</label><input id="title" name="title" maxlength="60" required>
<label for="alt">Describe the photo for people who can't see it (optional)</label><input id="alt" name="alt" maxlength="150" placeholder="A receiver leaps for a one-handed catch over a defender">
<label for="credit">Photographer's Instagram name</label><input id="credit" name="credit" maxlength="40" placeholder="cb.framed.it" required>
<div class="team" role="group" aria-label="Fill in a team member">${TEAM.map((name) => `<button type="button" data-name="${name}" aria-pressed="false">@${name}</button>`).join("")}</div>
<label for="sport">Category</label><select id="sport" name="sport">${SEASONS.map(([season, sports]) => {
  const options = sports.map(([value, label]) => `<option value="${value}">${label.replace("&", "&amp;")}</option>`).join("");
  return season ? `<optgroup label="${season}">${options}</optgroup>` : options;
}).join("")}</select>
<label for="owner">Car owner's Instagram name (car photos only, optional)</label><p class="note">Car photos: press Edit under each photo above, choose Blur plates, and drag a box over every license plate. The site's privacy page promises plates are blurred.</p><input id="owner" name="owner" maxlength="40" placeholder="thatdernrs7">
</div></div>
<div class="form-end"><button class="btn btn-hot">Add to the portfolio</button>
<p class="note">Photos are shrunk to website size on this device before they are sent. They appear on the site right away.</p></div>
<p role="status"></p></form></div></section>
<section data-view="photos" hidden><div class="view-top"><h1>All photos</h1><button class="btn btn-hot" type="button" data-go="add">+ Add photos</button></div>
<div class="photo-tools"><input type="search" id="photo-search" placeholder="Search by title or photographer" aria-label="Search photos"><select id="photo-filter" aria-label="Show"><option value="all">All photos</option><option value="sports">Sports only</option><option value="cars">Cars only</option><option value="pinned">Pinned</option><option value="requested">Most requested</option><option value="removed">Taken off the site</option><option value="homepage">Homepage photo</option></select></div>
<p role="status" id="photos-status"></p>
<h2 style="margin-top:20px">Pinned</h2>
<p class="note">Pinned photos show first on their page, in this order.</p>
<ul id="pinned" class="pinned"></ul>
<h2>Added here</h2>
<p class="note">Photos added in the studio. Remove deletes them for good, after a 10-second chance to undo.</p>
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
<div class="card"><form id="announce"><input type="hidden" name="id" id="ann-id"><div class="form-cols"><div class="col">
<label for="ann-title">Headline</label><input id="ann-title" name="title" maxlength="80" required>
<label for="ann-text">Text</label><textarea id="ann-text" name="text" maxlength="400" rows="9" required></textarea>
</div><div class="col">
<label for="ann-date">Goes up on</label><input id="ann-date" name="date" type="date" required>
<label for="ann-until">Comes down after (optional)</label><input id="ann-until" name="until" type="date">
<p class="note">Pick a future date to schedule it. Leave the second date empty to keep it up.</p>
<label for="ann-link">Link (optional)</label><input id="ann-link" name="link" maxlength="300" placeholder="cars.html or https://...">
<label for="ann-link-text">Link text (optional)</label><input id="ann-link-text" name="linkText" maxlength="40" placeholder="See car shoots">
<label for="ann-photo">Photo (optional)</label><input id="ann-photo" type="file" accept="image/jpeg,image/png,image/webp,image/heic">
<div id="ann-photo-now" class="ann-photo-now" hidden><img alt=""><label><input type="checkbox" id="ann-photo-remove"> Remove this photo</label></div>
</div></div>
<div class="ann-preview"><h2 class="preview-label">Preview: how it looks on the homepage</h2><div class="ann-list"><article class="ann" id="ann-preview"></article></div></div>
<div class="form-end"><button class="btn btn-hot" id="ann-submit">Post announcement</button> <button class="btn" type="button" id="ann-cancel" hidden>Cancel editing</button></div>
<p role="status"></p></form></div>
<ul id="announcements" class="ann-admin"></ul></section>
<div id="blur-tool" class="blur-tool" hidden><div class="blur-panel"><h2>Edit photo</h2><div class="tool-bar"><div class="tool-modes" role="group" aria-label="What dragging does"><button type="button" class="btn" data-mode="crop" aria-pressed="false">Crop</button><button type="button" class="btn" data-mode="blur" aria-pressed="true">Blur plates</button></div><button type="button" class="btn tool-rotate">Rotate &#8635;</button><button type="button" class="btn tool-reset">Start over</button></div><p class="note tool-note"></p><canvas aria-label="The photo; drag on it to crop or to mark a plate"></canvas><div class="btns"><button type="button" class="btn blur-undo">Undo last box</button><button type="button" class="btn btn-hot blur-done">Done</button></div></div></div>
<div id="undo" class="undo" role="status" hidden><span></span><button type="button" class="btn btn-hot">Undo</button></div>
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
function shrink(image, width, quality, boxes) {
  const scale = Math.min(1, width / image.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  if (boxes && boxes.length) pixelate(context, canvas.width, canvas.height, boxes);
  if (WATERMARK) watermark(context, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

// ---- Photo editing before upload: rotate, crop and blur plates, all on this
// device. A photo is rotated first, then cropped (the crop is kept as fractions
// of the rotated photo), then blurred (boxes are fractions of the cropped photo),
// so the same edits fit every size the photo is shrunk to.
function pixelate(context, width, height, boxes) {
  for (const box of boxes) {
    const x = Math.round(box.x * width), y = Math.round(box.y * height);
    const w = Math.max(1, Math.round(box.w * width)), h = Math.max(1, Math.round(box.h * height));
    const cells = Math.max(2, Math.round(w / Math.max(4, w / 8)));
    const tiny = document.createElement("canvas");
    tiny.width = cells;
    tiny.height = Math.max(1, Math.round(cells * h / w));
    tiny.getContext("2d").drawImage(context.canvas, x, y, w, h, 0, 0, tiny.width, tiny.height);
    context.save();
    context.imageSmoothingEnabled = false;
    context.drawImage(tiny, 0, 0, tiny.width, tiny.height, x, y, w, h);
    context.restore();
  }
}

// The photo turned by pick.rotate degrees, at most "longest" pixels on its long side.
function turned(image, rotate, longest) {
  const scale = Math.min(1, longest / Math.max(image.width, image.height));
  const w = Math.round(image.width * scale), h = Math.round(image.height * scale);
  const sideways = rotate % 180 !== 0;
  const canvas = document.createElement("canvas");
  canvas.width = sideways ? h : w;
  canvas.height = sideways ? w : h;
  const g = canvas.getContext("2d");
  g.translate(canvas.width / 2, canvas.height / 2);
  g.rotate(rotate * Math.PI / 180);
  g.drawImage(image, -w / 2, -h / 2, w, h);
  return canvas;
}
// The rotated photo cut down to the crop.
function cropped(source, crop) {
  if (!crop) return source;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(crop.w * source.width));
  canvas.height = Math.max(1, Math.round(crop.h * source.height));
  canvas.getContext("2d").drawImage(source, crop.x * source.width, crop.y * source.height, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}
// What gets uploaded: rotated and cropped (blur is added when it is shrunk).
const prepare = (image, pick) => cropped(turned(image, pick.rotate, 2400), pick.crop);

let picks = []; // the photos chosen for upload: { file, rotate, crop, boxes, twin }
const newPick = (file) => ({ file, rotate: 0, crop: null, boxes: [], twin: "" });
const pickedList = document.getElementById("picked");
const photoInput = document.getElementById("photo");
photoInput.addEventListener("change", () => {
  picks = [...photoInput.files].map(newPick);
  showPicks();
  findTwins();
});
// Photos dragged onto the box count as picked.
const drop = document.getElementById("drop");
["dragenter", "dragover"].forEach((type) => drop.addEventListener(type, (event) => { event.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach((type) => drop.addEventListener(type, () => drop.classList.remove("over")));
drop.addEventListener("drop", (event) => {
  event.preventDefault();
  const files = [...event.dataTransfer.files].filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;
  picks = files.map(newPick);
  showPicks();
  findTwins();
});
function summary(pick) {
  const done = [];
  if (pick.rotate) done.push("rotated");
  if (pick.crop) done.push("cropped");
  if (pick.boxes.length) done.push(pick.boxes.length + (pick.boxes.length === 1 ? " area blurred" : " areas blurred"));
  return done.join(", ");
}
function showPicks() {
  drop.closest(".col").classList.toggle("has-picks", picks.length > 0);
  drop.querySelector("b").textContent = picks.length ? "Choose different photos" : "Choose photos";
  pickedList.textContent = "";
  picks.forEach((pick, i) => {
    const item = document.createElement("li");
    const image = document.createElement("img");
    image.src = URL.createObjectURL(pick.file);
    image.alt = "";
    if (pick.rotate) image.style.transform = "rotate(" + pick.rotate + "deg)";
    const label = document.createElement("b");
    label.textContent = summary(pick) || "Photo " + (i + 1);
    item.append(image, label);
    if (pick.twin) {
      const warn = document.createElement("p");
      warn.className = "twin";
      warn.textContent = "Already on the site? Looks like \\u201c" + pick.twin + "\\u201d.";
      item.append(warn);
    }
    item.append(button("Edit", "", () => openTool(pick)));
    pickedList.append(item);
  });
}

// ---- Duplicate warning: compares a tiny fingerprint of each picked photo with
// those of the photos already on the site (made from their small copies).
// Shrunk in two smooth steps, so the same photo at different sizes gives
// nearly the same fingerprint (a few bits apart) and different photos don't.
function fingerprint(source) {
  const middle = document.createElement("canvas");
  middle.width = 64;
  middle.height = 64;
  const m = middle.getContext("2d");
  m.imageSmoothingQuality = "high";
  m.filter = "blur(2px)";
  m.drawImage(source, 0, 0, 64, 64);
  const canvas = document.createElement("canvas");
  canvas.width = 9;
  canvas.height = 8;
  const g = canvas.getContext("2d");
  g.imageSmoothingQuality = "high";
  g.drawImage(middle, 0, 0, 9, 8);
  const d = g.getImageData(0, 0, 9, 8).data;
  const light = (i) => d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
  let bits = "";
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += light((y * 9 + x) * 4) > light((y * 9 + x + 1) * 4) ? "1" : "0";
  return bits;
}
const apart = (a, b) => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n; };
let siteFingerprints = null;
async function loadFingerprints() {
  if (siteFingerprints) return siteFingerprints;
  await loadBuiltIn();
  const known = everyPhoto().filter((p) => !state.hidden.includes(p.path));
  siteFingerprints = (await Promise.all(known.map(async (photo) => {
    try {
      const image = new Image();
      image.src = photo.thumb;
      await image.decode();
      return { title: photo.title, bits: fingerprint(image) };
    } catch (error) {
      return null;
    }
  }))).filter(Boolean);
  return siteFingerprints;
}
async function findTwins() {
  const mine = picks;
  const known = await loadFingerprints();
  for (const pick of mine) {
    try {
      const bits = fingerprint(await createImageBitmap(pick.file, { imageOrientation: "from-image" }));
      const match = known.find((k) => apart(k.bits, bits) <= 10);
      pick.twin = match ? match.title : "";
    } catch (error) {}
  }
  if (mine === picks) showPicks();
}

// ---- The editing panel.
const blurTool = document.getElementById("blur-tool");
const blurCanvas = blurTool.querySelector("canvas");
const modeButtons = [...blurTool.querySelectorAll("[data-mode]")];
const toolNote = blurTool.querySelector(".tool-note");
let blurPick = null, blurImage = null, preview = null, mode = "blur", dragFrom = null, dragBox = null;
async function openTool(pick) {
  blurPick = pick;
  blurImage = await createImageBitmap(pick.file, { imageOrientation: "from-image" });
  preview = turned(blurImage, pick.rotate, 1400);
  setMode("blur");
  blurTool.hidden = false;
  blurTool.querySelector(".blur-done").focus();
}
blurTool.addEventListener("keydown", (event) => {
  if (event.key === "Escape") { blurTool.hidden = true; showPicks(); }
});
function setMode(next) {
  mode = next;
  modeButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
  toolNote.textContent = mode === "crop" ? "Drag across the photo to choose what to keep. Changing the crop clears any blurred areas." : "Drag a box over each license plate. Everything inside a box is blurred on this device before upload.";
  drawTool();
}
function drawTool() {
  const shown = mode === "crop" ? preview : cropped(preview, blurPick.crop);
  blurCanvas.width = shown.width;
  blurCanvas.height = shown.height;
  const context = blurCanvas.getContext("2d");
  context.drawImage(shown, 0, 0);
  const { width, height } = blurCanvas;
  context.lineWidth = Math.max(2, width / 300);
  context.strokeStyle = "#ffc61a";
  if (mode === "crop") {
    const crop = dragBox || blurPick.crop;
    if (crop) {
      context.save();
      context.fillStyle = "rgba(0, 0, 0, 0.6)";
      context.beginPath();
      context.rect(0, 0, width, height);
      context.rect(crop.x * width, crop.y * height, crop.w * width, crop.h * height);
      context.fill("evenodd");
      context.restore();
      context.strokeRect(crop.x * width, crop.y * height, crop.w * width, crop.h * height);
    }
    return;
  }
  pixelate(context, width, height, blurPick.boxes);
  for (const box of blurPick.boxes.concat(dragBox ? [dragBox] : [])) context.strokeRect(box.x * width, box.y * height, box.w * width, box.h * height);
}
const at = (event) => {
  const r = blurCanvas.getBoundingClientRect();
  return { x: Math.min(1, Math.max(0, (event.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (event.clientY - r.top) / r.height)) };
};
blurCanvas.addEventListener("pointerdown", (event) => {
  dragFrom = at(event);
  blurCanvas.setPointerCapture(event.pointerId);
});
blurCanvas.addEventListener("pointermove", (event) => {
  if (!dragFrom) return;
  const to = at(event);
  dragBox = { x: Math.min(dragFrom.x, to.x), y: Math.min(dragFrom.y, to.y), w: Math.abs(to.x - dragFrom.x), h: Math.abs(to.y - dragFrom.y) };
  drawTool();
});
blurCanvas.addEventListener("pointerup", () => {
  if (dragBox && dragBox.w > 0.03 && dragBox.h > 0.03 && mode === "crop") {
    blurPick.crop = dragBox;
    blurPick.boxes = [];
  } else if (dragBox && dragBox.w > 0.01 && dragBox.h > 0.005 && mode === "blur") {
    blurPick.boxes.push(dragBox);
  }
  dragFrom = null;
  dragBox = null;
  drawTool();
});
modeButtons.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
blurTool.querySelector(".tool-rotate").addEventListener("click", () => {
  blurPick.rotate = (blurPick.rotate + 90) % 360;
  blurPick.crop = null;
  blurPick.boxes = [];
  preview = turned(blurImage, blurPick.rotate, 1400);
  drawTool();
});
blurTool.querySelector(".tool-reset").addEventListener("click", () => {
  blurPick.rotate = 0;
  blurPick.crop = null;
  blurPick.boxes = [];
  preview = turned(blurImage, 0, 1400);
  drawTool();
});
blurTool.querySelector(".blur-undo").addEventListener("click", () => { blurPick.boxes.pop(); drawTool(); });
blurTool.querySelector(".blur-done").addEventListener("click", () => { blurTool.hidden = true; showPicks(); });

// ---- Undo: a removal waits 10 seconds, so a wrong tap can be taken back.
const undoBar = document.getElementById("undo");
let pending = null;
function finishPending() {
  if (!pending) return;
  const job = pending;
  pending = null;
  clearTimeout(job.timer);
  undoBar.hidden = true;
  job.run();
}
function removeLater(label, run, restore) {
  finishPending();
  undoBar.querySelector("span").textContent = "Removed " + label + ".";
  undoBar.hidden = false;
  pending = { run, restore, timer: setTimeout(finishPending, 10000) };
}
undoBar.querySelector("button").addEventListener("click", () => {
  if (!pending) return;
  const job = pending;
  pending = null;
  clearTimeout(job.timer);
  undoBar.hidden = true;
  job.restore();
});
// Leaving the page or switching apps carries out a removal that is still waiting.
addEventListener("pagehide", finishPending);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") finishPending(); });
const post = (path, fields) => {
  const body = new FormData();
  for (const key in fields) body.set(key, fields[key]);
  return fetch(path, { method: "POST", body, keepalive: true });
};
// Small round icon buttons on photos. The label shows as a tooltip and is read out by screen readers.
const ICONS = {
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  pin: '<path d="M12 17v5M9 3h6l-1 6 4 4H6l4-4z"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  back: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
};
function iconButton(icon, label, className, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "ib" + (className ? " " + className : "");
  b.setAttribute("aria-label", label);
  b.title = label;
  b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[icon] + "</svg>";
  b.addEventListener("click", onClick);
  return b;
}
const button = (text, className, onClick) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "btn" + (className ? " " + className : "");
  b.textContent = text;
  b.addEventListener("click", onClick);
  return b;
};

// ---- Photos: added in the studio, built into the pages, and pinned.
const sitePhotos = document.getElementById("site-photos");
const pinnedList = document.getElementById("pinned");
let state = { photos: [], hidden: [], pins: [], hero: "" };
let requestCounts = {}; // photo path -> how often it was requested
async function refreshStats() {
  try { requestCounts = (await (await fetch("/studio/stats.json", { cache: "no-store" })).json()).requestCounts || {}; } catch (error) {}
}
const searchBox = document.getElementById("photo-search");
const filterBox = document.getElementById("photo-filter");
searchBox.addEventListener("input", () => render());
filterBox.addEventListener("change", () => render());
// Whether a photo matches the search box and the "Show" menu.
function shown(photo) {
  const words = searchBox.value.trim().toLowerCase();
  if (words && !(photo.title + " " + (photo.credit || "")).toLowerCase().includes(words)) return false;
  const filter = filterBox.value;
  if (filter === "sports") return !photo.cars;
  if (filter === "cars") return photo.cars;
  if (filter === "pinned") return state.pins.includes(photo.path);
  if (filter === "requested") return (requestCounts[photo.path] || 0) > 0;
  if (filter === "removed") return state.hidden.includes(photo.path);
  if (filter === "homepage") return state.hero === photo.path;
  return true;
}
const byRequests = (list) => (filterBox.value === "requested" ? list.slice().sort((a, b) => (requestCounts[b.path] || 0) - (requestCounts[a.path] || 0)) : list);
async function setHomepage(path) {
  const response = await post("/studio/hero", { path });
  const reply = await response.json();
  if (!response.ok) { status.textContent = reply.error; return; }
  state.hero = reply.hero;
  status.textContent = reply.hero ? "That photo is now the homepage background." : "The homepage is back to its usual photo.";
  render();
}
function homepageButton(photo) {
  const on = state.hero === photo.path;
  return iconButton("home", on ? "Homepage photo (press to go back to the usual one)" : "Use on homepage", on ? "on" : "", () => setHomepage(on ? "" : photo.path));
}
let builtIn = []; // filled in by loadBuiltIn()
const removing = new Set(); // added photos waiting out their 10 seconds
const uploadPath = (photo) => "uploads/" + photo.id + "/full.jpg";

let builtInLoading = null;
function loadBuiltIn() {
  builtInLoading = builtInLoading || readBuiltIn();
  return builtInLoading;
}
async function readBuiltIn() {
  const found = [];
  for (const page of ["/portfolio.html", "/cars.html"]) {
    const html = await (await fetch(page, { cache: "no-store" })).text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    for (const shot of doc.querySelectorAll(".shot")) found.push({ path: shot.dataset.full.replace(/^img\\/(lite|saver)\\//, "img/"), title: shot.dataset.title, credit: shot.dataset.credit || "", thumb: "/" + shot.querySelector("img").getAttribute("src").replace(/^img\\/(lite|saver)\\//, "img/"), cars: page === "/cars.html" });
  }
  builtIn = found;
}

async function refresh() {
  const data = await (await fetch("/portfolio-photos.json", { cache: "no-store" })).json();
  state = { photos: data.photos || [], hidden: data.hidden || [], pins: data.pins || [], hero: data.hero || "" };
  await Promise.all([loadBuiltIn(), refreshStats()]);
  render();
}

// Every photo the studio knows, by the path pins and requests use.
function everyPhoto() {
  const added = state.photos.filter((p) => !removing.has(p.id)).map((p) => ({ path: uploadPath(p), title: p.title, credit: p.credit, thumb: "/uploads/" + p.id + "/thumb.jpg", cars: p.sport === "cars", added: p }));
  return added.concat(builtIn);
}

async function savePins(pins) {
  const response = await post("/studio/pins", { pins: JSON.stringify(pins) });
  const reply = await response.json();
  if (!response.ok) { status.textContent = reply.error; return; }
  state.pins = reply.pins;
  render();
}
function pinButton(photo) {
  const pinned = state.pins.includes(photo.path);
  return iconButton("pin", pinned ? "Unpin" : "Pin to top", pinned ? "on" : "", () => savePins(pinned ? state.pins.filter((p) => p !== photo.path) : state.pins.concat(photo.path)));
}

function thumbItem(photo, actions) {
  const item = document.createElement("li");
  const frame = document.createElement("div");
  frame.className = "ph";
  const image = document.createElement("img");
  image.src = photo.thumb;
  image.alt = "";
  image.loading = "lazy";
  frame.append(image);
  if (state.pins.includes(photo.path)) { const flag = document.createElement("span"); flag.className = "tag live flag"; flag.textContent = "Pinned"; frame.append(flag); }
  const bar = document.createElement("div");
  bar.className = "bar";
  bar.append(...actions);
  frame.append(bar);
  const title = document.createElement("b");
  title.textContent = photo.title + (photo.cars ? " (cars)" : "");
  item.append(frame, title);
  const asked = requestCounts[photo.path] || 0;
  const tags = document.createElement("span");
  tags.className = "tags";
  if (asked) { const t = document.createElement("span"); t.className = "tag"; t.textContent = "Requested " + asked + "\\u00d7"; tags.append(t); }
  if (state.hero === photo.path) { const t = document.createElement("span"); t.className = "tag live"; t.textContent = "Homepage"; tags.append(t); }
  if (tags.children.length) item.append(tags);
  return item;
}

function render() {
  const all = everyPhoto();
  const live = state.photos.filter((p) => !removing.has(p.id));
  counts.added = live.length;
  counts.builtIn = builtIn.filter((p) => !state.hidden.includes(p.path)).length;
  showPhotoCount();

  // Overview: the five newest added photos.
  const latest = document.getElementById("ov-photos");
  latest.textContent = "";
  for (const photo of live.slice(0, 5)) {
    const item = document.createElement("li");
    const image = document.createElement("img");
    image.src = "/uploads/" + photo.id + "/thumb.jpg";
    image.alt = photo.title;
    item.append(image);
    latest.append(item);
  }
  if (!live.length) latest.append(miniRow("Nothing added in the studio yet.", ""));

  // Pinned, in order, with arrows to move them.
  pinnedList.textContent = "";
  const pinned = state.pins.map((path) => all.find((p) => p.path === path)).filter(Boolean);
  if (!pinned.length) {
    const none = document.createElement("li");
    none.className = "empty";
    none.textContent = "Nothing pinned. Press Pin to top on any photo below.";
    pinnedList.append(none);
  }
  pinned.forEach((photo, i) => {
    const order = pinned.map((p) => p.path);
    const move = (to) => { const next = order.slice(); next.splice(i, 1); next.splice(to, 0, photo.path); savePins(next); };
    const up = iconButton("up", "Move up", "", () => move(i - 1));
    up.disabled = i === 0;
    const down = iconButton("down", "Move down", "", () => move(i + 1));
    down.disabled = i === pinned.length - 1;
    pinnedList.append(thumbItem(photo, [up, down, pinButton(photo)]));
  });

  // Added in the studio: Edit, Pin, Remove (with Undo).
  list.textContent = "";
  for (const photo of byRequests(all.filter((p) => p.added && shown(p)))) {
    let item;
    const edit = iconButton("edit", "Edit details", "", () => openEditor(item, photo.added));
    const remove = iconButton("trash", "Remove", "danger", () => {
      const id = photo.added.id;
      removing.add(id);
      render();
      removeLater('"' + photo.title + '"',
        () => post("/studio/delete", { id }).then(() => { removing.delete(id); refresh(); }),
        () => { removing.delete(id); render(); });
    });
    item = thumbItem(photo, [edit, pinButton(photo), homepageButton(photo), remove]);
    list.append(item);
  }
  if (!list.children.length) list.append(miniRow(all.some((p) => p.added) ? "No added photos match." : "Nothing added in the studio yet.", ""));

  // Built into the pages: Pin, and Remove / Put back.
  sitePhotos.textContent = "";
  for (const photo of byRequests(builtIn.filter(shown))) {
    const off = state.hidden.includes(photo.path);
    const toggle = iconButton(off ? "back" : "trash", off ? "Put back" : "Remove", off ? "" : "danger", async () => {
      toggle.disabled = true;
      const response = await post(off ? "/studio/unhide" : "/studio/hide", { path: photo.path });
      const reply = await response.json();
      if (response.ok) { state.hidden = reply.hidden; render(); }
      else { status.textContent = reply.error; toggle.disabled = false; }
    });
    const item = thumbItem(photo, off ? [toggle] : [pinButton(photo), homepageButton(photo), toggle]);
    if (off) item.className = "off";
    sitePhotos.append(item);
  }
  if (!sitePhotos.children.length) sitePhotos.append(miniRow("No photos on the pages match.", ""));
}

// Edits an added photo's details in place.
function openEditor(item, photo) {
  if (item.querySelector("form")) return;
  const form = document.createElement("form");
  form.className = "photo-edit";
  const field = (label, name, value, max) => {
    const l = document.createElement("label");
    l.textContent = label;
    const input = document.createElement("input");
    input.name = name;
    input.value = value || "";
    input.maxLength = max;
    l.append(input);
    return l;
  };
  const sportLabel = document.createElement("label");
  sportLabel.textContent = "Category";
  const sport = document.createElement("select");
  sport.name = "sport";
  sport.innerHTML = document.getElementById("sport").innerHTML;
  sport.value = photo.sport;
  sportLabel.append(sport);
  const save = document.createElement("button");
  save.className = "btn btn-hot";
  save.textContent = "Save";
  const note = document.createElement("p");
  note.className = "note";
  form.append(field("Title", "title", photo.title, 60), field("Description (for screen readers)", "alt", photo.alt, 150), field("Photographer", "credit", photo.credit, 40), sportLabel, field("Car owner (cars only)", "owner", photo.owner, 40), save, button("Cancel", "", () => form.remove()), note);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = new FormData(form);
    body.set("id", photo.id);
    const response = await fetch("/studio/edit-photo", { method: "POST", body });
    if (response.ok) refresh();
    else note.textContent = (await response.json()).error;
  });
  item.append(form);
  form.querySelector("input").focus();
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
  for (const item of items.slice(0, 3)) ovRequests.append(miniRow(item.name, " wants " + (item.title || "a photo") + " \\u00b7 " + item.contact));
  await Promise.all([refreshStats(), loadBuiltIn()]);
  const top = Object.entries(requestCounts).sort((a, b) => b[1] - a[1])[0];
  if (top) {
    const known = everyPhoto().find((p) => p.path === top[0]);
    ovRequests.append(miniRow("Most requested: ", (known ? known.title : top[0].replace(/^.*\\//, "")) + " (" + top[1] + (top[1] === 1 ? " request)" : " requests)")));
  }
  if (!items.length) ovRequests.append(miniRow("No requests right now.", ""));
  if (!items.length) {
    const none = document.createElement("li");
    none.className = "empty";
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
  const files = picks.map((pick) => pick.file);
  if (!files.length) { addStatus.textContent = "Choose at least one photo first."; return; }
  const button = event.target.querySelector(".btn-hot");
  button.disabled = true;
  if (WATERMARK) await document.fonts.load('800 40px "Big Shoulders Display"').catch(() => {});
  let added = 0;
  const problems = [];
  for (const [i, file] of files.entries()) {
    const of = files.length > 1 ? " " + (i + 1) + " of " + files.length : "";
    try {
      addStatus.textContent = "Preparing photo" + of + "...";
      const image = prepare(await createImageBitmap(file, { imageOrientation: "from-image" }), picks[i]);
      const body = new FormData(event.target);
      body.set("full", await shrink(image, 1200, 0.82, picks[i].boxes), "full.jpg");
      body.set("thumb", await shrink(image, 480, 0.7, picks[i].boxes), "thumb.jpg");
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
  if (added) { event.target.reset(); picks = []; showPicks(); markTeam(); refresh(); }
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

const removingAnn = new Set(); // announcements waiting out their 10 seconds
async function refreshAnnouncements() {
  const { today: day, items: everything } = await (await fetch("/studio/announcements.json", { cache: "no-store" })).json();
  const items = everything.filter((item) => !removingAnn.has(item.id));
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
      const now = document.getElementById("ann-photo-now");
      now.hidden = !item.photo;
      if (item.photo) now.querySelector("img").src = "/announcement-photos/" + item.id + ".jpg?v=" + item.photo;
      document.getElementById("ann-photo-remove").checked = false;
      updatePreview();
      document.getElementById("ann-submit").textContent = "Save changes";
      document.getElementById("ann-cancel").hidden = false;
      announceStatus.textContent = "Editing: " + item.title;
      announceForm.scrollIntoView({ behavior: "smooth" });
    });
    const remove = document.createElement("button");
    remove.className = "btn btn-danger";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      removingAnn.add(item.id);
      refreshAnnouncements();
      removeLater('"' + item.title + '"',
        () => post("/studio/announce-delete", { id: item.id }).then(() => { removingAnn.delete(item.id); refreshAnnouncements(); }),
        () => { removingAnn.delete(item.id); refreshAnnouncements(); });
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
  document.getElementById("ann-photo-now").hidden = true;
  updatePreview();
}
document.getElementById("ann-cancel").addEventListener("click", () => { stopEditing(); announceStatus.textContent = ""; });

announceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const editing = document.getElementById("ann-id").value !== "";
  announceStatus.textContent = editing ? "Saving..." : "Posting...";
  const body = new FormData(announceForm);
  const picked = document.getElementById("ann-photo").files[0];
  try {
    if (picked) body.set("photo", await shrink(await createImageBitmap(picked, { imageOrientation: "from-image" }), 1200, 0.82), "photo.jpg");
  } catch (error) {
    announceStatus.textContent = "This device could not read that photo. Try a JPEG.";
    return;
  }
  if (document.getElementById("ann-photo-remove").checked) body.set("removePhoto", "1");
  const response = await fetch("/studio/announce", { method: "POST", body });
  const scheduled = dateBox.value > today();
  announceStatus.textContent = response.ok ? (editing ? "Saved." : "Posted.") + (scheduled ? " It goes up on " + dateBox.value + "." : " It shows on the homepage right away.") : (await response.json()).error;
  if (response.ok) { stopEditing(); refreshAnnouncements(); }
});


// ---- Live preview of the announcement card, built the same way as the homepage's (js/announcements.js).
const previewCard = document.getElementById("ann-preview");
let previewPhoto = "";
function updatePreview() {
  const title = document.getElementById("ann-title").value.trim() || "Your headline";
  const text = document.getElementById("ann-text").value.trim() || "Your announcement text shows here.";
  const date = dateBox.value || today();
  const link = document.getElementById("ann-link").value.trim();
  const linkText = document.getElementById("ann-link-text").value.trim() || "Read more";
  const picked = document.getElementById("ann-photo").files[0];
  const keepOld = !document.getElementById("ann-photo-now").hidden && !document.getElementById("ann-photo-remove").checked;
  if (previewPhoto.startsWith("blob:")) URL.revokeObjectURL(previewPhoto);
  previewPhoto = picked ? URL.createObjectURL(picked) : keepOld ? document.querySelector("#ann-photo-now img").src : "";
  previewCard.textContent = "";
  previewCard.className = "ann" + (previewPhoto ? " has-photo" : "");
  if (previewPhoto) { const image = document.createElement("img"); image.src = previewPhoto; image.alt = ""; previewCard.append(image); }
  const when = document.createElement("time");
  when.textContent = new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const heading = document.createElement("h3");
  heading.textContent = title;
  const body = document.createElement("p");
  body.textContent = text;
  if (link) { const a = document.createElement("a"); a.href = "#"; a.textContent = linkText; body.append(" ", a); }
  previewCard.append(when, heading, body);
}
announceForm.addEventListener("input", updatePreview);
announceForm.addEventListener("change", updatePreview);
updatePreview();
refresh();
refreshAnnouncements();
refreshRequests();

// Photos shared from the phone's gallery (sw.js keeps them for a moment) land here.
async function takeShared() {
  if (!new URLSearchParams(location.search).has("shared") || !("caches" in window)) return;
  history.replaceState(null, "", "/studio#add");
  const box = await caches.open("studio-share");
  const files = [];
  for (const key of await box.keys()) {
    const response = await box.match(key);
    const blob = await response.blob();
    files.push(new File([blob], decodeURIComponent(response.headers.get("x-file-name") || "shared.jpg"), { type: blob.type }));
  }
  await caches.delete("studio-share");
  if (!files.length) return;
  try {
    const transfer = new DataTransfer();
    files.forEach((file) => transfer.items.add(file));
    photoInput.files = transfer.files;
  } catch (error) {}
  picks = files.map(newPick);
  showPicks();
  findTwins();
  go("add");
  addStatus.textContent = files.length + (files.length === 1 ? " photo" : " photos") + " ready. Fill in the details and press Add to the portfolio.";
}
takeShared();
</script>`;

export function studioPage({ state }) {
  const body = state === "in" ? nav + signedIn + "</main></div>" : signinTop + (state === "off" ? off : out) + signinEnd;
  return head + body + '<script src="/js/site.js"></script></body></html>';
}
