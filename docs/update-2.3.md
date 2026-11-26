# Update 2.3 plan

A small update on top of 2.2. This file is the working plan; it is removed
once 2.3 is built.

## 1. Request status

Photo requests and removal requests move through **New**, **Replied** and
**Done**, with a filter for each on the studio's Requests tab.

- **New:** just arrived. Removal requests stored as `open` count as New.
- **Replied:** the team has answered but isn't finished. The visitor's details
  are kept, as for New. It does not extend how long they are kept (see 2).
- **Done:** handled. Photo requests: the visitor's name, contact and message
  are deleted, and only a record is kept (photo, when, who handled it), like
  removal requests already do. Removal requests: Take down or Keep it up, as now.
- Roles from 2.2 still apply: Editors and above handle photo requests, Admins
  handle removal requests.
- The inbox limit (20 waiting) counts New and Replied only.

## 2. Old requests delete themselves

Already in 2.1 (90 days, run when the studio lists requests and when a new one
arrives). 2.3 changes:

- Replied requests expire too (90 days from when they arrived).
- An expired removal request keeps only its record, with the outcome
  "expired". Its name, contact and message are deleted.
- Each request in the studio shows "Expires in N days", in red for the last 7.
- The privacy page already states the 90-day limit; its date is bumped.

## 3. Recap polish

- **Copy link** on recap pages copies the recap's address and says "Link copied".
- **Share** for each recap photo: the photo viewer's existing Share button
  already works on recap photos, so it is kept and checked, not rebuilt.
  (A second button on each grid photo isn't possible: each photo is itself a
  button that opens the viewer.)
- No new visitor data and nothing loaded from other companies.

## Done when

- `npm test` passes, with tests for status changes, roles, the 90-day expiry
  (clock held still) and that expired requests lose their personal details.
- Browser checks of the Requests tab and a recap page, on a computer and a phone,
  including the cookie question on a recap page.
