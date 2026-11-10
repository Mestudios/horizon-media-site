// Runs the site guard in front of the pages that show photos. The guard itself is in
// ../guard/ (start with guard.js there; the numbers are in settings.js).
import { createGuard } from "../guard/guard.js";

export default createGuard();

export const config = {
  path: ["/", "/index.html", "/portfolio", "/portfolio.html"],
  method: "GET",
  // If the guard fails, Netlify serves the page without it.
  onError: "bypass",
  // Netlify's own rate limit for the page: 300 loads a minute per address.
  // The guard has a backup of its own; keep RATE_LIMIT in ../guard/settings.js the same.
  rateLimit: { windowLimit: 300, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
