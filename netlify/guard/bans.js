// Addresses kicked off the site for flooding it. One list, kept in Netlify
// Blobs so every server and both edge functions (the guard and the studio)
// share it. Each server reads it at most once a minute, so checking costs
// almost nothing; it is only written when someone is banned.
//
// Addresses are stored scrambled (a hash), never as they are, and an IPv6
// address is banned with its whole /64 network, as the rate limit counts it.
import { getStore } from "@netlify/blobs";
import { network } from "./requests.js";
import { BAN_MINUTES } from "./settings.js";

const STORE = "site-bans";
// Each ban is its own entry, named ban/<scrambled address>/<banned until>, so
// adding one never rewrites the others: a failed read can't wipe the list, and
// two servers banning at the same moment can't overwrite each other. Reading
// the list is one "list" call, with no file to open.
const PREFIX = "ban/";
const MAX_BANS = 2_000;
const CLEANUP_PER_READ = 50; // expired entries deleted per read, at most
const REFRESH_MS = 60_000;
// A slow store must never hold up a page: give up on a call after this long.
const CALL_TIMEOUT_MS = 1_500;
const FIRST_WAIT_MS = 300;
const fetchWithTimeout = (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(CALL_TIMEOUT_MS) });

const encoder = new TextEncoder();
async function scramble(ip) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`ban:${network(ip)}`));
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function createBanList() {
  let bans = {}; // scrambled address -> banned until (ms)
  let readAt = -Infinity;
  let strong = true;
  // Up-to-the-second reads where Netlify offers them, the default ones otherwise.
  async function withStore(use) {
    if (strong) {
      try {
        return await use(getStore({ name: STORE, consistency: "strong", fetch: fetchWithTimeout }));
      } catch (error) {
        if (error?.name !== "BlobsConsistencyError") throw error;
        strong = false;
      }
    }
    return use(getStore({ name: STORE, fetch: fetchWithTimeout }));
  }

  let pending = null; // a read in progress

  function refresh(now) {
    if (!pending) {
      readAt = now;
      pending = withStore(async (store) => {
        const { blobs } = await store.list({ prefix: PREFIX });
        const next = {};
        const expired = [];
        for (const { key } of blobs) {
          const [, who, until] = key.split("/");
          const end = Number(until);
          if (!who || !Number.isFinite(end)) continue;
          if (end <= now) expired.push(key);
          else next[who] = Math.max(next[who] || 0, end);
        }
        bans = next;
        // Tidy up: expired entries are deleted a few at a time.
        await Promise.all(expired.slice(0, CLEANUP_PER_READ).map((key) => store.delete(key)));
      })
        // A warning, not an error: the site carries on with the last list it had.
        .catch((error) => console.warn("bans: could not read the list; using the last one", error?.message || error))
        .finally(() => { pending = null; });
    }
    return pending;
  }

  // Whether this address is banned right now. Never throws, and never holds a
  // page up: the list is re-read in the background once a minute, and only a
  // server's very first check waits for it, briefly.
  async function isBanned(ip, now) {
    if (!ip) return false;
    try {
      if (readAt === -Infinity) await Promise.race([refresh(now), new Promise((resolve) => setTimeout(resolve, FIRST_WAIT_MS))]);
      else if (now - readAt >= REFRESH_MS) refresh(now);
      const until = bans[await scramble(ip)];
      return until !== undefined && until > now;
    } catch {
      return false;
    }
  }

  // Waits for a read in progress (for tests).
  const settled = () => pending || Promise.resolve();

  // Bans the address for BAN_MINUTES, on every server within a minute (at once on this one).
  async function ban(ip, now, why) {
    if (!ip) return;
    try {
      const who = await scramble(ip);
      const until = now + BAN_MINUTES * 60_000;
      // Banned on this server at once, whatever happens to the save.
      bans = { ...bans, [who]: until };
      if (Object.keys(bans).length > MAX_BANS) return console.warn("bans: the list is full; this ban holds on this server only");
      await withStore((store) => store.set(`${PREFIX}${who}/${until}`, ""));
      console.warn(`bans: ${ip} banned for ${BAN_MINUTES} minutes (${why})`);
    } catch (error) {
      console.error("bans: could not save a ban; it holds on this server only", error);
    }
  }

  return { isBanned, ban, settled };
}
