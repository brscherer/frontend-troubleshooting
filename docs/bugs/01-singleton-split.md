# 01 · Singleton split: the offer ignores the customer's locale

> **Hero bug of the talk.** Flag: `singleton-split` · Profile: dev or prod · Fix branch: `fix/01-singleton-split`

## Symptom (the ticket)

> "German customer Ana sees her loan offer in **dollars**, APR written as `6.9%`, and the page greets her as **'Hi, Guest'**. Header says 'Ana'. Compliance escalated: offers must be in the customer's currency."

- Header (host) correct: `Ana`.
- Intake steps correct: hints show `30.000,00 €`.
- Offer step wrong: `$25,000.00`, `6.9%`, `Hi, Guest`. The requested amount is ignored too (default 25,000).
- **No error anywhere.** The console only has third-party noise.

## Reproduce

```bash
pnpm dev
open "http://localhost:3100/apply/offer?bugs=singleton-split"
```

## Investigation path

1. **Shrink the blast radius.** Host header correct, intake correct, only the `offers` remote is wrong. So it isn't the data or the host. Suspect the boundary between host and `offers`.
2. **Console.** Filter the noise out (`-acme-analytics -HelpChat`, or hide `info`/`verbose`). Nothing's left. It's a silent failure, and that's a clue in itself: something is falling back to **defaults**.
3. **React DevTools → Components.** Select `OfferNode`. Its `Context` hook reads `{ locale: 'en-US', currency: 'USD', user: null }`, which is the context's **default value**. Walk up the tree: there *is* a `SduiContext.Provider` above it with `de-DE / EUR / Ana`.
   *A Provider above you while you read the default means you're subscribed to a different Context object.*
4. **Prove there are two copies.**
   - Sources → global search (⌥⌘F / Ctrl+Shift+F) `SduiContext.displayName`: two hits in two bundles (the host's shared chunk **and** `__federation_expose_OfferNode.js` from the offers origin).
   - Network → `remoteEntry.js` of `intake` vs `offers`: search `@acme/sdui-context`. Intake declares it as shared. Offers doesn't mention it.
   - Console: `__FEDERATION__.__SHARE__['host:1.0.0'].default['@acme/sdui-context']` has a single entry, registered by `host`. Nobody else asked for it.
5. **Read the config.** `apps/offers/next.config.js`: the `shared` map doesn't list `@acme/sdui-context`, so webpack bundles a private copy into the remote.

## Root cause

React Context identity is **object identity**. `createContext()` ran twice, once in the host's copy of `@acme/sdui-context` and once in the copy bundled into `offers`. The Provider and the consumer use different objects, so `useContext` quietly returns the default value.

Module Federation only dedupes modules that **every** participant lists in `shared`. "PR #412 moved offers to the new context package" updated the import but not the federation config.

## Fix

```diff
 shared: {
-  // nothing: the package gets bundled
+  '@acme/sdui-context': { singleton: true, requiredVersion: '^2.0.0', strictVersion: true },
 },
```

On the fix branch, the context package also **fails loudly** next time:

- It warns when a second copy of the module is evaluated (`Multiple copies of @acme/sdui-context`).
- It warns when `useSdui()` runs without a Provider above it, instead of silently returning defaults.

## Takeaways

- Defaults hide bugs. A context default that "renders fine in Storybook" turns a wiring error into believable wrong data.
- MF `shared` is a contract, and every remote has to sign it. Add `strictVersion` and fail at load time rather than render time.
- React DevTools shows *which* value a hook got. Comparing it with the nearest Provider is a 10-second check.

## Why `singleton: true` alone wouldn't catch version drift

With `singleton: true` and a mismatched `requiredVersion`, MF keeps **one** copy and only logs an `Unsatisfied version` warning, which gets buried in noise like this app's. `strictVersion: true` turns that into a load error.
