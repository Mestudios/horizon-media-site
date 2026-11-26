// The update plan shown to the team on the studio's Roadmap tab. Change it
// here with each release (it ships with the site): the release this file goes
// out in is "current", and the one after it "next". Dates are New York dates,
// written YYYY-MM-DD; "date" may also be a short phrase when a day isn't set.
// The full plan, with checklists, is GitHub issue #20.

export const ROADMAP_UPDATED = "2026-11-26";

export const ROADMAP = [
  {
    version: "2.0", date: "2026-11-18", when: "Nov 18", status: "live",
    title: "The studio dashboard, photo viewer and new policies",
    items: ["The studio became a dashboard with a side menu", "Watermarked photo viewer with Share, Request this photo and Request removal", "Homepage photo, notice bar, scheduled photos, presets page, new terms and privacy pages"],
  },
  {
    version: "2.1", date: "2026-12-01", when: "Mon Dec 1", status: "live",
    title: "A cleaner studio, recaps and removal requests",
    items: ["Tidier Announcements and Requests, with tabs", "Trash with 30-day restore", "Removal requests: Take down or Keep it up", "Reply templates and recap pages", "Announcement photos from the portfolio, with Crop & position", "A pin on pinned photos, and the cookie question for visitors", "Fixes from three outside reviews, and security improvements"],
  },
  {
    version: "2.2", date: "2026-12-10", when: "Wed Dec 10", status: "current",
    title: "Team roles",
    items: ["Contributor, Editor and Admin roles, set on a new Team tab", "Each role sees only the tools it can use", "A history of who changed what", "Block spam photo requests"],
  },
  {
    version: "2.3", date: "2026-12-20", when: "Sat Dec 20", status: "next",
    title: "The free presets go live",
    items: ["Game day, Golden hour and Car meet, with before/after sliders and downloads", "Team: send the preset files and their before/after photos by Dec 15"],
  },
  {
    version: "2.4", date: "2026-12-30", when: "Tue Dec 30 (suggested)", status: "planned",
    title: "Security update",
    items: ["A review and hardening pass across the site and the studio", "Team: you may be asked to update your studio password"],
  },
  {
    version: "2.5", date: "2027-01-05", when: "Early January", status: "planned",
    title: "The redesign",
    items: ["A new liquid glass look for every page and the studio, with the same fonts", "Everything keeps working the same way"],
  },
  {
    version: "2.6", date: "2027-01-10", when: "Sat Jan 10", status: "planned",
    title: "Request status",
    items: ["New, Replied and Done for photo and removal requests", "\"Expires in N days\" on each request", "Copy link on recap pages"],
  },
  {
    version: "2.7", date: "2027-01-20", when: "Tue Jan 20", status: "idea",
    title: "\"Message us\" form",
    items: ["A simple form for people without Instagram or email handy; messages arrive in the studio"],
  },
  {
    version: "2.8", date: "2027-01-30", when: "Fri Jan 30", status: "idea",
    title: "Backup download",
    items: ["Admins can download every studio photo and detail in one file"],
  },
  {
    version: "2.9", date: "2027-02-10", when: "Tue Feb 10", status: "idea",
    title: "Before/after slider for car edits",
    items: ["Compare the raw shot and the edit on the car page"],
  },
  {
    version: "3.0", date: "2027-02-15", when: "Sun Feb 15", status: "idea",
    title: "The next big release",
    items: ["To be decided by mid-January"],
  },
];

export const STATUS_LABELS = { live: "Live", current: "This update", next: "Next up", planned: "Planned", idea: "Idea" };
