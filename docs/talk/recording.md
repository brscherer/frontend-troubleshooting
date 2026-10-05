# Recording the backup video (~20 min)

The backup has to show **DevTools** and carry **your narration**, so it's a screen recording of you doing the real run. Nothing can automate that part. What's automated is the setup: the seed URLs below drop you at any stage of the demo instantly, so a retake costs seconds instead of a minute of form-filling.

## Demo stage URLs

| Stage | URL |
|---|---|
| Hero bug, offer step, application filled | `http://localhost:3100/apply/offer?seed=ana&bugs=singleton-split` |
| Hero fixed (same page, correctly shared) | `http://localhost:3100/apply/offer?seed=ana&bugs=` |
| Lightning bug, income prefilled with 30000 | `http://localhost:3100/apply/income?seed=threshold&bugs=graph-cycle` |
| Clean slate (no flags, empty draft) | `http://localhost:3100/apply/start?seed=&bugs=` |

Both params strip themselves from the URL on load, so the address bar stays clean on camera. Seeds live in `apps/host/lib/draft.ts`.

For the lightning take you can either keep the prefilled `30000` and just click **Check eligibility**, or clear the field and type it live. Typing it is better on camera: the audience sees the exact value that triggers the freeze.

## Record it

1. **⇧⌘5** → **Record Selected Portion** → drag around the browser window only (not your whole desktop). Options → Microphone → your mic. Options → uncheck "Show Mouse Clicks" if the highlight bothers you.
2. Set up the first stage **before** you hit record: browser at the hero URL, DevTools open and docked bottom, Console tab selected and cleared, React DevTools' Components tab already showing `OfferNode`.
3. Record the full 10 minutes in one take, narrating exactly as you will live. Stumbles are fine; a backup video is insurance, not a showreel.
4. Stop with **⌘⌃Esc**. Save as `docs/talk/backup.mp4` (QuickTime saves `.mov`; either is fine, just keep the name consistent with the script).

Three takes is usually enough: one to find the rhythm, one that's usable, one that's good. If you only have time for one, record run 2 of your rehearsal.

## Before you hit record

- [ ] `pnpm dev` running, `pnpm smoke` green.
- [ ] Chrome **guest profile**, React DevTools installed, no ad blocker (the console noise is part of the story).
- [ ] Zoom 150 %, DevTools font size bumped, DevTools docked **bottom**.
- [ ] Notifications off (Do Not Disturb), other windows closed, no personal tabs or bookmarks bar on screen.
- [ ] Console filter box empty for the first take (you type the filter on camera).

## If the video needs a trim

```bash
# cut the dead air before 00:08 and after 10:15, no re-encode
ffmpeg -ss 8 -to 615 -i backup-raw.mov -c copy docs/talk/backup.mp4
```

## On stage

Keep the video open in a background window, paused at 0:00. If the live demo dies, switch to it, scrub to the matching timestamp, mute it, and keep narrating over it yourself. Audiences forgive a dead demo; they don't forgive silence.
