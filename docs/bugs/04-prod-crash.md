# 04 · Prod-only crash: minified stack → source maps

Flag: `prod-crash` · Profile: prod (also crashes in dev, but there the overlay gives it away) · Fix branch: `fix/04-prod-crash`

## Symptom
Choosing an **84-month** term shows *"This step is temporarily unavailable"*. Sentry/console has:

```
TypeError: Cannot read properties of undefined (reading 'origination')
    at d (http://localhost:3102/_next/static/chunks/__federation_expose_OfferNode.80b1….js:1:4262)
    at ad (http://localhost:3100/_next/static/chunks/framework.e194….js:1:58779)
```

## Reproduce
`pnpm prod`, open `/apply/offer?bugs=prod-crash`, choose **84 months**.

## Investigation path
1. The frame is `d` at `1:4262` in a file served by **:3102**, so it's the offers remote's code, not the host's.
2. Remotes build with `devtool: 'hidden-source-map'`: the `.map` exists (for the error tracker) but the bundle doesn't reference it.
3. Sources → open the chunk → right-click → **Add source map…** → `http://localhost:3102/_next/static/chunks/__federation_expose_OfferNode.<hash>.js.map`. The frame now resolves to `components/OfferNode.tsx:94` → `quote.fees.origination`.
4. Network → `POST /api/graph/quotes` with `termMonths: 84` → response has **no `fees`**. Other terms do.

## Root cause
API contract drift: pricing v2 bundled fees into the APR for long terms and dropped the field. The remote's `Quote` type still says `fees` is required, and TypeScript can't see the wire.

## Fix
Make the field optional in the contract and handle it in the UI (`fees?.origination`, show "Included in APR"). Validate API responses at the boundary (zod/valibot) so drift fails in one obvious place.

## Takeaways
- Upload source maps to your error tracker; know how to attach them manually in DevTools.
- A minified frame still tells you **which deployable** crashed (the origin in the URL). In microfrontends, that's half the triage.
