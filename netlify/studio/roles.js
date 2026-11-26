// Team roles (Update 2.2). Every studio sign-in has one:
//
//   contributor  adds photos, and edits or removes its own
//   editor       also any photo, pins, photo requests, reply templates,
//                announcements and recaps
//   admin        everything: also removal requests, the Trash's "Delete for
//                good", the homepage photo, the notice bar, presets and roles
//
// The first sign-in (STUDIO_USERNAME) is always an admin, so the team can
// never lock itself out. Every other sign-in is a contributor until an admin
// changes it on the studio's Team tab (stored as "roles" in Netlify Blobs).
// The server checks every request against this table; the studio page only
// hides what a role can't use.

export const ROLES = ["contributor", "editor", "admin"];
const RANK = { contributor: 0, editor: 1, admin: 2 };

// The lowest role each studio address needs. An address missing here is
// refused for everyone, so a new tool is admin-only until it is listed.
export const NEEDS = {
  // Contributors
  "/studio/photos.json": "contributor",
  "/studio/stats.json": "contributor",
  "/studio/upload": "contributor",
  "/studio/edit-photo": "contributor", // their own photos only (see ownsPhoto)
  "/studio/delete": "contributor", // their own photos only
  "/studio/profile": "contributor",
  // Editors
  "/studio/trash.json": "editor",
  "/studio/trash-photo": "editor",
  "/studio/restore": "editor",
  "/studio/pins": "editor",
  "/studio/hide": "editor",
  "/studio/unhide": "editor",
  "/studio/requests.json": "editor",
  "/studio/request-done": "editor",
  "/studio/templates.json": "editor",
  "/studio/templates": "editor",
  "/studio/announcements.json": "editor",
  "/studio/announce": "editor",
  "/studio/announce-delete": "editor",
  "/studio/recaps.json": "editor",
  "/studio/recap": "editor",
  "/studio/recap-delete": "editor",
  "/studio/blocked.json": "editor",
  "/studio/block": "editor", // photo requests only; removal requests are never blocked
  // Admins
  "/studio/removals.json": "admin",
  "/studio/removal-takedown": "admin",
  "/studio/removal-keep": "admin",
  "/studio/unblock": "admin",
  "/studio/trash-delete": "admin",
  "/studio/hero": "admin",
  "/studio/notice": "admin",
  "/studio/preset": "admin",
  "/studio/preset-delete": "admin",
  "/studio/team.json": "admin",
  "/studio/roles": "admin",
  "/studio/log.json": "admin",
};

export const atLeast = (role, need) => RANK[role] !== undefined && RANK[role] >= RANK[need];
export const can = (role, path) => NEEDS[path] !== undefined && atLeast(role, NEEDS[path]);

// A sign-in's role: number 1 is always admin; others as saved, else contributor.
export function roleOf(n, saved) {
  if (n === 1) return "admin";
  const role = saved && saved[String(n)];
  return ROLES.includes(role) ? role : "contributor";
}

// Contributors may only change their own photos; editors and admins any.
export const ownsPhoto = (me, photo) => me.role !== "contributor" || photo.by === me.username;

// Shown when a role is refused.
export const NOT_ALLOWED = { error: "Your role can't do that. Ask an Admin on the Team tab." };
