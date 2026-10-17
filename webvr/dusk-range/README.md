# Dusk Range

A custom WebGL2 / WebXR shooter for Meta Quest, mixed reality, and desktop browsers. This source retains the current production modes: Target Range, Survival, Night Siege, Gridlock, and Quick Draw.

## Run and verify

The game is static HTML and ordered JavaScript, with no build-time package dependencies. Use Node.js 20 or later for checks and Python 3 for the included local server command:

```sh
cd webvr/dusk-range
npm run check
npm test
npm run serve
```

Open `http://localhost:8080`. Serve or publish the contents of `src/` as the site's document root; no bundling or compilation is required. Keep the script order in `src/index.html`. WebXR requires HTTPS or a browser-recognized trustworthy local origin. A headset's `localhost` refers to the headset itself, not the development computer.

`npm run check` parses every referenced script individually and in execution order. `npm test` runs the dependency-free Node regression suite. Physical Quest controller feel, rendering, mixed-reality passthrough, and performance require a separate hardware playtest.

This revision is prepared for review. Vercel preview publication is pending user approval after automatic approval review rejected the deployment request; no new preview or production deployment is claimed here.

## VR42 scope

- Direct screen launch for each of the five modes, with guards against replacing an active or paused run.
- Pause and resume without resetting an active screen session; focus loss clears held input and pauses play.
- Accessible pre-headset turning and seated options, preserving valid saved preferences and rejecting malformed settings.
- Reliable headset visibility/tracking interruption and startup cleanup, including neutral-stick gating after tracking resumes.
- Armor reduction applied consistently to health and displayed damage while preserving weak spots and custom hit handlers.
- Quick Draw reaction timing advanced once per frame in real time, including during slow motion.

Pause preserves the active run in memory while its tab remains open; it is not a disk checkpoint. Banked progress retains the existing storage keys. Preview deployments have separate browser storage from the production origin.

## Source baseline and parallel work

This task starts from the current production Vercel deployment `dpl_EsDZvtv1N85gKEaM8WPHdVL5b9a8`, retrieved October 17, 2026, at `https://dusk-range-geto8gm1c-mithril98.vercel.app`. `source-manifest.json` records the recovered deployment file identities; its digests describe the baseline, not the subsequently edited files.

The GitHub repository's `main` branch had no `webvr/` source at task start. This snapshot is introduced on `chatgpt/vr42-dusk-range-comfort`, based on main commit `142feeb8558e6a8cf4d9b96044e82ec4a047f3a0`.

[Draft PR #7](https://github.com/Afuerta/MODs/pull/7), on `chatgpt/vr37-dusk-range-playability`, remains separate. Its October 13 snapshot includes a redesigned mission lobby and Frontier enemies, movement, and extraction rewards. The October 17 production baseline instead contains newer Quick Draw, options/medals boards, lighting, performance, and comfort systems. The script numbering also differs. Neither branch is a drop-in replacement for the other: reconcile their behavior and tests before merging both. This task does not remove or overwrite PR #7.

## Existing external assets

The recovered game optionally loads Kenney models from [Starter Kit FPS](https://github.com/KenneyNL/Starter-Kit-FPS) and [Starter Kit 3D Platformer](https://github.com/KenneyNL/Starter-Kit-3D-Platformer) through jsDelivr. Their existing references remain in `src/js/11.js`; see those upstream repositories for asset provenance and license terms. Procedural models remain available when downloads fail. Google Fonts supplies Saira Semi Condensed and Saira Stencil One, with local font fallbacks. These optional models and fonts are not newly bundled by this task.
