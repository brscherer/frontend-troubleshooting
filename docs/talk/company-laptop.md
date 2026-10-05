# Running this on a locked-down company laptop

Everything the demo needs runs on `localhost`, and the app loads nothing from the internet. The risk isn't the demo, it's **getting it installed** behind a corporate registry, proxy and extension policy. Do this **days before**, not the morning of.

## Path A: clone and install (try this first)

```bash
git clone https://github.com/brscherer/frontend-troubleshooting.git
cd frontend-troubleshooting
corepack enable          # or: npm i -g pnpm@10.16.1
pnpm install
pnpm dev                 # host :3100, intake :3101/:3111, offers :3102/:3112, graph :4000
pnpm smoke               # ✔ every bug: healthy when off, reproduces when on
```

Then open <http://localhost:3100/apply/offer?seed=ana&bugs=singleton-split>. If you see "Hi, Guest" and `$25,000.00`, you're ready.

**If `pnpm install` fails**, the usual causes:
- *Registry blocked or redirected to an internal mirror.* `npm config get registry` tells you. A mirror normally works; if integrity checks fail against it, try `pnpm install --no-frozen-lockfile`. If that fails too, go to Path B.
- *`corepack enable` can't fetch pnpm.* It downloads pnpm from the registry. Install it some other way (`npm i -g pnpm@10.16.1`) or use Path B, which needs no pnpm at all.
- *TLS interception.* `npm config set cafile /path/to/corporate-root.pem`, or `NODE_EXTRA_CA_CERTS=/path/to/root.pem pnpm install`. Don't disable TLS verification on a work machine.

## Path B: the offline bundle (no network at all)

Built with `./scripts/bundle.sh` on the source laptop → `.bundle/frontend-troubleshooting-offline.tgz` (~128 MB). It carries `node_modules`, so nothing is installed on the target.

```bash
mkdir -p ~/dev/frontend-troubleshooting
tar -xzf frontend-troubleshooting-offline.tgz -C ~/dev/frontend-troubleshooting
cd ~/dev/frontend-troubleshooting
./node_modules/.bin/turbo run dev --parallel     # no pnpm, no install, no network
```

`pnpm dev` works too if pnpm is available. **The bundle is platform-locked:** it was built on **macOS arm64** (see `PLATFORM.txt` inside). On Windows or an Intel Mac, the native binaries (`@next/swc`, `turbo`, `esbuild`) won't run — use Path A there, or rebuild the bundle on a machine matching the target.

Verified end to end: extracted to a clean directory on a machine with no install step, all six servers started and both demo bugs reproduced.

## Chrome and the React DevTools extension

The hero demo leans on the **Components** tab. If company policy blocks extension installs, you have two fallbacks:

**1. Standalone React DevTools** (a window instead of a tab):

```bash
npx react-devtools                              # needs the registry once; do it at home if possible
NEXT_PUBLIC_RDT_STANDALONE=1 pnpm dev           # the host connects to it on :8097
```

The hook lives in `apps/host/pages/_document.tsx` and is off unless that env var is set.

**2. Drop the DevTools beat entirely.** The other two pieces of evidence need no extension and are arguably more convincing:
- Sources → search all files (⌥⌘F) for `SduiContext.displayName` → two hits in two bundles.
- Network → `remoteEntry.js` for intake declares `@acme/sdui-context`; offers' doesn't.

Narrate the contradiction from the UI instead: the header says **Ana**, the card says **Guest**, same page, same React tree.

## Proxy, VPN and ports

- **Localhost must bypass the proxy.** macOS: System Settings → Network → Details → Proxies → "Bypass proxy settings for these hosts": `localhost, 127.0.0.1, *.local`. In Chrome you can force it: `--proxy-bypass-list="<-loopback>"`. Symptom if wrong: the host page hangs or the remotes fail to load with proxy errors.
- **VPN split tunnelling** doesn't normally touch loopback traffic, but test with the VPN *connected*, since that's how you'll present.
- **Ports** 3100, 3101, 3102, 3111, 3112 and 4000 must be free. Check with `lsof -nP -iTCP:3100 -sTCP:LISTEN`. If a corporate agent owns one, the ports appear in `apps/*/package.json` scripts, `apps/host/next.config.js` (remote URLs) and `apps/host/mf/bug-variant-plugin.js` (the buggy-variant ports) — change all three places.
- **The console noise is intentional.** `cdn.helpchat.example` fails to load by design; that error is part of the story. If corporate DNS makes it hang instead of failing fast, nothing breaks.
- **Endpoint security / antivirus** can make the first compile slow. Visit every demo URL once before the talk so everything is warm.

## Day-of checklist on that laptop

- [ ] VPN **on**, same as during the talk.
- [ ] `pnpm dev` running, `pnpm smoke` green.
- [ ] All four demo URLs opened once (warm compile): hero, fixed, lightning, clean slate. See [recording.md](recording.md).
- [ ] React DevTools working (extension, standalone, or you've rehearsed without it).
- [ ] `backup.mp4` copied over and playable (company media players can be restricted; test it).
- [ ] Screen mirroring tested at the real resolution, with DevTools docked bottom and zoom at 150 %.
- [ ] Rehearse the full 10 minutes **once on this laptop**. Everything above can pass and the demo can still feel wrong at a different screen size.
