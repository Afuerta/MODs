# Convergence 0.3.0 validation

Recorded on 2026-10-10 with Java 21, Minecraft 1.21.1 and the pinned Fabric toolchain. These are observed local outcomes for the reconciled T24 expedition change; GitHub CI must verify the same source before merge in [PR #6](https://github.com/Afuerta/MODs/pull/6). The [0.2.0 record](VALIDATION-0.2.0.md) is retained separately.

The full root command `build combinedGameTest modpack` passed with **BUILD SUCCESSFUL** in an isolated checkout of `638fb49bac53effc2da5b58e28c2841261e1d9b4`. The clean build used `--rerun-tasks --no-build-cache`; all 723 actual source/build/pack input hashes remained unchanged. The combined server loaded all four production mods and all four test groups.

| Check | Result |
| --- | --- |
| Combined Minecraft GameTests | 80 / 80 passed |
| Riftbound engine tests | 17 / 17, also passed standalone |
| Copperwake engine tests | 17 / 17, also passed standalone |
| Starfall engine tests | 27 / 27, also passed standalone |
| Convergence engine tests | 19 / 19 in the combined runtime |
| Standalone engine runs | 61 / 61 passed across the three content mods |
| Pure Java domain checks | 11,501 passed: Riftbound 4,718, Copperwake 639, Convergence 6,144 |
| Production resource validation | 470 JSON resources: 40 + 116 + 272 + 42 |
| Starfall art validation | 55 text textures; referenced models and textures resolve against pinned Minecraft assets |
| Release packaging | Exactly four remapped production jars, with verified per-jar SHA-256 |
| Fixture leakage | All ten actual GameTest source class families and three fixture-resource paths excluded |
| External dependencies | Minecraft, Fabric Loader and Fabric API remain external |
| Server EULA | Every headless GameTest configuration retains `eula = false` |

New tests cover all three encounter patterns, delayed reinforcements and blocked release, conversion/priority behavior, party scaling and eligibility, bounded persistent compass records, real disk reopen, stale/unloaded targets, border shrinking and invalid build heights, mining reselection, dimension changes, actual vanilla compass ticks, armor repair/enchantments/trims and clear-night transitions. Strengthened combined hazard tests prove the real full-set Night Vision bonus is active while Ember still deals its exact magic pulse and Tidal still pushes participants. Canonical armor tests verify immediate fall protection and preservation/expiry of externally supplied potion effects. Station tests exercise every formula and exact payment, deficient ingredients/trophies, weather/roof pauses, output overflow, changed inputs, registry-aware NBT reload, actual screen normal/shift clicks, real hopper transfer and the block-entity ticker.

A real jigsaw-generator test exposed a pre-existing Copperwake defect: `size: 0` definitions decoded and placed templates in isolation but produced no natural start pieces. All five definitions now use positive depth and still generate exactly one piece because the templates have no jigsaw connectors. Tests exercise all five natural starts at three noise-sampled Rustwild coordinates, surface-height anchoring and biome rejection. Existing three template bytes, IDs and placement grids remain unchanged. New tests also cover both landmark routes, guards, cache exhaustion and 128 bounded loot samples.

Three upgrade tests read a committed authored T23-format SNBT fixture. They load original UUID scores/circuit positions/gates through vanilla `ScoreboardState`, decode all four original item namespaces with retained counts/tool damage/name, and restore protected terrain at negative chunks and bit boundaries. This is a compatibility fixture, not a sampled user world or a literal full-process upgrade test.

The complete server output is captured at `minecraft/build/verification.log` and uploaded by CI with diagnostic logs. The pack is `minecraft/build/distributions/convergence-0.3.0-fabric-1.21.1.zip`: **384,072 bytes**, SHA-256 `7e4ab68ef89a0899e6eec2f04c7ab387f7b014f6d14acbe5dcf04f1bb6bd112d`. Its manifest records Riftbound, Starfall and Convergence 0.3.0 and Copperwake 0.3.0-alpha.1.

The package audit compares every authored/generated resource path and byte with the four release jars. Removed `StarChart` and `StarfallExpeditionGameTests` class outputs and all discarded discovery resources are absent. Canonical C02/C03 ancestry and the published `starfall_impacts` schema are retained; their earlier validation is [archived separately](VALIDATION-C02-C03.md).

The synchronized working directory repeatedly restored stale generated outputs during verification. The final build and audit ran from a fresh immutable Git archive without inherited build directories. Only the verified ZIP and full log were copied back. No environment workaround was added to repository code.

Original NeoForge Starfall is untouched and remains a separate build profile. Texture sheets and the source-derived landmark geometry preview were inspected. Desktop rendering, control clarity, multiplayer latency, long survival pacing, many-seed terrain exploration and literal process-restart playtests remain unperformed. Use a fresh test world first; landmarks appear in newly generated chunks and the compass records impacts after installation. Existing worlds made from natural dirt/stone can disable crater excavation with `craters.enabled = false`. See the play guide and module READMEs.
