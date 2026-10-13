# 2026-10-13 — VR38 frontier expansion

Added three enemy variants with distinct fan, mortar and shield mechanics; visible attack tells and projectile trails; sprint/stamina/dodge; optional VR thumbsticks and snap turning; more procedural environment detail; recurring supply drops; eight persistent medals; and successful extraction after wave 3 with +25% run souls.

Wave events change enemy mix and clear bonuses without changing boss positions or queue size. New Quickstep, Second Wind and Field Medic perks support different runs. Fast projectile collision and armored damage reduction were corrected. Outstanding mortar zones are cleared before the next shopping break.

Verification: static build and 37 regressions pass; new enemy rendering/attacks, sprint/dodge, pause freeze, extraction, Night Siege/Gridlock queues and phone controls pass in real WebGL2. Physical Quest locomotion/MR presentation and headset performance remain pending.

# 2026-10-13 — VR37 playability pass

The previous menu exited the active run, a final queued spawn could complete a wave before being defeated, and four Armory tiers charged souls without unlocking anything. This pass fixes those progression issues and gives screen players a usable mission briefing, pause screen, and live next-step guidance.

## Behavior changes

- Escape and Pause preserve run state; Resume continues it. Leaving an active run requires a second explicit click. Backgrounding the screen pauses it.
- Mode cards launch their selected screen game directly. The Armory remains accessible from the lobby. Headset mode selection stays in-world.
- Pausing freezes timers, wave progression, enemies and projectiles, reloads, and movement. It does not create a persistent run checkpoint.
- Last enemy spawns no longer issue premature wave rewards in Survival, Night Siege, or Gridlock.
- The Armory has six paid gun tiers for its twelve locked guns. Saves with the old seventh–tenth tiers receive their original costs back once (up to 1,220 souls). Valid upgrades, records, and lifetime rank are retained.
- Invalid numeric saved values recover to bounded playable values. New Gridlock runs clear stale loss state.
- Trader time remaining is shown; VR partial contract progress refreshes as it changes.
- Headset init failures clean up sessions and restore a useful error. Tracking/visibility/controller loss clears held and buffered fire/grip state.

## Verification

- Static build and all ordered script parse checks pass.
- 25 Node regression tests pass.
- Real WebGL2 browser verification covers all four modes and screen flows.
- Quest hardware / MR passthrough and headset performance remain unverified.
