# Update 2.2 plan

A small update on top of 2.1. This file is the working plan; it is removed
once 2.2 is built.

## 1. Team roles

Each studio sign-in gets a role, set by an Admin on a new **Team** tab in the
studio. Changes take effect right away, with no redeploy.

| Role | Can do |
|---|---|
| Contributor | Add photos, and edit or remove their own. Set their own photo credit. |
| Editor | Everything a Contributor can, plus edit any photo, handle photo requests and reply templates, and post announcements and recaps. |
| Admin | Everything an Editor can, plus removal requests (Take down), Delete for good in the Trash, the homepage photo, the notice bar, presets, and setting roles. |

- New sign-ins start as Contributor. The first account is always Admin, so the team can never be locked out.
- Tools a role can't use are hidden, and the server refuses them too.
- The studio keeps a simple history of who did what.

## 2. Blocking unwanted requests

- A **Block** button on photo requests and removal requests.
- A list of blocked senders in the studio, with **Unblock**.
- Blocked senders get the same reply as everyone else, and nothing is saved.

## Still to decide

- Are the three roles and their powers right?
- Who is Admin besides the first account?

## Done when

- `npm test` passes, with tests for every role and for blocking.
- The studio browser checks pass, on a computer and a phone.
- README and privacy page updated where anything changes for visitors.
