# 08 · Two Reacts: `Cannot read properties of null (reading 'useId')`

Flag: `two-reacts` · Profile: dev or prod · Fix branch: `fix/08-two-reacts`

## Symptom
The first step ("About you") shows *"This step is temporarily unavailable"*. Console:

```
TypeError: Cannot read properties of null (reading 'useId')
    at Re (webpack-internal:///../../packages/date-input/dist/standalone.js:…)
```

Not the familiar "Invalid hook call" warning: that one only exists in **development** builds of React, and the copy throwing here is a production build.

## Reproduce
`?bugs=two-reacts`, open `/apply/applicant`.

## Investigation path
1. The failing frame is in `@acme/date-input/dist/standalone.js`, not in our code.
2. `null.useId` means React's hook dispatcher is `null`, so this component runs under a React that **isn't rendering it**. That's the two-Reacts signature.
3. Sources → search `react.production` / `__SECRET_INTERNALS`: an extra React inside `standalone.js` (9 kb "date input").
4. `packages/date-input/package.json`: `./standalone` is the build for partner sites, with React **inlined**. The regular build treats React as a peer.
5. `apps/intake/next.config.js`: a "bundle size fix" aliased the package to `/standalone`.

## Root cause
A dependency brought its own React. Hooks from copy B were called while copy A (host's react-dom) was rendering. In MF setups this also happens when `react` isn't shared or a remote pins a different major.

## Fix
Remove the alias, which puts the peer-dependency build back. Guard in CI with `pnpm why react` / a bundle check (one `react` per graph), and keep React `singleton` in MF `shared`.

## Takeaways
- `null` dispatcher = duplicate React. Look for the second copy, not for a bug in the hook.
- "Standalone"/UMD builds of UI libraries are the usual suspects.
