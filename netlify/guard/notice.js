// The notice bar set in the studio (stored by the studio as "notice" in its
// Netlify Blobs store): one short line shown at the top of every page, such as
// "Game moved to Saturday". Like the homepage photo, each server re-reads it in
// the background at most once a minute, so it costs almost nothing.
import { getStore } from "@netlify/blobs";

const REFRESH_MS = 60_000;
const FIRST_WAIT_MS = 300;
const CALL_TIMEOUT_MS = 1_500;
const fetchWithTimeout = (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(CALL_TIMEOUT_MS) });
// Days follow the same calendar as announcements.
const TIME_ZONE = "America/New_York";
const dayIn = (now) => new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now));
// A link to a page of this site, or an https address (the same rule as announcements).
// A recap page (recap.html?r=<its id>) counts as a page of this site too.
export const NOTICE_LINK = /^(https:\/\/[^\s<>"']{1,300}|[a-z0-9-]{1,40}\.html(#[a-z0-9-]{1,40})?|recap\.html\?r=[0-9a-f]{16})$/i;

export function createNoticeReader() {
  let notice = null;
  let readAt = -Infinity;
  let pending = null;

  function refresh(now) {
    if (!pending) {
      readAt = now;
      pending = getStore({ name: "studio-photos", fetch: fetchWithTimeout })
        .get("notice", { type: "json" })
        .then((value) => { notice = value && typeof value.text === "string" && value.text ? value : null; })
        .catch((error) => console.warn("notice: could not read it; keeping the last one", error?.message || error))
        .finally(() => { pending = null; });
    }
    return pending;
  }

  // The notice to show now, or null (none set, or past its last day).
  async function current(now) {
    if (readAt === -Infinity) await Promise.race([refresh(now), new Promise((resolve) => setTimeout(resolve, FIRST_WAIT_MS))]);
    else if (now - readAt >= REFRESH_MS) refresh(now);
    if (!notice) return null;
    if (notice.until && notice.until < dayIn(now)) return null;
    return notice;
  }

  return { current };
}

const escape = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Puts the notice bar at the very top of the page, just after "Skip to content".
export function useNotice(html, notice) {
  const link = notice.link && NOTICE_LINK.test(notice.link) ? ` <a href="${escape(notice.link)}">${escape(notice.linkText || "More")}</a>` : "";
  const bar = `<div class="notice-bar" role="region" aria-label="Notice" data-notice="${escape(notice.id || "")}"><p>${escape(notice.text)}${link}</p><button type="button" class="notice-close" aria-label="Close this notice">&times;</button></div>`;
  return /<a class="skip"[^>]*>[^<]*<\/a>/.test(html) ? html.replace(/(<a class="skip"[^>]*>[^<]*<\/a>)/, `$1${bar}`) : html.replace(/(<body[^>]*>)/i, `$1${bar}`);
}
