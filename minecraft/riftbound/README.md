# Riftbound: Wild Resonance

**Version 0.2.0 · Minecraft Java 1.21.1 · Fabric · Java 21**

Exploration gives you Echoes. An anchor turns those Echoes into a survival challenge. Completing a challenge earns Resonance, which you spend on a relic that changes how you move, fight, or mine.

## What is implemented

- Four Echo aspects: Verdant, Ember, Tidal, and Hollow.
- A craftable, placeable Rift Anchor with boss-bar progress and a visible arena boundary.
- Three unlocked trial tiers, each with its own wave count, entry cost, and reward.
- Seeded wave composition using six existing Minecraft enemy types.
- Solo trials or explicitly enrolled parties of up to four players.
- A Dormant Relic and three crafted offhand relics: Wayfarer, Bulwark, and Harvester.
- Saved tier unlocks using a namespaced vanilla scoreboard objective.
- Timeout, death, withdrawal, disconnect, anchor removal, unloading, shutdown, and orphan-mob cleanup.
- Trial enemies do not award normal loot, equipment, XP, or additional Echoes. Door breaking and zombie reinforcements are disabled for them.
- Original pixel textures, recipe-book unlocks, advancement tree, and translated item tooltips.
- Optional Convergence trials with four telegraphed aspect hazards and cross-mod rewards.

Original enemies, bosses, and structures remain in the [roadmap](docs/roadmap.md). Aspect hazards now ship in the optional Convergence mode; ordinary trials retain their original rules.

## Installation

1. Use a Minecraft Java **1.21.1** instance with **Fabric Loader 0.16.14 or newer** and Java 21.
2. Install [Fabric API for Minecraft 1.21.1](https://modrinth.com/mod/fabric-api).
3. Build this project or download the `riftbound-build` artifact from a successful repository Actions run.
4. Put `riftbound-0.2.0.jar` in the instance's `mods` directory. Do not install the `-sources.jar`.
5. Install the same mod and compatible Fabric API on the server and each participating client.

The build pins Fabric API `0.116.17+1.21.1`. It does not target other Minecraft versions.

## First survival session

Acquire Echoes from ordinary hostile enemies you kill: an 18% chance produces an Echo based on where that enemy died. Nether and desert/badlands kills favor Ember; Overworld kills below Y=0 give Hollow; river/ocean kills give Tidal; other locations give Verdant. Trial enemies never generate Echoes. All four Echoes also have deterministic crafting recipes using an amethyst shard and themed vanilla materials.

Build a Rift Anchor with all four Echo types, four obsidian, and an amethyst shard. Place it on flat, dry Overworld ground with a clear 12-block radius; leave space to fight inside its 24-block arena. Use Survival or Adventure mode with a difficulty above Peaceful. Right-click the anchor with the required number of Echoes in your main hand.

| Tier | Unlock | Waves | Echo entry cost | Shards per eligible player | Total time limit |
| --- | --- | ---: | ---: | ---: | ---: |
| Initiate | Available immediately | 3 | 1 | 3 | 4 minutes |
| Adept | Complete Initiate | 4 | 2 | 6 | 6 minutes |
| Exalted | Complete Adept | 5 | 3 | 10 | 8 minutes |

The entry cost is paid once by the initiator. All offered Echoes must have the same aspect. Preparation lasts five seconds, with four seconds between waves. Stay alive, in the same dimension, and within 24 blocks of the anchor through completion to receive rewards. A party member who leaves or dies cannot rejoin that run. After a run, every enrolled participant receives a 60-second cooldown.

Sneak-right-click the anchor with an empty main hand to cycle through your unlocked tiers. `/riftbound status` shows the selected tier, saved progress, and cooldown.

## Play together

Other players run `/riftbound ready` to opt into the next eligible nearby trial for five minutes. The initiator and the nearest three ready players within 12 blocks form the party. Each player must have unlocked the chosen tier and have no active trial or cooldown. Running the command again cancels readiness. A player outside these conditions is not enrolled.

Each eligible survivor receives the full tier reward. Party size increases the enemy count; it does not divide rewards. `/riftbound leave` forfeits your participation. Four trials may run on a server at once, with anchors at least 64 blocks apart.

## Convergence: optional cooperative challenge

With the Convergence bridge installed, unlock Adept or Exalted, select that tier, and hold a `convergence:attunement_core` in your **offhand** while offering the usual Echoes in your main hand. One core is consumed for the whole party only after activation checks succeed. Initiate does not support this mode. Invalid, locked, insufficient, obstructed, or cooldown-blocked attempts preserve both offerings. A trial that fails after activation does not refund them.

| Aspect | Marked zone | Impact |
| --- | --- | --- |
| Verdant | Green particles around a participant's position when the warning starts | Slowness II for 3 seconds inside the 3-block patch |
| Ember | Two flame-marked lanes with a safe gap | 3 HP on Adept / 4 HP on Exalted, as magic damage |
| Tidal | Splash-marked ring 6–18 blocks from the anchor | A short inward push |
| Hollow | Purple particles marking a narrow lane across the arena | Weakness I for 3 seconds |

Every wave gives three seconds of combat before its first warning. Adept warnings last at least three seconds; Exalted warnings last at least two seconds. Impacts are at least ten seconds apart. Warnings use the actual server tick when emitted, so lag cannot skip the reaction window. Clearing a wave cancels its pending hazard. Only enrolled, eligible living players are affected; bystanders remain unaffected.

| Tier | Total shards per eligible survivor | Extra reward |
| --- | ---: | --- |
| Adept Convergence | 8 (6 base + 2 bonus) | 1 Concordance |
| Exalted Convergence | 13 (10 base + 3 bonus) | 1 Concordance |

The initiator pays one core; every eligible survivor earns a full personal payout. Existing party readiness, withdrawal, cooldown, cleanup, and saved tier progression still apply. Ordinary standalone Riftbound needs no Convergence dependency and keeps its original rewards. Concordance and core recipes belong to the bridge, which connects Copperwake salvage and Starfall materials to this trial mode.

## Relic choices

Craft a Dormant Relic with four copper ingots and one amethyst shard. Each attuned relic uses eight Resonance Shards and one Dormant Relic. Its position in the 3×3 crafting grid selects the result:

| Dormant Relic position | Result | Offhand ability |
| --- | --- | --- |
| Center | Wayfarer | Speed I and Jump Boost I |
| Top right | Bulwark | Resistance I |
| Bottom left | Harvester | Haste I |

The other eight slots contain one shard each. One relic is active through the offhand slot. Effects refresh once per second and expire within two seconds of unequipping; switching can briefly overlap these effects. Existing potion effects are left to Minecraft's normal effect-merging rules.

## Developer setup

```bash
cd minecraft/riftbound
# JAVA_HOME must point to a Java 21 JDK.
./gradlew build
python3 tools/validate_resources.py
./gradlew runGameTest
./gradlew runClient
```

On Windows, use `gradlew.bat build` and `gradlew.bat runClient` from this directory. The Gradle wrapper is included. `build/libs/riftbound-0.2.0.jar` is the installable artifact.

`build` runs the framework-independent `domainTest` harness. Run it separately with `./gradlew domainTest`. Texture regeneration requires Pillow: `python3 tools/generate_textures.py`; resource validation uses only Python's standard library.

Operators can use `/riftbound kit` to receive an anchor and Echoes for testing. This command requires permission level 2; it does not bypass survival mode, difficulty, tier unlocks, or cooldowns.

## Verification and limitations

The v0.2 build passes 4,015 domain checks and all 12 headless Minecraft integration tests, including all four hazards, warning timing, bystander immunity, rejected activation, and once-only Convergence rewards. Static resource validation also passes. Details are recorded in [testing.md](docs/testing.md). Combat feel, client rendering, and a real two-client co-op session still require playtesting before this should be treated as a stable release.

Trials do not generate or replace terrain and do not hold chunks loaded. Interrupted trials are aborted, not resumed, after a restart. Progress persists; selected tier, readiness, and cooldowns reset when the server restarts. Shard rewards overflow onto the ground when a player's inventory is full. Keep arenas away from crops and delicate builds: these are vanilla enemies and standard collision/projectile interactions still apply.

See [design.md](docs/design.md) for balance and [claude-handoff.md](docs/claude-handoff.md) for a substantial follow-on implementation brief. Astra contributed the encounter engine, tests, design, and roadmap. Claude has not run against this project in this session.

## Ownership

Copyright © 2026 Afuerta. All rights reserved. No redistribution license is granted by the public repository.
