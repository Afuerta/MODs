# Dusk Range

Room-scale WebXR / mixed-reality shooter with four modes: Target Range, Survival, Night Siege, and Gridlock tower defense. Also playable with a mouse/keyboard or touch controls.

## Source and collaboration

This app was recovered from the owner's current Vercel deployment `dpl_cfWpd1ffppCQ5DUSjAjXUf8p3F1r` on 2026-10-13. No Dusk Range source was found in the connected GitHub repositories or MODs branches. It is introduced under `webvr/dusk-range/` on an isolated draft branch for review; Minecraft and Terraria code is not modified. `SOURCE.json` records the original deployment file digests.

The original ordered scripts were formatted for review; their names and order are retained so another contributor can compare with the existing live deployment. `src/js/ui.js` and `src/frontier.css` contain the new screen interface. The game uses a custom WebGL2 renderer, with no build-time or runtime package dependencies.

## Run and verify

Use Node 20 or later from this directory:

```sh
npm run dev
npm run check
npm test
npm run build
```

Open `http://localhost:8775`. `PORT` overrides the server port. Production files are copied to `dist/`. WebXR requires HTTPS, or a browser-recognized trustworthy local origin. A headset cannot reach your computer using its own `localhost` address.

The optional browser smoke test uses Playwright:

```sh
npm install --no-save playwright
npx playwright install chromium
npm run dev
# In a second terminal:
node tests/browser-smoke.mjs
```

See the browser script for `DUSK_BASE_URL`, `PLAYWRIGHT_MODULE`, and `CHROMIUM_PATH` overrides. It is separate from `npm test`, which runs the dependency-free gameplay and WebXR lifecycle tests.

## Controls

| Action | Screen | Quest controllers |
| --- | --- | --- |
| Shoot | Click / Space; tap on touch | Trigger |
| Reload | R; Reload touch button | Aim down, or A / X |
| Aim / steady | Right mouse button | Grip the long gun with the other hand |
| Move / dodge | WASD; C to duck | Move within your play area |
| Turn | Q / E; on-screen turn buttons | Turn physically |
| Pause | Esc / Pause button; automatically on focus loss | Headset visibility or tracking loss suspends simulation |

Screen mode selection launches directly. VR/MR retains its in-world targets. MR offers Range, Survival, and Night Siege; Gridlock uses its full virtual city.

Pause preserves the in-memory run while the tab remains open. It is not a disk checkpoint: reloading or closing the page ends that run. Existing banked souls, purchased upgrades, and records retain their original localStorage keys. Browser data is specific to each origin, so a preview URL has a separate save from the live URL.

## This iteration

- Redesigned responsive mission lobby with mode briefings, career information, and direct screen launch.
- True screen pause/resume, automatic pause on focus loss, and confirmation before leaving an active run.
- Phase-aware objectives, trader countdowns, touch turn/duck/reload buttons, screen graphics and volume settings.
- Correct wave completion after the last queued enemy is defeated in all three combat modes.
- Armory tiers limited to real gun unlocks; obsolete purchased tiers refunded once without inflating lifetime rank.
- Saved progression validation, Gridlock restart cleanup, and current VR contract progress.
- Robust headset startup failure cleanup, session concurrency protection, and trigger/grip reset on tracking/visibility loss.

## Validation limits

The build, 25 gameplay/session regressions, and real WebGL2 browser flows were tested. Physical Quest rendering, controller feel, mixed-reality passthrough, and headset performance still require hardware testing. Headless WebGL verification is not a headset frame-rate benchmark.

## Existing external assets

The recovered game optionally loads Kenney models from the Kenney Starter Kit FPS and Starter Kit 3D Platformer repositories through jsDelivr. These asset packs are credited to Kenney, distributed under CC0; their references remain in `src/js/10.js`. Procedural models remain available if those downloads fail. Google Fonts supplies Saira Semi Condensed and Saira Stencil One, with local font fallbacks. Neither optional models nor fonts are newly bundled here.
