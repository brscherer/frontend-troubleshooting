# 03 · Stale remoteEntry: "I deployed, but nobody sees it"

Flag: `stale-remote-entry` · Profile: **prod only** · Fix branch: `fix/03-stale-remote-entry`

## Symptom
The offers team deploys a new release. Their own tab on `:3102` shows it. Users of the host keep getting the old UI, or, once old chunks are cleaned up from the CDN, `ChunkLoadError: Loading chunk … failed` and a blank offer step.

## Reproduce
```bash
pnpm prod                     # build + start everything
open "http://localhost:3100/apply/offer?bugs=stale-remote-entry"   # note "offers release dev" in the card
pnpm redeploy:offers          # new release, new chunk hashes
# reload the host tab → still the old release
```

## Investigation path
1. Network → filter `remoteEntry`. The URL is `remoteEntry.js?t=<host build id>`. It never changes between reloads, and the response shows `(disk cache)` / `(memory cache)`.
2. Response headers: `Cache-Control: public, max-age=31536000, immutable`. Next serves everything under `/_next/static` like that because it assumes **hashed filenames**. `remoteEntry.js` isn't hashed.
3. `apps/host/mf/bug-variant-plugin.js`: a "perf fix" pinned the cache-buster to the *host* build id, so the URL only changes when the **host** deploys, not when the remote does.
4. Confirm: DevTools → Network → **Disable cache**, reload. The new release appears.

## Root cause
Unhashed entry file + immutable caching + a cache key tied to the wrong deploy. In microfrontends, every app deploys independently, so a cache key must come from the **remote's** version.

## Fix
- Short term: bust per request (nextjs-mf's default `?t=Date.now()`), i.e. revert the pin.
- Better: serve `remoteEntry.js` / `mf-manifest.json` with `Cache-Control: no-cache` (ETag revalidation) from a proxy/CDN rule, and keep chunks immutable.
- Best: a version manifest the host fetches (`no-cache`) that points at a **hashed** remote entry.

## Takeaways
- "Works for me" + "deploy succeeded" + "users see old code" → look at caching before looking at code.
- Always check the *Size* column in Network: `(disk cache)` means the server never saw that request.
