// Runs the site guard in front of every page: busy mode on the pages that show
// photos, and the rate limit and bans on all of them. The guard itself is in
// ../guard/ (start with guard.js there; the numbers are in settings.js).
import { createGuard } from "../guard/guard.js";

export default createGuard();

export const config = {
  path: ["/", "/index.html", "/portfolio", "/portfolio.html", "/cars", "/cars.html", "/book", "/book.html", "/presets", "/presets.html", "/recap", "/recap.html", "/privacy", "/privacy.html", "/terms", "/terms.html",
    // Honeypot addresses (TRAPS and TRAP_FOLDERS in ../guard/settings.js).
    "/wp-login.php", "/wp-admin", "/wp-admin/*", "/xmlrpc.php", "/.env", "/.git/config", "/phpmyadmin", "/phpmyadmin/*", "/administrator"],
  method: "GET",
  // If the guard fails, Netlify serves the page without it.
  onError: "bypass",
  // Netlify's own rate limit for the page: 300 loads a minute per address.
  // The guard has a backup of its own; keep RATE_LIMIT in ../guard/settings.js the same.
  rateLimit: { windowLimit: 300, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
