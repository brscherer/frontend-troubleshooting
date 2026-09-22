/**
 * Demo-only bug switches. NOT part of the "real" app — this is how the
 * presenter turns intentional bugs on/off without rebuilding.
 *
 * Flags live in the `bugs` cookie (comma separated) so the host server,
 * the host client and every remote can read them independently.
 * Set them with `?bugs=singleton-split,hydration-path` on any host URL,
 * `?bugs=` to clear, or with the Bug Switcher panel (Ctrl+Shift+B).
 */
export const BUGS = {
  'singleton-split': 'Offers remote bundles its own copy of @acme/sdui-context',
  'hydration-path': 'Stepper walks the graph with answers the server never saw',
  'stale-remote-entry': 'remoteEntry.js served with long-lived cache headers (prod build)',
  'prod-crash': 'Minified crash in offers remote, only in production build',
  'graph-cycle': 'Eligibility decision loops back to income when income == threshold',
  'unknown-node': 'Graph returns a node type the registry does not know',
  'quote-race': 'Stale offer quote response overwrites the newer one',
  'two-reacts': 'Intake remote pulls a date-input build that inlines its own React',
  'listener-leak': 'Offers remote leaks resize listeners on every node visit',
  'css-leak': 'Offers remote global CSS overrides host styles',
} as const;

export type BugName = keyof typeof BUGS;

export const BUG_COOKIE = 'bugs';

export function parseBugs(raw: string | undefined | null): Set<BugName> {
  if (!raw) return new Set();
  return new Set(
    decodeURIComponent(raw)
      .split(',')
      .map((s) => s.trim())
      .filter((s): s is BugName => s in BUGS),
  );
}

export function readCookie(cookieHeader: string | undefined | null, name = BUG_COOKIE) {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.split(/;\s*/).find((c) => c.startsWith(`${name}=`));
  return match?.slice(name.length + 1);
}

/** Client-side check. Safe to call during render only in client-only components. */
export function isBugOn(name: BugName): boolean {
  if (typeof document === 'undefined') return false;
  return parseBugs(readCookie(document.cookie)).has(name);
}

/** Server-side check from an incoming request's Cookie header. */
export function bugsFromCookieHeader(cookieHeader: string | undefined): Set<BugName> {
  return parseBugs(readCookie(cookieHeader));
}

export function serializeBugs(bugs: Iterable<string>) {
  return [...bugs].filter((b) => b in BUGS).join(',');
}
