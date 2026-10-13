# Dusk Range task board

| ID | Task | Owner | Status |
| --- | --- | --- | --- |
| VR38 | Add enemy variants/attack tells, movement, environment detail, repeatable supplies/career medals and extraction | Codex | Implemented; 37 regression tests and WebGL desktop/mode/mobile checks pass; headset playtest pending |
| VR37 | Recover current Vercel source, improve mission lobby/pause/controls, correct wave and progression defects | Codex root + gameplay / XR / browser agents | Implemented; automated and browser verification complete; physical Quest playtest pending |

Owned paths for this task: `webvr/dusk-range/` only. No Minecraft, Terraria, shared build, or other agent branches are changed.

## Handoff

- Compare live source using the provenance manifest before applying concurrent Claude work.
- Keep the four existing modes, saved progress keys, and original script execution order.
- Preview is an isolated Vercel deployment. Production promotion and repository-root selection remain a separate decision.
- The browser smoke test must keep exercising direct launches, pause/resume, discard confirmation, and narrow-screen layout. Unit tests cover wave completion, Armory migration, and XR lifecycle edge cases.
