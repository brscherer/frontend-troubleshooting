/**
 * DEMO PLUMBING — not part of the "real" app.
 *
 * Module Federation runtime plugin that lets the presenter flip bugs that
 * live in *build configuration* (which can't be toggled at runtime):
 *
 *   singleton-split    -> load `offers` from the buggy build (:3112)
 *   two-reacts         -> load `intake` from the buggy build (:3111)
 *   stale-remote-entry -> pin the remoteEntry cache-buster to the host build id
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
        if (bugs.has('stale-remote-entry')) {
          // "Perf fix": a per-request cache-buster killed CDN caching, so pin it to the host deploy.
          url.searchParams.set('t', (window.__NEXT_DATA__ && window.__NEXT_DATA__.buildId) || 'dev');
        }
        remote.entry = url.toString();
      }
      return args;
    },
  };
};
