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

## Photo protection

`js/protect.js` discourages casual copying. It cannot stop someone determined.

- Right-click and dragging are blocked on photos.
- On computers, the photos blur when a screenshot shortcut is pressed or the visitor leaves the window, and sharpen when they come back. A note in the corner says so.
- On phones and tablets nothing can be done about screenshots: they are taken with hardware buttons a web page cannot see.

## After adding or replacing a photo

```
python3 tools/make_photo_variants.py
```

This creates the smaller copies and updates the list in `netlify/guard/photo-variants.js`. Commit what it changes. A photo without copies still works: it stays full size in busy mode. The script needs Pillow (`pip install pillow`).

## Tests

```
npm install
npm test
```

The tests run the real guard against a local copy of Netlify's storage, with simulated crowds, floods, bots and storage failures. They also check the published folder, the security headers, and that every photo on the page has its smaller copies.
