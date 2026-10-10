# Verification record

The current implementation is an initial development build, not a fully playtested release.

## v0.3 encounter expansion

The added tests exercise the real server adapter in the headless Minecraft harness; they do not establish multiplayer combat balance or client readability.

| Added engine scenario | Contract |
| --- | --- |
| Reinforcements then pincer | Three vanguard enemies cannot clear a five-enemy wave; two reserves arrive after the full warning; the following six enemies enter from opposite sides with the brief rush effect |
| Obstructed reserves | Building over reserved gates after activation aborts the run, removes deployed and prepared enemies, and awards no shards or progression |
| Withdrawal with reserves | Cancelling before deployment never releases the reserved enemies later and grants no rewards |
| Converted standard-bearer | Conversion preserves the named glowing priority target and loot suppression; guard affects only nearby registered allies, excludes the bearer and ordinary mobs, and ends immediately on bearer death |
| Advanced party completion | Party scaling stays fixed after withdrawal; all planned enemies must die; only the eligible survivor receives the unchanged reward once |

Domain checks cover deterministic pattern selection, unchanged Initiate composition/counts, bounded unique pincer slots, immutable pending UUID reservations, atomic invalid reservation rejection, late/duplicate deaths and deployments, converted reserve accounting, no early wave completion, and failure preventing delayed deployment.

Direct Java 21 compilation with `-Xlint:all` and all **4,718 domain checks** pass. Fabric production and GameTest source compilation pass; all **17 required Riftbound headless engine tests** passed, including the five new scenarios above. Static resource validation passes with all encounter telegraphs and the priority target name required. The root validation record tracks the combined four-mod build and runtime separately.

## v0.2 expansion checks

- Main and GameTest source compilation, remapped JAR/source packaging, and standalone Fabric runtime: passed.
- Domain harness: 4,015 checks passed, including 243 new hazard timing/geometry checks.
- New engine scenarios: failed Convergence activation preserves both offerings; complete Adept awards eight shards and one Concordance exactly once; Hollow warnings precede impacts and spare bystanders, with clean withdrawal. Additional engine cases exercise Verdant Slowness II, Tidal inward movement, and exact Ember magic damage despite Fire Resistance. All 12 Riftbound engine tests passed in the standalone module build. The coordinated four-mod runtime run is recorded separately by the root build.
- Test-only bridge item fixtures are excluded from the release JAR and disabled when the real Convergence bridge is loaded.

| New engine test | Verified behavior |
| --- | --- |
| Convergence rejected activation | Unsupported Initiate, insufficient Echo count, and obstructed arena preserve Echoes and cores |
| Adept Convergence completion | All 26 enemies must die; exactly eight shards and one Concordance are delivered; retry/terminal ticks cannot duplicate them |
| Hollow warning and cleanup | Full warning precedes Weakness, nearby unenrolled player stays unaffected, withdrawal cancels future pulses, existing effect expires |
| Verdant roots | Actual Slowness II begins only after the Adept warning and abort cleans up enemies |
| Tidal current | An eligible player in the marked ring receives actual inward velocity after warning |
| Ember lanes | Two real enrolled players exercise exact three-HP magic damage despite Fire Resistance, followed by clean withdrawal |

The test players use in-memory network channels. Fixtures explicitly call the living-player tick that a real network handler supplies, so status expiration and movement are tested rather than frozen.

## v0.1 baseline automated checks

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

## Convergence manual checks

- Install the bridge with Copperwake, Starfall, and Riftbound on both clients and server; craft the core through the real cross-mod recipe chain.
- Observe all four warning patterns at different anchor elevations and camera settings. Warnings must remain readable with standard particle settings.
- Run both tiers solo and in a party, stand inside and outside each marked zone, and compare enrolled players with nearby unready bystanders.
- Move out of a Verdant patch after warning, escape Ember lanes, avoid the Tidal ring, and step aside from a Hollow lane. Check that magic Ember damage is still relevant with Fire Resistance.
- Finish with full inventories, leave during a warning, die on an impact, destroy the anchor, or obstruct a later spawn. Confirm no delayed impacts or duplicate Concordance rewards remain.

## Advanced encounter manual checks

- Play Adept and Exalted solo and with four players, both ordinary and attuned, with each Echo aspect.
- Observe text, sound, reserve gates and glowing bearer with low particles and normal network latency.
- Check that the pincer leaves usable movement routes and that the five-second reserve warning is readable.
- Pull guarded enemies beyond eight blocks, defeat the bearer first, and convert it in water; compare tactics against ordinary simultaneous waves.
- Obstruct a reserve gate or remove the anchor during the warning. Confirm there is no delayed spawn, normal mob loot or extra completion payout.

These manual sessions have not been run by an AI agent.
