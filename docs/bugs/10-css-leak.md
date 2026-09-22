# 10 · CSS leakage: the host turns red after visiting the offer

Flag: `css-leak` · Profile: dev or prod · Fix branch: `fix/10-css-leak`

## Symptom
After a user visits **Your offer** and goes back, the host's buttons become red and UPPERCASE and headings switch to a serif font. On a fresh reload of the same page, everything looks fine. Load-order dependent, so it's "flaky" in screenshots and visual tests.

## Reproduce
`?bugs=css-leak`, go Income → Check eligibility (offer) → browser Back.

## Investigation path
1. Elements → select the red button → **Styles**: `.ds-card button { background: #e11d48 }` wins over `.ds-button` (higher specificity), from a `<style id="offers-legacy-css">` element.
2. Right-click the rule's source → it's an inline `<style>` in `<head>`. Search Sources for `offers-legacy-css`: `apps/offers/components/legacyStyles.ts`.
3. The remote appends global CSS at runtime (the widget used to be embedded on partner sites) and never removes it. After the first offer visit it applies to the whole host.
4. Check with **Rendering → CSS overview** or toggle the `<style>` node off in Elements to confirm.

## Root cause
Global, unscoped CSS injected by a remote into a shared document. Remotes share one cascade with the host, so there's no isolation unless you build it (CSS Modules, a prefix, `@layer`, or Shadow DOM).

## Fix
Delete the legacy injection (the offers UI already uses the design system). If a remote needs its own CSS, scope it (CSS Modules / a root class) and put design-system rules in an `@layer` with predictable precedence.

## Takeaways
- For "styles depend on where I came from", look for runtime-injected `<style>` tags.
- The Styles pane shows exactly which rule won and why (specificity, order). Read it before touching CSS.
