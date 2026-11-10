// Site guard settings. Every number an owner might want to change is here.

// Busy mode: what visitors get as the page gets busier.
//   above: the visitor count that switches the mode on.
//   until: the count it must fall back to before the mode switches off again
//          (the gap stops the page flickering between modes).
// Each mode's smaller photos live in img/<name>/.
export const MODES = [
  { name: "off" },
  { name: "lite", above: 10, until: 8 },
  { name: "saver", above: 30, until: 24 },
];

// "At once" means: opened the page within the last two minutes.
export const WINDOW_MS = 2 * 60_000;

// Page loads allowed per minute from one address before it is refused.
// Keep rateLimit.windowLimit in netlify/edge-functions/guard.js the same.
export const RATE_LIMIT = 300;

// The anonymous cookie that stops someone who reloads being counted twice.
export const COOKIE = { name: "hm_visitor", maxAgeSeconds: 30 * 60 };

// Sent with the homepage. netlify.toml sends the same ones with every other
// file; tests/guard.test.mjs checks the two lists match.
export const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
};
