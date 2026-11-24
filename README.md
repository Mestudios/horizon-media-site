# horizon-media-site

The Horizon Media website: one static page (`index.html`, `css/`, `js/`, `img/`) deployed on Netlify from this repository.

## What gets published

Netlify runs `tools/build-site.sh`, which copies the website into `dist/` and publishes that folder.

Everything at the top of the repository counts as part of the website, except the project's own files: `netlify/`, `netlify.toml`, `tests/`, `tools/`, `package.json`, `package-lock.json` and this README. A new page or folder is therefore published automatically, while the code that runs on Netlify's side cannot be downloaded from the site.

## Site guard

The guard runs on Netlify in front of every page (busy mode only on the pages with photos). Its code is in `netlify/guard/` (start with `guard.js`), and `netlify/edge-functions/guard.js` plugs it into Netlify. If it ever fails, Netlify serves the page without it.

**Busy mode.** The guard counts the visitors who opened the page in the last two minutes.

- More than 10: the page is served with small photos from `img/lite/` (about a fifth of the normal download).
- More than 30: the smallest photos from `img/saver/` (about a tenth).
- It steps back as traffic falls: lite switches off at 8 visitors or fewer, saver at 24 or fewer.
- Search engines and link-preview bots always get the normal page and are not counted.

Visitors who press **Allow** on the cookie question are told apart by an anonymous cookie, `hm_visitor`: a random id that lasts 30 minutes. Everyone else gets no cookie, and each of their page loads counts as a visitor (so busy mode can switch on a little sooner). Counting stores no IP addresses.

**Rate limit.** An address that loads a page more than 300 times in a minute gets a small "Timeout" page instead, which reloads itself after a minute. That address is written to the function's log.

**Kicked off.** An address that keeps going (600 page loads in a minute, or hammering the studio's lists or images far past their "slow down" limit) is banned from the whole site for an hour: every page shows it a short "Blocked" page, and the studio answers it with nothing. The ban list is kept in Netlify Blobs (`netlify/guard/bans.js`, addresses scrambled), so every server and both edge functions share it; each server re-reads it in the background once a minute, so checking it costs almost nothing. The numbers are `BAN_AFTER` and `BAN_MINUTES` in `netlify/guard/settings.js` and `BAN_PER_MINUTE` in `netlify/studio/studio.js`.

**Honeypots.** Two traps catch bots without bothering people. (1) Trap addresses: pages this site has never had that only break-in bots look for (`/wp-login.php`, `/wp-admin/…`, `/.env`, `/.git/config`, `/xmlrpc.php`, `/phpmyadmin/…`, `/administrator`). Asking for one answers a plain "Not found" and bans the address for an hour, the same ban as above. The list is `TRAPS` and `TRAP_FOLDERS` in `netlify/guard/settings.js`, repeated in `config.path` of `netlify/edge-functions/guard.js` (a test checks they match); only add addresses no real visitor would type. The ban list is shared by the live site and previews, so opening a trap address on a preview blocks you on the live site too for an hour. (2) Form trap: the photo request and removal forms have a hidden "Leave this empty" box (`website`). A submission that fills it gets a normal "sent" reply and is not saved. It does not ban, because some browsers' autofill could fill it by mistake.

**Security headers.** Other sites cannot show this one inside a frame, browsers may not guess file types, and the site asks for no device features. The headers are listed twice and must match: in `netlify.toml` (for every file) and in `netlify/guard/settings.js` (for the homepage).

### Seeing it work

- Add `?busy=lite` or `?busy=saver` to the site address to see that mode.
- Every homepage response has `x-busy-mode` and `x-busy-visitors` headers.
- Mode changes and refused addresses are written to the function's log in the Netlify dashboard.

### Changing the numbers

The thresholds, the two-minute window, the rate limit and the cookie are in `netlify/guard/settings.js`. The rate limit also appears in `netlify/edge-functions/guard.js` as Netlify's own setting; keep the two the same.

## Portfolio page, car page and the studio

`portfolio.html` shows the portfolio: a grid and a full-size viewer (`js/portfolio.js`). Its photos are in `img/portfolio/`, with small copies for the grid in `img/portfolio/thumb/`.

Each tile shows a tiny blurry preview (`--ph`, from `tools/make_placeholders.py`) until its photo arrives and fades in; photos added in the studio in the last week get a "New" tag; on phones, swiping left or right moves between open photos. Opening a photo gives it its own address (`#photo=<name>`), and **Share** opens the phone's share menu with it (on computers it copies the link), so a shared link opens straight on that photo. The viewer draws each photo onto a canvas covered in faint, slanted Horizon Media marks (`TILE` in `js/portfolio.js` sets their size, strength and spacing), so the photo people see (or save) there always carries the mark; the files themselves stay unmarked. Under each photo, **Request this photo** opens a short form (name, Instagram or email, a message). Requests go to the studio's inbox. One address can send 5 an hour, at most 20 wait in the inbox at once (`netlify/studio/limits.js`); from 15 the studio's overview shows a warning; when it is full, visitors see a one-sentence message asking them to try again later or message on Instagram, and a hidden field catches simple bots.

`cars.html` is the car photography page. It uses the same grid and viewer; its photos go in `photos/cars/` and are listed in the page like the portfolio's.

The **studio** at `/studio` lets Horizon Media add and remove portfolio photos from any phone or computer with one username and password. Its code is in `netlify/studio/`.

- **Announcements** has three tabs: Announcements (a list with thumbnails, dates and Live/Scheduled/Ended; **+ New announcement** or Edit opens the form, with dates and link under "More options"), Recaps (**+ New recap**) and Notice bar (its tab shows On or Off).
- Once signed in, the studio is a dashboard: a side menu (a bar along the bottom on phones) with Overview, Add photos, All photos, Requests and Announcements. Overview shows the counts and the latest of each.
- **Edit before upload:** under each picked photo, Edit opens it to **rotate**, **crop** (drag what to keep) and **blur plates** (drag a box over each license plate). All of it happens on the device before upload, so a readable plate never leaves the phone.
- **Already on the site?** Each picked photo is compared with the photos already on the site (a tiny fingerprint of each, made on the device), and a likely repeat is flagged by name.
- **All photos** has a search box (title or photographer) and a Show menu: sports, cars, pinned, most requested, taken off the site, or the homepage photo. Each photo shows how many times visitors requested it; the overview names the most requested one (counts are kept after requests are handled, in `request-counts`).
- **Use on homepage** makes any photo the homepage background. The guard swaps it into the homepage (re-reading the choice at most once a minute), and busy mode still uses its smaller copies.
- **Announcements** show a live preview of the homepage card as you type.
- **Share from the gallery:** once the site is added to an Android phone's home screen, Horizon Media appears in the phone's Share menu. Photos shared to it open in Add photos, ready to fill in. `sw.js` (a service worker installed only when the studio is opened, covering only `/studio/`) passes them over; it caches nothing else. iPhones do not support this yet.
- **Edit** changes an added photo's title, credit, category or car owner. **Pin to top** puts any photo first on its page; the Pinned list sets their order (up to 24).
- **Remove** on an added photo or an announcement takes effect after 10 seconds, with an Undo button until then (leaving the page carries it out at once).
- "Keep me signed in on this device" at sign-in keeps that person signed in for 30 days instead of 12 hours.
- **On the site** lists every photo built into the portfolio and car pages. Remove takes one off the site (it is listed in Netlify Blobs and the pages leave it out); Put back shows it again. Its file stays in the repository; to delete it for good, remove it from the page in code.
- **Photo requests** lists what visitors asked for. Done deletes a request.

- The sign-in is two environment variables in the Netlify project settings: `STUDIO_USERNAME` and `STUDIO_PASSWORD` (at least 12 characters). Until both are set, the studio is switched off. Changing the password signs everyone out. Never write them in this repository: it is public. To give more people their own sign-in, add `STUDIO_USERNAME_2` and `STUDIO_PASSWORD_2`, then `_3`, up to `_5`; changing one person's password signs out only that person.
- Up to 50 photos can be picked and uploaded at once; they share the title, credit and category.
- The studio knows who signed in: it greets you by name, fills in your photo credit (your Instagram name, saved once under Overview), and tags each added photo with who added or last edited it.
- **Goes live** (on upload or when editing a photo) schedules a photo for a later time, up to a year ahead. Until then only the studio sees it, tagged with its time; it appears on the site by itself.
- **Notice bar** (top of Announcements) puts one short line, with an optional link and last day, at the top of every page. Visitors can close it for their visit. Like the homepage photo, it shows within a minute (`netlify/guard/notice.js`).
- **Trash:** Remove on an added photo moves it to the Trash (under All photos) for 30 days, with its files kept out of public reach; Restore puts it back, and after 30 days it is deleted for good. Thumbnails in the Trash load from `/studio/trash-photo/<id>.jpg`, for the team only.
- **Removal requests:** "Request removal" in the photo viewer is a short form (name, contact, how they're connected) posted to `/removal-request`, with email and Instagram as alternatives. They show under Requests: **Take down** moves the photo to the Trash (or takes a built-in photo off its page), **Keep it up** dismisses it. Either way the visitor's details are deleted and only a record (photo, outcome, who, when) is kept, up to the newest 100.
- **Reply templates** (under Requests): ready-made replies for photo requests with `{name}`, `{photo}` and `{link}` filled in; **Copy reply** on each request copies one to paste into Instagram or email.
- **Announcement photos from the site:** besides uploading a photo, **Choose from the portfolio** picks any photo already on the portfolio or car page (stored as `photoPath`; the homepage shows its smaller copy). If that photo later comes off the site, the card simply goes without it. A recap's announcement uses the recap's first photo.
- **Crop & position** (announcement photo): drag and zoom inside a frame the shape of the homepage card. Saved as `photoCrop` (the part shown, as fractions of the photo), so the photo itself is never changed; cropped portfolio picks use the full-size copy to stay sharp.
- Messages that something worked (Saved, Posted, Added…) clear themselves after 5 seconds; errors stay.
- **Recaps** (under Announcements): pick photos (up to 60), give a headline and date, and Post. That makes a page at `recap.html?r=<id>` (photos load from `/recaps/<id>.json`, leaving out any no longer on the site) and an announcement linking to it. Recap pages use the same viewer as the portfolio.
- **Presets** adds free presets: a name, a line about it, the phone (.dng, up to 8 MB) and computer (.xmp) files, and optional before and after photos. They show on the presets page with a before/after slider and download buttons; up to 30 at once.
- Photos are shrunk to website size on the device before upload, stored in Netlify Blobs, and shown first on the portfolio page, or on the car page when their category is Cars.
- Signed-in team members can also post, edit and remove **announcements**, each with an optional photo (served at `/announcement-photos/<id>.jpg`) and an optional link to a page of the site or an https address. An announcement goes up on its date (a future date schedules it) and, if it has a "comes down after" date, comes down after that day. Days follow New York time (`TIME_ZONE` in `netlify/studio/studio.js`). They are stored in Netlify Blobs and served at `/announcements.json`, and `js/announcements.js` shows the newest three on the homepage. The cards written into `index.html` only show if that list can't be loaded.
- Five wrong sign-ins in a minute from one address locks that address out for the rest of the minute, and ten in 15 minutes locks it out for 15 minutes. The second count is kept in Netlify Blobs (under a scrambled form of the address), so it holds across all of Netlify's servers.
- The public lists (`/portfolio-photos.json`, `/announcements.json`) are read from one stored copy that the studio rebuilds after every change (and at least every 10 minutes), so a page view costs one storage read however much is in the studio. One visitor can load them 300 times a minute and studio images 1,500 times a minute before being told to slow down (high enough for a whole school on one network), and is kicked off at four times that.

## Cookies, consent and third parties

- The privacy page's **Cookies** section (`privacy.html#cookies`) lists everything the site stores. There are no advertising, analytics or tracking cookies.
- **The cookie question** (`js/site.js`, styled as `.cookie-ask` in `css/site.css`) appears on every public page until the visitor answers. **Allow** sets `hm_cookies=yes` (180 days); only then does the guard hand out `hm_visitor`. **No thanks** sets no cookie: the answer is kept in the browser's storage as `hm-cookies=no`, and the guard tells the browser to delete any `hm_visitor` it still has. The privacy page has a **Change your cookie choice** button. The studio never asks: `hm_studio` is only for signed-in team members. `hm-theme` / `hm-forms` are only saved in the visitor's own browser when they choose.
- The only third-party content is the Google booking form. `book.html` doesn't load it until the visitor presses "Load the booking form" (`js/book.js`); "Remember my choice" saves `hm-forms` in their browser.
- Fonts and photos are served from this site. Instagram is only linked to, never loaded. `npm test` fails if any page starts loading something from another company.
- **Removal:** every opened photo has a "Request removal" link (an email or Instagram message to the team with the photo named), the portfolio and car pages say so above the photos, and every footer links to the removal steps on the privacy page.
- **Studio link:** no page links to `/studio`. `js/site.js` adds a "Studio" footer link only on devices that have signed in to the studio (`hm-team` in that browser). The service worker is installed only by the studio and only covers `/studio/`.
- **Terms** include the client license (what people may do with photos from a booking), cancellations and rain-outs, delivery, athletes under 18, and Maryland governing law. Horizon Media takes no payments, so there is no payment section.
- The photo request form asks only for a name, an Instagram name or email, and an optional message, and must be sent with the consent box ticked (checked on the server too).
- The terms page's **Payment and refunds** section (`terms.html#refunds`) explains that Horizon Media takes no payments: each photographer sets their own prices and handles payment and refunds directly. The old `/cookies.html` and `/refunds.html` addresses redirect to these sections (`netlify.toml`).

## Accessibility

Every page starts with a "Skip to content" link, keeps its content inside one `<main>`, and works with the keyboard alone: the photo viewer and request form keep Tab inside them while open, Esc closes them and returns focus to where it was. All photos have alt text; studio uploads can be given a description for screen readers. The pages were checked with axe (WCAG 2.1 AA, light and dark) with no problems found.

## Booking page and page not found

`book.html` shows the Google booking form inside the site, once the visitor agrees to load it; every "Book" button leads there. If the form ever fails to show, the page has a button that opens it directly. To change forms, replace the forms.gle address in `book.html` (it appears twice).

`404.html` is what Netlify shows for an address that doesn't exist.

## Presets page

`presets.html` shows the free Lightroom presets added in the studio's **Presets** section (`js/presets.js` reads `/presets.json`); until there are any, it says they are coming in December 2026. The terms page already covers how the presets may be used.

## Light and dark mode, and the app icon

The site follows the visitor's phone or computer setting for light or dark mode. The round switch in the menu bar overrides it, and the choice is saved in that browser only (`js/site.js`). The colours for both modes are at the top of `css/site.css`; text over photos and the photo viewer stay dark in both.

`manifest.webmanifest` and the icons in `img/icon-*.png` let visitors add the site to their home screen like an app. On Android and computers, an "Add to home screen" button appears in the footer when the browser offers it; on iPhones it is in Safari's Share menu.

## Photo protection

`js/protect.js` discourages casual copying. It is not a security control: it cannot stop someone determined, and nothing relies on it. The real protection is that only web-sized copies are published (see Photos).

- Right-click and dragging are blocked on photos.
- On computers, the photos blur when a screenshot shortcut is pressed or the visitor leaves the window, and sharpen when they come back. A note in the corner says so.
- On phones and tablets nothing can be done about screenshots: they are taken with hardware buttons a web page cannot see.

## Photos

The website never publishes an original photo. Originals live in `photos/`, which `tools/build-site.sh` leaves out of the published site. Every photo a page shows is a copy made from one of them by `tools/make_photo_variants.py`:

- the web copy in `img/`: at most 1200 pixels wide (480 for grid thumbnails) and compressed;
- smaller busy-mode copies in `img/lite/` and `img/saver/`;
- the list busy mode reads, `netlify/guard/photo-variants.js`.

The script can also add a visible Horizon Media watermark to every copy: set `WATERMARK = True` at the top of it and run it with `--force`.

### Adding or replacing a photo

1. Put the original in `photos/`, at the same path the page will use under `img/`. For example, `photos/game-day.jpg` is shown as `img/game-day.jpg`.
2. Add it to the page (`index.html` or `portfolio.html`) using the `img/` path.
3. Run `python3 tools/make_photo_variants.py`, then `python3 tools/make_placeholders.py` (which gives each portfolio and car tile its tiny blurry preview). Both need Pillow (`pip install pillow`).
4. Commit everything it changed, including the original in `photos/`.

`npm test` fails if a photo on a page has no original, or if its copies are out of date.

Photos added through the studio are shrunk on the device before they are uploaded, so the original never leaves it. Turning on `WATERMARK` at the top of the studio's script in `netlify/studio/page.js` watermarks them too.

**This repository is public on GitHub**, so anything committed here, including `photos/`, can be downloaded from GitHub even though the website does not publish it. Make the repository private to keep the originals private; Netlify keeps working.

## Tests

```
npm install
npm test
```

The tests run the real guard against a local copy of Netlify's storage, with simulated crowds, floods, bots and storage failures. They also check the published folder, the security headers, and that every photo on the page has its smaller copies.
