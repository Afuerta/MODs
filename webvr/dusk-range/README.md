# Dusk Range

Room-scale WebXR / mixed-reality shooter with four modes: Target Range, Survival, Night Siege, and Gridlock tower defense. Also playable with a mouse/keyboard or touch controls.

## Source and collaboration

This app was recovered from the owner's current Vercel deployment `dpl_cfWpd1ffppCQ5DUSjAjXUf8p3F1r` on 2026-10-13. No Dusk Range source was found in the connected GitHub repositories or MODs branches. It is introduced under `webvr/dusk-range/` on an isolated draft branch for review; Minecraft and Terraria code is not modified. `SOURCE.json` records the original deployment file digests.

The original ordered scripts were formatted for review; their names and order are retained so another contributor can compare with the existing live deployment. `src/js/ui.js` and `src/frontier.css` contain the screen interface. `src/js/expedition.js` adds the VR38 combat, movement, environment and career systems. The game uses a custom WebGL2 renderer, with no build-time or runtime package dependencies.

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
| Turn | Q / E; on-screen turn buttons | Turn physically; optional right-stick 30° snap turn |
| Sprint / dodge | Shift / F; Move and Dodge touch buttons | Optional left-stick movement; physical dodging |
| Pause | Esc / Pause button; automatically on focus loss | Headset visibility or tracking loss suspends simulation |

Screen mode selection launches directly. VR/MR retains its in-world targets. MR offers Range, Survival, and Night Siege; Gridlock uses its full virtual city.

Pause preserves the in-memory run while the tab remains open. It is not a disk checkpoint: reloading or closing the page ends that run. Existing banked souls, purchased upgrades, and records retain their original localStorage keys. Browser data is specific to each origin, so a preview URL has a separate save from the live URL.

## VR38 frontier expansion

- Three original enemy variants: Prism Drone fires energy fans, Ash Mortar launches visible arcs into telegraphed ground strike zones, Rift Warden shields its body and opens during attack tells. Head and drone-core hits reward precision.
- Wave events cycle through Rift Patrol, Red Sky, Iron Front and Ghost Wind, with extra clear bonuses and enemy variety. Boss positions, queue size and caps are preserved.
- Screen sprint, stamina and a short invulnerable dodge with cooldown; increased combat movement space. VR thumbstick locomotion and 30° snap turning are opt-in through Controls & settings; MR remains room-scale.
- Guaranteed supplies every 12 eliminations (10 during Ghost Wind), three mobility/supply perks, and eight persistent career medals with once-only soul payouts.
- After completing wave 3, shoot the green extraction drop or use Extract & bank during the break to finish alive with 25% more run souls. Medals and normal contracts are separate payouts.
- New desert pylons, ghost-town wisps, city beacons and orbital lights; bounded projectile trails and attack pulses. Procedural detail uses a separate draw batch.
- Fast enemy shots use swept collision; armored enemies apply their damage reduction before health is removed. Wave completion clears pending mortar zones.

Physical Quest locomotion feel and performance still require hardware testing. Automated checks verify offset mathematics, snap-turn latching, opt-in behavior and MR exclusion.

## VR37 foundation

- Redesigned responsive mission lobby with mode briefings, career information, and direct screen launch.
- True screen pause/resume, automatic pause on focus loss, and confirmation before leaving an active run.
- Phase-aware objectives, trader countdowns, touch turn/duck/reload buttons, screen graphics and volume settings.
- Correct wave completion after the last queued enemy is defeated in all three combat modes.
- Armory tiers limited to real gun unlocks; obsolete purchased tiers refunded once without inflating lifetime rank.
- Saved progression validation, Gridlock restart cleanup, and current VR contract progress.
- Robust headset startup failure cleanup, session concurrency protection, and trigger/grip reset on tracking/visibility loss.

## Validation limits

The build, 37 gameplay/session regressions, and real WebGL2 browser flows were tested. Physical Quest rendering, controller feel, mixed-reality passthrough, and headset performance still require hardware testing. Headless WebGL verification is not a headset frame-rate benchmark.

## Existing external assets

The recovered game optionally loads Kenney models from the Kenney Starter Kit FPS and Starter Kit 3D Platformer repositories through jsDelivr. The references remain in `src/js/10.js`; see the upstream Kenney repositories for asset provenance and license terms. Procedural models remain available if those downloads fail. Google Fonts supplies Saira Semi Condensed and Saira Stencil One, with local font fallbacks. Neither optional models nor fonts are newly bundled here.
