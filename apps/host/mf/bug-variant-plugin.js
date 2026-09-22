/**
 * DEMO PLUMBING — not part of the "real" app.
 *
 * Module Federation runtime plugin that lets the presenter flip bugs that
 * live in *build configuration* (which can't be toggled at runtime):
 *
 *   singleton-split    -> load `offers` from the buggy build (:3112)
 *   two-reacts         -> load `intake` from the buggy build (:3111)
 *
 * Runs after nextjs-mf's own plugin, which appends `?t=<Date.now()>`.
 */
const BUGGY_PORT = { offers: '3112', intake: '3111' };
const BUGGY_FLAG = { offers: 'singleton-split', intake: 'two-reacts' };

function readBugs() {
  const raw = document.cookie.split(/;\s*/).find((c) => c.startsWith('bugs='));
  return new Set(raw ? decodeURIComponent(raw.slice(5)).split(',') : []);
}

module.exports = function bugVariantPlugin() {
  return {
    name: 'acme-bug-variants',
    beforeRequest(args) {
      if (typeof window === 'undefined') return args;
      const bugs = readBugs();
      for (const remote of args.options.remotes) {
        if (!('entry' in remote) || !remote.entry) continue;
        const url = new URL(remote.entry);
        if (bugs.has(BUGGY_FLAG[remote.name])) url.port = BUGGY_PORT[remote.name];
        // remoteEntry.js is NOT content-hashed but Next serves /_next/static as immutable.
        // Keep nextjs-mf's per-request `?t=` so a remote deploy is picked up on the next load;
        // never key it on the *host* build (remotes deploy independently).
        remote.entry = url.toString();
      }
      return args;
    },
  };
};
