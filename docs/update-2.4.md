# Update 2.4 plan: the free presets go live

A small release on top of 2.3, planned for December 2026, after 2.1 to 2.3
are live. This file is the working plan; it is removed once 2.4 is built.

## What already exists (not rebuilt)

- The studio's Presets section: name, a line of text, a `.dng` and an `.xmp`
  file, optional before and after photos. It checks the files really are
  Lightroom presets.
- `presets.json`, the preset file addresses, and `js/presets.js`, which shows
  the cards with a before/after slider and download buttons, and switches the
  page out of "Coming December 2026" once a preset exists.
- The "Free presets" section of the terms.

## 1. Launch the pack

- The first pack: **Game day**, **Golden hour** and **Car meet**, uploaded
  through the studio from files the team supplies. No placeholder presets.
- Upload only on launch day: the preview studio shares storage with the live
  site, so an upload goes live at once.
- Update every "Coming December 2026" mention (presets page banner, cards,
  "On their way" heading and intro, the homepage, nav or footer text, `og:`
  tags and the README), keeping a fallback if `/presets.json` can't load.

## 2. Small polish

- The "Follow @hor1zonmedia" call to action and the page description read
  correctly once presets are live.
- Each preset shows when it was added ("Added December 2026") and the "New" tag
  for recent ones.
- Downloads work with no cookies, with a hint for when the browser opens the
  file instead of saving it.

## Legal and privacy checks

1. **Before/after photos:** only photos the team owns, no minor's face as the
   focus without permission, plates blurred, a photographer credit, and the
   "Request removal" route.
2. **Hidden data in preset files:** a `.dng` preset is a sample photo and can
   carry location, camera and owner details. Check each file before upload,
   and have the studio check for location data.
3. **Terms:** re-read "Free presets" against the real files, add that Adobe
   and Lightroom are Adobe's trademarks and Horizon Media isn't affiliated, and
   bump the date.
4. **Privacy:** downloads need no sign-up and no cookies. Any download counter
   is an aggregate count per preset only, listed on the privacy page first.
5. **Cookie question:** still appears and works on the presets page.

## Done when

- `npm test` passes, with tests for preset upload checks and file addresses.
- Browser checks on a computer and a phone: no presets, one, and all three,
  with the slider and both downloads.
- Each file installed in Lightroom if the team can, and the result noted.
