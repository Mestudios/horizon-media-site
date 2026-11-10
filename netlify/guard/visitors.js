// Counts the visitors who opened the page within the last WINDOW_MS.
//
// Netlify runs several instances of the guard and restarts them freely, so an
// instance keeps only a cache in memory. The shared truth is one tiny record
// per visit in a Netlify Blobs store, named "<slot>/<time>-<visitor id>",
// where a slot is one window long. Listing the current and the previous slot
// therefore returns everyone seen within the window.
import { getStore } from "@netlify/blobs";
import { MODES, WINDOW_MS } from "./settings.js";

const STORE = "site-guard";
const REFRESH_MS = 5_000; // re-read what other instances recorded at most this often
const REREGISTER_MS = 30_000; // re-record a visitor who reloads at most this often
const PAGE_WAIT_MS = 400; // never hold the page up longer than this for a count
const CALL_TIMEOUT_MS = 5_000; // give up on a single storage call after this
const CLEANUP_CHANCE = 0.05; // share of recordings that also delete out-of-date records
const RECORD_NAME = /^\d+\/(\d{13})-([0-9a-f]{16})$/;

// Past this count nothing changes, so recording slows to a trickle. This is
// what keeps a flood of visitors from becoming a flood of storage writes.
export const COUNT_CAP = MODES.at(-1).above + 1;

export const visitorLabel = (count) => (count >= COUNT_CAP ? `${COUNT_CAP}+` : String(count));

const slotOf = (time) => Math.floor(time / WINDOW_MS);

export function createVisitorCounter() {
  const seen = new Map(); // visitor id -> when they last opened the page
  let refreshedAt = 0; // when `seen` was last merged with the shared record
  let refreshing = null; // that merge, while it is in flight
  let waitUntil = 0; // requests arriving before this may wait for the merge
  let recordedAt = 0; // when this instance last wrote to the shared record
  let strongReads = true; // prefer up-to-the-second reads of the shared record
  let complainedAt = 0;

  // Records the visitor (when `id` is given) and returns how many are on the page.
  async function count(id, context, now) {
    const full = present(now) >= COUNT_CAP;
    const last = id === null ? undefined : seen.get(id);
    const due = id !== null && (last === undefined || now - last >= REREGISTER_MS);
    // When full, record only as fast as old records expire, so the count
    // holds steady instead of collapsing every two minutes.
    const record = due && (!full || now - recordedAt >= WINDOW_MS / COUNT_CAP);

    const work = [];
    if (record) {
      seen.set(id, now);
      recordedAt = now;
      work.push(withStore((store) => store.set(`${slotOf(now)}/${now}-${id}`, "1")));
      if (Math.random() < CLEANUP_CHANCE) work.push(removeOldRecords(now));
    }
    if (!full && refreshing === null && now - refreshedAt >= REFRESH_MS) {
      refreshedAt = now;
      waitUntil = now + PAGE_WAIT_MS;
      refreshing = mergeSharedRecord().finally(() => {
        refreshing = null;
      });
      work.push(refreshing);
    }
    if (work.length > 0) {
      const done = Promise.allSettled(work).then(reportFailures);
      if (typeof context.waitUntil === "function") context.waitUntil(done);
    }
    // Wait for other instances' numbers, but only briefly: the page matters
    // more. If storage is slow or down, later requests do not wait at all.
    if (refreshing !== null && now < waitUntil) await settledWithin(refreshing, waitUntil - now);

    return present(now);
  }

  // Forgets visitors who left more than a window ago; returns how many remain.
  function present(now) {
    for (const [id, at] of seen) {
      if (now - at >= WINDOW_MS) seen.delete(id);
    }
    return seen.size;
  }

  async function mergeSharedRecord() {
    const slot = slotOf(Date.now());
    const lists = await withStore((store) =>
      Promise.all([store.list({ prefix: `${slot}/` }), store.list({ prefix: `${slot - 1}/` })]),
    );
    for (const { blobs } of lists) {
      for (const { key } of blobs) {
        const match = RECORD_NAME.exec(key);
        if (match === null) continue;
        const at = Number(match[1]);
        if (at > (seen.get(match[2]) ?? 0)) seen.set(match[2], at);
      }
    }
  }

  async function removeOldRecords(now) {
    const oldestNeeded = slotOf(now) - 1;
    await withStore(async (store) => {
      const { blobs } = await store.list();
      const old = blobs.filter(({ key }) => !(Number(key.split("/")[0]) >= oldestNeeded)).slice(0, 200);
      await Promise.all(old.map(({ key }) => store.delete(key)));
    });
  }

  // Reads that are current to the second need "strong" consistency. Where that
  // is not available, fall back to the default (up to a minute behind).
  async function withStore(use) {
    if (strongReads) {
      try {
        return await use(getStore({ name: STORE, consistency: "strong", fetch: fetchWithTimeout }));
      } catch (error) {
        if (error?.name !== "BlobsConsistencyError") throw error;
        strongReads = false;
      }
    }
    return use(getStore({ name: STORE, fetch: fetchWithTimeout }));
  }

  function reportFailures(results) {
    const failed = results.find((result) => result.status === "rejected");
    if (failed && Date.now() - complainedAt >= 60_000) {
      complainedAt = Date.now();
      console.error("guard: shared visitor record unavailable; counting on this instance only", failed.reason);
    }
  }

  return { count };
}

// A storage call that never answers would otherwise never finish.
function fetchWithTimeout(input, init) {
  return fetch(input, { ...init, signal: AbortSignal.timeout(CALL_TIMEOUT_MS) });
}

function settledWithin(promise, ms) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(resolve, ms);
  });
  return Promise.race([promise.catch(() => {}), timeout]).finally(() => clearTimeout(timer));
}

// The busiest mode whose threshold the count is over. A mode that is already
// on only switches off once the count falls to its `until`.
export function pickMode(visitors, current) {
  let next = 0;
  for (let i = 1; i < MODES.length; i++) {
    const threshold = i <= current ? MODES[i].until : MODES[i].above;
    if (visitors > threshold) next = i;
  }
  return next;
}
