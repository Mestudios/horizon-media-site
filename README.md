# horizon-media-site

The Horizon Media website: one static page (`index.html`, `css/`, `js/`, `img/`) deployed on Netlify from this repository.

## What gets published

Netlify runs `tools/build-site.sh`, which copies the website into `dist/` and publishes that folder.

Everything at the top of the repository counts as part of the website, except the project's own files: `netlify/`, `netlify.toml`, `tests/`, `tools/`, `package.json`, `package-lock.json` and this README. A new page or folder is therefore published automatically, while the code that runs on Netlify's side cannot be downloaded from the site.

## Site guard

The guard runs on Netlify in front of the homepage. Its code is in `netlify/guard/` (start with `guard.js`), and `netlify/edge-functions/guard.js` plugs it into Netlify. If it ever fails, Netlify serves the page without it.

**Busy mode.** The guard counts the visitors who opened the page in the last two minutes.

- More than 10: the page is served with small photos from `img/lite/` (about a fifth of the normal download).
- More than 30: the smallest photos from `img/saver/` (about a tenth).
- It steps back as traffic falls: lite switches off at 8 visitors or fewer, saver at 24 or fewer.
- Search engines and link-preview bots always get the normal page and are not counted.

Visitors are told apart by an anonymous cookie, `hm_visitor`: a random id that lasts 30 minutes. Counting stores no IP addresses.

**Rate limit.** An address that loads the page more than 300 times in a minute gets a small "Timeout" page instead, which reloads itself after a minute. That address is written to the function's log, so it can be blocked in Netlify if it keeps coming back.

**Security headers.** Other sites cannot show this one inside a frame, browsers may not guess file types, and the site asks for no device features. The headers are listed twice and must match: in `netlify.toml` (for every file) and in `netlify/guard/settings.js` (for the homepage).

### Seeing it work

- Add `?busy=lite` or `?busy=saver` to the site address to see that mode.
- Every homepage response has `x-busy-mode` and `x-busy-visitors` headers.
- Mode changes and refused addresses are written to the function's log in the Netlify dashboard.

### Changing the numbers

The thresholds, the two-minute window, the rate limit and the cookie are in `netlify/guard/settings.js`. The rate limit also appears in `netlify/edge-functions/guard.js` as Netlify's own setting; keep the two the same.

## Portfolio page, car page and the studio

`portfolio.html` shows the portfolio: a grid with a sport filter and a full-size viewer (`js/portfolio.js`). Its photos are in `img/portfolio/`, with small copies for the grid in `img/portfolio/thumb/`.

`cars.html` is the car photography page. It uses the same grid and viewer; its photos go in `photos/cars/` and are listed in the page like the portfolio's.

The **studio** at `/studio` lets Horizon Media add and remove portfolio photos from any phone or computer with one username and password. Its code is in `netlify/studio/`.

- The sign-in is two environment variables in the Netlify project settings: `STUDIO_USERNAME` and `STUDIO_PASSWORD` (at least 12 characters). Until both are set, the studio is switched off. Changing the password signs everyone out. Never write them in this repository: it is public.
- Photos are shrunk to website size on the device before upload, stored in Netlify Blobs, and shown first on the portfolio page, or on the car page when their category is Cars.
- Five wrong sign-ins in a minute from one address locks that address out for the rest of the minute.

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
3. Run `python3 tools/make_photo_variants.py`. It needs Pillow (`pip install pillow`).
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
