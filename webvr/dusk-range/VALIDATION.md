# VR37 validation — 2026-10-13

## Completed

| Check | Result |
| --- | --- |
| Static build | Pass; 38 ordered game scripts parse, local stylesheets exist, 44 DOM IDs unique |
| Node regression tests | 25 pass, 0 fail |
| WebGL2 rendering | All four modes render; no JavaScript exceptions or WebGL errors |
| Desktop entry | Select each mode card, direct launch, correct mode and phase |
| Pause / resume | Timers, phases, health, beacon integrity, player/camera position, ammo and live projectiles remain frozen; movement resumes |
| Run exit | Leaving an active run offers cancel or explicit discard; cancel retains the run |
| Preferences | Mode, volume and screen-quality settings survive reload |
| Mobile | 390-pixel viewport: no lobby/card/title overflow; turn, duck, reload, pause and resume work |
| Optional CDN failure | Procedural asset and local font fallback remain playable with CDN requests blocked |

The browser checks use Playwright with headless Chromium, WebGL2, and SwiftShader. They verify user flows and rendering correctness, not Quest performance or physical controller feel.

## Fixed during verification

- Escape initially opened then immediately closed the native dialog; preventing its default action fixes pause behavior.
- Intrinsic grid widths and the title overflowed a phone viewport; shrinkable grid tracks and a responsive title fix them.
- Delayed boss/rank callbacks could wake paused audio; they now use simulation timers cleared when leaving a run.

## Still pending

- Actual Quest VR/MR session presentation, passthrough, tracked controller ergonomics, headset frame rate, and long-session thermal behavior.
- Hosted preview was approved by the user and deployed successfully: `dpl_DxSLPTSoRFBoRNTWFcA96feoyLph` is READY at https://dusk-range-6z207bjz7-mithril98.vercel.app/ . The temporary share link is provided privately in the conversation. The existing production deployment remains unchanged.

## Reproduce

`npm run check && npm test && npm run build`

Serve with `npm run dev`, then run `node tests/browser-smoke.mjs` with Playwright installed. See README for browser runtime overrides. Unit tests need no package installation.
