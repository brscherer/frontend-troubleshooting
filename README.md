# Acme Lending: a microfrontend app with bugs planted on purpose

A loan application built as **server-driven UI on Module Federation**, seeded with ten realistic frontend bugs for a talk on troubleshooting. Every bug is **off by default**, switches on at runtime, and has a write-up plus a fix branch.

```
                       ┌──────────────── browser ────────────────┐
                       │  host (Next 14, Pages Router)  :3100    │
 graph-service :4000 ◄─┤   /apply/[nodeId]  → SSR fetches graph  │
  GET /graphs/loan     │   NodeRenderer → registry → remote node │
  POST /quotes         │        │                     │          │
                       │        ▼ Module Federation   ▼          │
                       │   intake :3101           offers :3102    │
                       │   (forms)                (offer, review) │
                       └──────────────────────────────────────────┘
   shared: react, react-dom, next/*, @acme/sdui-context (locale, currency, user, draft)
```

- **Graph:** `services/graph` returns nodes (`screen` or `decision`) with edges and conditions. The host SSRs the current node, walks decision nodes on the client, and renders each screen's component from the host or a remote.
- **Context:** `@acme/sdui-context` carries locale `de-DE`, currency `EUR`, user *Ana* and the application draft from the host into every remote. It has to be a shared singleton, and that's the whole story of bug 01.

## Quick start

```bash
pnpm install
pnpm dev          # all apps + graph service (turbo)
open http://localhost:3100
```

Requires Node 22+ and pnpm 10. Or with Docker: `docker compose up`.

| Port | App |
|---|---|
| 3100 | host |
| 3101 / 3111 | intake remote / intake **buggy build** (bug 08) |
| 3102 / 3112 | offers remote / offers **buggy build** (bug 01) |
| 4000 | graph service |

## Switching bugs on

- **URL:** `?bugs=singleton-split,quote-race` on any host page (stored in a cookie). `?bugs=` clears.
- **Panel:** **Ctrl+Shift+B** in the host. Tick and untick bugs, or reset the application draft.

Bugs that live in *build configuration* (01, 08) are served from a second build of the same remote. The host's MF runtime plugin (`apps/host/mf/bug-variant-plugin.js`) swaps the remote URL. Everything marked **DEMO PLUMBING** in the code is scaffolding, not part of the "real" app.

## The bugs

| # | Flag | What the user sees | Main tools | Profile |
|---|---|---|---|---|
| 01 | `singleton-split` | Offer in **$**, "Hi, Guest", no error | React DevTools (context), MF share scope, Network | dev/prod |
| 02 | `hydration-path` | Step bar flickers after reload; `#418` in prod | Hydration diff, react.dev/errors | dev/prod |
| 03 | `stale-remote-entry` | Deployed, but users see the old release | Network (disk cache, headers) | **prod** |
| 04 | `prod-crash` | 84-month term → step unavailable, minified stack | Source maps ("Add source map…"), Network | **prod** |
| 05 | `graph-cycle` | Tab freezes at income **exactly** 30,000 | Pause in Sources, call stack, Performance | dev/prod |
| 06 | `unknown-node` | Blank "Tax documents" step | React DevTools, graph payload | dev/prod |
| 07 | `quote-race` | Offer shows the quote for an old amount | Network waterfall, throttling | dev/prod |
| 08 | `two-reacts` | `Cannot read properties of null (reading 'useId')` | Stack frame origin, Sources search | dev/prod |
| 09 | `listener-leak` | Memory/listeners grow per offer visit | Heap snapshot comparison, retainers | dev/prod |
| 10 | `css-leak` | Host turns red/serif after visiting the offer | Styles pane, specificity, `<style>` source | dev/prod |

Write-ups: [`docs/bugs/`](docs/bugs). Presenting it: [`docs/talk/prep-2h.md`](docs/talk/prep-2h.md) (two-hour prep plan + likely questions) and [`docs/talk/hero-script.md`](docs/talk/hero-script.md) (timed 10-minute script: bug 01 + bug 05).

## Production profile (bugs 03 and 04)

```bash
pnpm prod               # build everything, start with `next start` (logs in .logs/)
pnpm redeploy:offers    # simulate a new offers release (new chunk hashes)
pnpm prod:stop
```

Remotes build with `hidden-source-map`: `.map` files exist next to each chunk but aren't referenced. Attach them in DevTools for bug 04.

## Smoke test before the talk

```bash
pnpm smoke                 # every bug: off = healthy, on = reproduces (headless system Chrome)
pnpm smoke singleton-split # one bug
```

Works against the dev or prod profile (`BASE_URL` overrides the host). Bug 03 needs a redeploy, so it's checked by hand (see its write-up).

## Git layout

- `main`: all bugs present, each behind its flag.
- `fix/NN-name`: one commit per bug with the real fix. `git diff main fix/07-quote-race` is the answer key.
- Tags: `demo-start` (main at talk time) and `demo-fixed` (the bug 01 fix) for the hero diff.

## Stack notes

- Next.js **14 Pages Router** + `@module-federation/nextjs-mf` 8.x. The App Router isn't supported by nextjs-mf, and the plugin is in maintenance mode, which is worth a slide.
- `webpack` pinned to 5.104 and `enhanced-resolve` to 5.18 (via pnpm overrides): newer `enhanced-resolve` breaks Next 14's resolver plugin (`_resolveContext_stack.delete is not a function`).
- Remote nodes render client-side only (mounted after hydration, then `React.lazy`).
