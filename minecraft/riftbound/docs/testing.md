# Verification record

The current implementation is an initial development build, not a fully playtested release.

## Automated checks

- Java 21 domain compilation with `-Xlint:all`: passed.
- Domain harness: 3,772 checks passed, including 192 aspect/tier/party/seed combinations, immutable plans, phase deadlines, timeout boundaries, duplicate and stale deaths, exact spawn acknowledgments, player withdrawal, once-only rewards, and cooldown/world reset.
- Static resource validation: passed. Checks recipe schemas/reachability, all local registry references, PNG integrity/dimensions, model links, localization, advancement links, loot, and mining-tool tags.
- Negative resource fixtures: invalid ingredient syntax, missing texture, and missing localization were rejected.
- Texture reproducibility: passed.
- Full Fabric compilation, source packaging, remapped installable JAR, and headless Minecraft bootstrap: passed.
- Six Minecraft GameTests passed. The real encounter test required all 12 Initiate enemies across three waves, transformed a managed zombie into a drowned, and checked the exact three-shard reward, saved tier unlock, cleanup, and immediate retry rejection.
- Release JAR metadata resolves version 0.1.0 and includes the mixins/refmap. GameTest source and resources are excluded from the installed mod.

Run `./gradlew runGameTest build` to repeat runtime tests, domain checks, and packaging. The headless engine log is `build/run/gameTest/logs/latest.log`.

| Engine test | Verified behavior |
| --- | --- |
| Runtime registries and recipes | Ten items, anchor block, and all nine craftable outputs load in Minecraft |
| Tagged loot/XP | Trial enemies suppress ordinary loot and XP; normal enemy behavior remains |
| Orphan entity load | Leftover tagged enemies are discarded; ordinary enemies are preserved |
| Offhand server tick | Harvester applies its actual Haste effect through the server callback |
| Rejected interaction | Offhand cannot start a trial; an insufficient Adept offering remains unconsumed |
| Full trial and conversion | All three waves must die, conversion remains managed, reward/progress occurs once, and cooldown prevents restart |

## Required playtests

1. Start a fresh Survival world and obtain/craft each Echo, build the anchor, finish Initiate, and select Adept. Check the recipe book and advancement display.
2. Test all four aspects and three tiers. Check readability, time limits, enemy targeting, daylight immunity, and whether the relic choices are useful.
3. Use a second client to opt in, start a two-player trial, and verify scaling and equal individual rewards. Nearby unready players must remain unenrolled.
4. Confirm insufficient entry stacks cannot start a trial. Confirm a failed preflight does not consume an Echo.
5. Die, leave the arena, disconnect, change dimension, and use `/riftbound leave`. None may grant a reward or allow rejoining the run.
6. Destroy the anchor, obstruct spawn positions during warmup, unload chunks, stop/restart the server, and check cleanup. Disappearing enemies must never count as defeated.
7. Kill trial enemies with multiple damage types and confirm ordinary loot, equipment, XP, and Echoes are suppressed. Normal enemies must retain their drops.
8. Fill a player's inventory before a win; verify the exact shard remainder drops safely and progress still updates once.
9. Exercise multiple anchors, same-tick requests, four-player parties, Hard difficulty, spider jockeys, zombie reinforcements, and conversion in water.
10. Equip/unequip each relic, switch quickly, and combine with stronger potions. Confirm effects expire naturally and other mods' effects are not stripped.

This checklist is not evidence that these manual sessions have run.
