# 09 · Memory leak: every visit to the offer adds a listener

Flag: `listener-leak` · Profile: dev or prod · Fix branch: `fix/09-listener-leak`

## Symptom
After going back and forth between Offer and Review a few times, the tab gets sluggish on resize and memory keeps climbing (each offer visit keeps ~50k-item quote history arrays alive).

## Reproduce
`?bugs=listener-leak`, go Offer → Accept → Back → Accept → Back … (5×).

## Investigation path
1. Console: `getEventListeners(window).resize.length` (DevTools-only API) goes 1 → 2 → 3 … with each visit.
2. Memory → **Heap snapshot**, visit 3×, snapshot again → **Comparison** view: growing `Array` count. Retainers point at a closure `onResize` → `history` → `quoteHistory` ref of an **unmounted** `OfferNode`.
3. Performance monitor (⌘⇧P → "Show Performance monitor"): *JS event listeners* keeps climbing.
4. `OfferNode.tsx`: the resize effect returns early and never removes the listener.

## Root cause
An effect subscribes without cleanup. The closure retains the component's refs after unmount, so every navigation leaks one instance's data.

## Fix
Always return the cleanup: `return () => window.removeEventListener('resize', onResize)`.

## Takeaways
- Heap snapshot **comparison** + **retainers** is the way to answer "why is this still alive?"
- In SPAs with node-based navigation, components mount/unmount constantly, so leaks compound fast.
