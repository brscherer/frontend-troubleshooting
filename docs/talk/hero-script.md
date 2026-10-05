# Speaker script: "The offer that forgot who you are" (10 min)

One bug done properly (**01 · singleton split**, ~6:30) plus a 90-second lightning bug
(**05 · graph cycle**). Both run in the same `pnpm dev` profile, so nothing restarts on stage.
Write-ups: [01](../bugs/01-singleton-split.md) · [05](../bugs/05-graph-cycle.md).
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
- [ ] Open `http://localhost:3100/apply/offer?seed=ana&bugs=singleton-split`. `seed` fills the application draft, `bugs` sets the flags, and both disappear from the URL on load. Other stages: [recording.md](recording.md).
- [ ] Console: clear, **no** filter yet (the noise is part of the story). Preserve log **off**.
- [ ] Tab 2: `docs/bugs/01-singleton-split.md` diff or `git diff demo-start demo-fixed -- apps/offers/next.config.js packages/sdui-context` ready in the editor.
- [ ] Backup: screen recording of this exact run (`docs/talk/backup.mp4`, see [recording.md](recording.md)).
- [ ] Bug switcher is **Ctrl+Shift+B** if you need to flip anything live.

---

## 0:00 – 0:40 · The ticket

> "Friday, 4 pm. Compliance escalates a ticket: a German customer, Ana, got her loan offer **in dollars**. It says *'Hi, Guest'*. It's a regulated product: the offer has to be in the customer's currency. No errors in Sentry. Nothing in the logs."

**Show:** the offer page. Point at three things: header says **Ana**, card says **Hi, Guest**, **$25,000.00 / 6.9%**.

> "Before I open anything, one question: *where* can this bug live?"

## 0:40 – 1:30 · Shrink the blast radius

**Show:** the step bar and footer (`graph loan@… · node offer`). Click back to **Income**: the hint says `30.000,00 €`.

> "The host knows it's Ana. The intake remote formats euros correctly. Only the **offers** remote is wrong. So it's not the data and not the host. It's at the boundary between host and offers. That rules out about 80 % of the codebase in 30 seconds without reading any code."

Go forward to the offer again.

## 1:30 – 2:15 · The console lies by omission

**Open Console.** It's noisy: analytics, HelpChat deprecation warnings, a blocked pixel.

> "Real consoles look like this. Let's remove what we don't own."

Type into the filter: `-acme-analytics -HelpChat -helpchat`.

> "Empty. No error, no warning. Hold on to that: a correct-looking UI with wrong values and no error usually means something fell back to a **default**."

## 2:15 – 3:45 · React DevTools: who gave you that value?

**Components tab** → inspect the *"Hi, Guest"* text (select-element tool) → lands on `OfferNode`.

In the right pane, **hooks → Context**:
`{ locale: "en-US", currency: "USD", user: null, … }`

> "These are the context's **default values**, the ones we wrote so components render in Storybook. So either there's no Provider…"

Walk **up** the tree: `SduiProvider` → `SduiContext.Provider` with `de-DE`, `EUR`, `Ana`.

> "…but there *is* a Provider, right above it, with the correct value. When a consumer reads the default with a Provider above it, there's only one explanation: **the consumer is subscribed to a different Context object.** Context identity is object identity. So: are there two copies of the context module?"

## 3:45 – 5:15 · Prove it (three independent pieces of evidence)

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

## 5:15 – 6:30 · Root cause and fix

**Editor:** `apps/offers/next.config.js`: `shared` doesn't list `@acme/sdui-context`. There's a comment about PR #412, which moved offers to the new package and updated the import but not the federation config.

> "Module Federation only dedupes what *every* participant lists in `shared`. Offers bundled a private copy, its own `createContext`, and read defaults forever. Nothing crashed, because the defaults are *valid*."

**Show the fix diff** (`git diff demo-start demo-fixed`):
- `shared: { '@acme/sdui-context': { singleton: true, requiredVersion: '^2.0.0', strictVersion: true } }`
- The package now **fails loudly**: warns when a second copy loads, and when `useSdui()` has no Provider.

**Show fixed:** Ctrl+Shift+B → untick `singleton-split` (reloads onto the correctly shared build) → **18.000,00 € · Hi, Ana**.

> "The config line is the fix. The loud warnings are the part that stops this from coming back."

## 6:30 – 8:00 · Lightning bug: the tab that freezes at exactly 30,000

> "Same app, 90 seconds, different tool. Support says the app freezes for *some* applicants. QA can't reproduce it."

1. **Ctrl+Shift+B** → untick `singleton-split`, tick `graph-cycle` → the page reloads. Go to **Income** (or jump straight there: `/apply/income?seed=threshold&bugs=graph-cycle`).
2. **Open DevTools first** (this is the whole trick), then type `30000` and click **Check eligibility**. The tab is frozen: the spinner never comes, the console is dead.
3. Sources → **Pause** (F8). The call stack stops in `resolveNext` → `pickEdge`, inside `while (edge)`.
4. Hover `target.id` in the loop (or add a logpoint): it alternates `eligibility → affordability → eligibility`.
5. Network → the graph payload: `eligibility` leaves on `totalIncome > 30000`, `affordability` comes back on `>= 30000`. At exactly the threshold, neither lets go.

> "Two teams, two decision nodes, one boundary they disagreed about. Server-driven UI means the server can ship you a cycle, so the client resolver now carries a visited-set and throws instead of hanging. And notice: a frozen tab isn't a dead end. Open DevTools **before** you reproduce, then Pause, and the stack tells you where you are."

## 8:00 – 9:20 · Takeaways

1. **Shrink the blast radius first.** Which deployable, which boundary? In microfrontends that question is half the investigation.
2. **Silence is a signal.** Wrong data with no error means a default or a fallback is involved. Defaults that "render fine" hide wiring bugs, so make contracts fail loudly (`strictVersion`, provider guards).
3. **Ask the tools who produced the value.** React DevTools for *which* value a hook got, the MF share scope for *which* copy exists, and Network for *what* was actually shipped.

> "The repo has eight more like these: hydration, stale remote entries, minified prod crashes, races, leaks. Each one has a write-up and a fix branch. Link on the slide."

## 9:20 – 10:00 · Buffer

Over-running is normal. Cuts, in this order: the third piece of evidence (console `__FEDERATION__`),
then the lightning bug, then the fix diff (just say what the line is).

---

## If something goes wrong on stage

| Problem | Recovery |
|---|---|
| Offer stuck on the grey skeleton | Browser tab not focused/visible (React defers work in hidden tabs); click into the page. Else reload. |
| Offer shows € (bug not active) | `Ctrl+Shift+B` → tick `singleton-split`. |
| `:3112` not running | `pnpm --filter @acme/offers dev:buggy` |
| Frozen tab won't unfreeze after the lightning bug | Close the tab, open a fresh one on `http://localhost:3100/apply/start?seed=&bugs=` (clears flags and draft). |
| Bug on/off behaves wrong after a `git checkout` | A remote kept its old `next.config.js`. Stop and rerun `pnpm dev` (the remotes run good+buggy under `concurrently -k`, so restart both). |
| Anything else | Switch to the backup video at the matching timestamp; keep narrating. |
