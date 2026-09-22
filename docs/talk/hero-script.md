# Speaker script: "The offer that forgot who you are" (8 min)

One bug, done properly: **01 · singleton split** ([write-up](../bugs/01-singleton-split.md)).
Audience: senior engineers. The through-line is **shrink the blast radius → trust evidence over hunches → make silent failures loud.**

---

## Pre-flight (T–30 min)

```bash
pnpm install
pnpm dev                       # host :3100, intake :3101/:3111, offers :3102/:3112, graph :4000
pnpm smoke                     # every bug: ✔ off healthy, ✔ on reproduces
```

- [ ] Chrome **guest profile** with the React DevTools extension only (no personal extensions, no ad blocker, so the HelpChat noise stays visible).
- [ ] Zoom 150 %, DevTools docked **bottom**, font size bumped (Settings → Appearance).
- [ ] Walk the flow once as Ana (Welcome → About you → Employment: Employed → Income 45000) so the draft exists, then open `http://localhost:3100/apply/offer?bugs=singleton-split`. The query param sets the cookie and disappears from the URL.
- [ ] Console: clear, **no** filter yet (the noise is part of the story). Preserve log **off**.
- [ ] Tab 2: `docs/bugs/01-singleton-split.md` diff or `git diff demo-start demo-fixed -- apps/offers/next.config.js packages/sdui-context` ready in the editor.
- [ ] Backup: screen recording of this exact run (`docs/talk/backup.mp4`, record it yourself during rehearsal).
- [ ] Bug switcher is **Ctrl+Shift+B** if you need to flip anything live.

---

## 0:00 – 0:45 · The ticket

> "Friday, 4 pm. Compliance escalates a ticket: a German customer, Ana, got her loan offer **in dollars**. It says *'Hi, Guest'*. It's a regulated product: the offer has to be in the customer's currency. No errors in Sentry. Nothing in the logs."

**Show:** the offer page. Point at three things: header says **Ana**, card says **Hi, Guest**, **$25,000.00 / 6.9%**.

> "Before I open anything, one question: *where* can this bug live?"

## 0:45 – 1:40 · Shrink the blast radius

**Show:** the step bar and footer (`graph loan@… · node offer`). Click back to **Income**: the hint says `30.000,00 €`.

> "The host knows it's Ana. The intake remote formats euros correctly. Only the **offers** remote is wrong. So it's not the data and not the host. It's at the boundary between host and offers. That rules out about 80 % of the codebase in 30 seconds without reading any code."

Go forward to the offer again.

## 1:40 – 2:30 · The console lies by omission

**Open Console.** It's noisy: analytics, HelpChat deprecation warnings, a blocked pixel.

> "Real consoles look like this. Let's remove what we don't own."

Type into the filter: `-acme-analytics -HelpChat -helpchat`.

> "Empty. No error, no warning. Hold on to that: a correct-looking UI with wrong values and no error usually means something fell back to a **default**."

## 2:30 – 4:00 · React DevTools: who gave you that value?

**Components tab** → inspect the *"Hi, Guest"* text (select-element tool) → lands on `OfferNode`.

In the right pane, **hooks → Context**:
`{ locale: "en-US", currency: "USD", user: null, … }`

> "These are the context's **default values**, the ones we wrote so components render in Storybook. So either there's no Provider…"

Walk **up** the tree: `SduiProvider` → `SduiContext.Provider` with `de-DE`, `EUR`, `Ana`.

> "…but there *is* a Provider, right above it, with the correct value. When a consumer reads the default with a Provider above it, there's only one explanation: **the consumer is subscribed to a different Context object.** Context identity is object identity. So: are there two copies of the context module?"

## 4:00 – 5:30 · Prove it (three independent pieces of evidence)

1. **Sources → search all files** (⌥⌘F): `SduiContext.displayName`
   → two hits in **two bundles**: the host's shared chunk and `__federation_expose_OfferNode.js` from the offers origin.
   > "`createContext` ran twice."

2. **Network** → filter `remoteEntry` → open intake's, ⌘F `@acme/sdui-context`: it's declared as shared. Open offers', same search: **not there**.
   > "Intake signed the sharing contract. Offers never did."

3. **Console:**
   ```js
   __FEDERATION__.__SHARE__['host:1.0.0'].default['@acme/sdui-context']
   ```
   → one version, `from: "host"`. Nobody else registered or asked for it.

> "Three tools, one story. Now, and only now, do we open the code."

## 5:30 – 6:50 · Root cause and fix

**Editor:** `apps/offers/next.config.js`: `shared` doesn't list `@acme/sdui-context`. There's a comment about PR #412, which moved offers to the new package and updated the import but not the federation config.

> "Module Federation only dedupes what *every* participant lists in `shared`. Offers bundled a private copy, its own `createContext`, and read defaults forever. Nothing crashed, because the defaults are *valid*."

**Show the fix diff** (`git diff demo-start demo-fixed`):
- `shared: { '@acme/sdui-context': { singleton: true, requiredVersion: '^2.0.0', strictVersion: true } }`
- The package now **fails loudly**: warns when a second copy loads, and when `useSdui()` has no Provider.

**Show fixed:** Ctrl+Shift+B → untick `singleton-split` (reloads onto the correctly shared build) → **18.000,00 € · Hi, Ana**.

> "The config line is the fix. The loud warnings are the part that stops this from coming back."

## 6:50 – 8:00 · Takeaways

1. **Shrink the blast radius first.** Which deployable, which boundary? In microfrontends that question is half the investigation.
2. **Silence is a signal.** Wrong data with no error means a default or a fallback is involved. Defaults that "render fine" hide wiring bugs, so make contracts fail loudly (`strictVersion`, provider guards).
3. **Ask the tools who produced the value.** React DevTools for *which* value a hook got, the MF share scope for *which* copy exists, and Network for *what* was actually shipped.

> "The repo has nine more bugs like this: hydration, stale remote entries, minified prod crashes, races, leaks. Each has a write-up and a fix branch. Link on the slide."

---

## If something goes wrong on stage

| Problem | Recovery |
|---|---|
| Offer stuck on the grey skeleton | Browser tab not focused/visible (React defers work in hidden tabs); click into the page. Else reload. |
| Offer shows € (bug not active) | `Ctrl+Shift+B` → tick `singleton-split`. |
| `:3112` not running | `pnpm --filter @acme/offers dev:buggy` |
| Anything else | Switch to the backup video at the matching timestamp; keep narrating. |
