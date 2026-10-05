# Two hours to presenting this

A timed plan to go from "I have this repo" to "I can present it in 10 minutes". Follow it in order; the first hour is understanding, the second is rehearsal. Keep [the speaker script](hero-script.md) open in a second window the whole time.

What you're presenting: **one bug investigated properly** (01 · singleton split, ~6:30) plus **one lightning bug** (05 · graph cycle, 90 s). Everything else in the repo is take-home material for the audience.

---

## 0:00 – 0:15 · Make it run and see the happy path

```bash
cd ~/dev/frontend-troubleshooting
pnpm install          # skip if node_modules is already there
pnpm dev              # leave running: host :3100, intake :3101/:3111, offers :3102/:3112, graph :4000
```

Open <http://localhost:3100> and walk the flow as a user: **Start → name/email/date of birth/amount → Employed → income 45000 → offer → review**.

Watch for the three things the demo rests on:
- The header greets **Ana** and money is formatted **18.000,00 €** (German locale, euros).
- The step bar changes shape when you pick **Self-employed** (a "Tax documents" step appears). That's the graph branching.
- The footer says `graph loan@2026.09.1 · node offer`. Every page is a node.

> If something looks broken, the flags may be set from an earlier run: open `http://localhost:3100/apply/start?bugs=` to clear them.

## 0:15 – 0:35 · Understand the architecture (5 files, in this order)

Read just these, in this order. You need to be able to *draw* this, not recite it.

1. `services/graph/src/graph.ts` — the loan graph. Nodes are `screen` (render a component) or `decision` (the host follows an edge immediately). Note `eligibility` and `affordability`: the two decision nodes of the lightning bug.
2. `apps/host/pages/apply/[nodeId].tsx` — SSR fetches the graph, renders the current node, and `onNext` asks `resolveNext` where to go.
3. `apps/host/components/registry.tsx` — maps `{remote, module}` from the graph to a real component. Remote entries are `React.lazy`, mounted after hydration.
4. `packages/sdui-context/src/index.tsx` — the context carrying locale, currency, user and the draft into every remote. **This is the hero bug's victim.**
5. `apps/offers/next.config.js` — the federation config. Look at the `shared` block and the `buggy` ternary: that *is* the hero bug.

One paragraph you should be able to say out loud:

> "The server owns a graph of nodes. The host renders the node for the current URL, and each node's UI comes from a federated remote. Everything shared between host and remotes — locale, currency, who the user is — travels through one context package that must exist exactly once in the browser."

## 0:35 – 1:00 · Do the investigation yourself (twice)

Open the hero bug and work it **without** reading the script the first time. Get stuck; that's the point. Then do it again following the script.

```bash
open "http://localhost:3100/apply/offer?seed=ana&bugs=singleton-split"   # jumps straight to the symptom
```

`?seed=` fills the application draft and `?bugs=` sets the flags; both strip themselves from the URL. The other stages are listed in [recording.md](recording.md).

The four moves you must own:

| Move | Where | What you're looking for |
|---|---|---|
| Blast radius | The page itself | Host header right, intake right, **offers** wrong → the bug lives at that boundary |
| Filter the noise | Console filter box: `-acme-analytics -HelpChat -helpchat` | Nothing left. Silence is the clue. |
| Who gave you that value | React DevTools → Components → `OfferNode` → hooks → Context | `en-US / USD / null` = the **defaults**, while a Provider above has `de-DE / EUR / Ana` |
| Prove two copies | Sources ⌥⌘F `SduiContext.displayName` · Network `remoteEntry` · Console `__FEDERATION__…` | Two bundles define the context; offers' entry never declares it shared |

Practise the console one-liner until you can type it blind:

```js
__FEDERATION__.__SHARE__['host:1.0.0'].default['@acme/sdui-context']
```

Then run the lightning bug end to end: **Ctrl+Shift+B** → untick `singleton-split`, tick `graph-cycle` → go to Income → **open DevTools first** → enter `30000` → Check eligibility → **F8 to pause** → read the call stack.

## 1:00 – 1:15 · Learn the fix and the "why" in one pass

```bash
git diff demo-start demo-fixed
```

Two things in that diff:
- `apps/offers/next.config.js`: the remote now lists `@acme/sdui-context` as `singleton` + `strictVersion`.
- `packages/sdui-context/src/index.tsx`: warns when a **second copy** loads, and when `useSdui()` renders with no Provider.

The sentence that makes the talk land:

> "Nothing crashed, because the defaults were *valid*. The fix is one config line; the part that stops it coming back is making the failure loud."

Skim [`docs/bugs/01-singleton-split.md`](../bugs/01-singleton-split.md) once for the wording, and [`05-graph-cycle.md`](../bugs/05-graph-cycle.md) for the lightning bug.

## 1:15 – 1:40 · Rehearse out loud, twice, with a timer

Full run, out loud, standing, timer visible. Don't fix stumbles mid-run; note them and keep going.

- Run 1 is usually 12–14 min. The cut list is in the script's **Buffer** section: drop the third evidence, then the lightning bug, then the fix diff.
- Run 2: hit 10:00. If React DevTools hunting eats time, pre-select `OfferNode` in the Components tab before you start.

Reset between runs:

```bash
# fresh state: flags cleared, draft emptied
open "http://localhost:3100/apply/start?seed=&bugs="
```

## 1:40 – 1:55 · Record the backup and build three slides

Record one clean run and save it as `docs/talk/backup.mp4`: step-by-step in [recording.md](recording.md). If the live demo dies, you narrate over the video and nobody notices.

Three slides is all you need:
1. **Title + the ticket** ("offer shown in dollars to a German customer, no errors").
2. **The architecture drawing** (host + two remotes + graph service + the shared context package). Copy the diagram from the README.
3. **Takeaways + repo link** — the three lines from the end of the script, plus "8 more bugs, each with a write-up and a fix branch".

## 1:55 – 2:00 · Pre-flight

```bash
pnpm smoke            # ✔ every bug: healthy when off, reproduces when on (~2 min)
```

- [ ] Chrome **guest profile**, React DevTools installed, **no ad blocker** (the console noise is part of the story).
- [ ] Zoom 150 %, DevTools docked to the bottom, DevTools font size bumped.
- [ ] Open `/apply/offer?seed=ana&bugs=singleton-split` (no form-filling needed).
- [ ] Editor on tab 2 with `git diff demo-start demo-fixed` ready.
- [ ] `backup.mp4` open in a background window.
- [ ] Phone timer at 10:00, Do Not Disturb on, notifications off.

---

## Questions seniors will actually ask

**"Wouldn't TypeScript have caught this?"**
No. Both copies of the package are type-identical. The failure is one of *runtime module identity*, which types can't see. That's why the guard is a runtime warning.

**"Why not just put everything in `shared`?"**
Over-sharing has its own failure mode: a remote that must upgrade independently gets pinned to the host's version, and `strictVersion` then fails the load. Share what carries identity (React, routing, context/design-system singletons); let everything else duplicate.

**"Why does `singleton: true` not catch a version mismatch?"**
With `singleton`, MF keeps one copy and logs an `Unsatisfied version` warning, which is invisible in a noisy console. `strictVersion: true` turns it into a load error. The bug here is worse than a mismatch: offers never declared the package at all, so there was nothing to dedupe.

**"How would you catch this in CI, not on stage?"**
Three cheap gates: assert each remote's `mf-manifest.json` declares the shared singletons; a smoke test per remote that renders a node and asserts formatted output (`€` not `$`); and the runtime "multiple copies" warning promoted to a test failure.

**"How would you detect it in production?"**
It's silent by construction, so synthetic checks beat error monitoring: one journey per locale asserting the rendered currency. Plus ship the duplicate-copy warning to your error tracker as an error.

**"Is Module Federation worth it?"**
Honest answer: independent deploys cost you a shared runtime contract, which is exactly what broke here. Worth it when teams genuinely need independent release cadence; the graph/SDUI part is independent of that choice.

**"App Router?"**
`@module-federation/nextjs-mf` is Pages Router only and in maintenance mode. For App Router today you'd use the runtime API with client-side remotes, or a different composition approach entirely. Worth one slide if the audience is Next-heavy.

**"Did you plant these, or were they real?"**
Planted, but each is modelled on a real failure mode, and the repo's write-ups say how each was found and fixed.
