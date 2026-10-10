# Convergence 0.2.0 validation

Recorded on 2026-10-10 with Java 21, Minecraft 1.21.1 and the pinned Fabric toolchain.

The complete root command `build combinedGameTest modpack` passed: **65 actionable tasks, BUILD SUCCESSFUL**. The combined server loaded all four production mods and their four separate test mods.

| Check | Result |
| --- | --- |
| Combined Minecraft GameTests | 45 / 45 passed |
| Riftbound engine tests | 12 / 12, also passed standalone |
| Copperwake engine tests | 13 / 13, also passed standalone |
| Starfall engine tests | 12 / 12, also passed standalone |
| Convergence engine tests | 8 / 8 in the combined runtime |
| Pure Java domain checks | 10,696 passed: Riftbound 4,015, Copperwake 639, Convergence 6,042 |
| Production resource validation | 349 JSON resources: 40 + 106 + 171 + 32 |
| Release packaging | Four remapped production jars; source/test jars excluded |
| Fixture leakage | Every actual GameTest source class family and test structure excluded |
| Dependency packaging | Fabric Loader, Fabric API and the Minecraft game remain external |
| Server EULA | Every headless GameTest configuration retains `eula = false` |

The tests exercise safe and rejected meteor impacts, provenance save/load, night mining and actual melee, unrelated mod damage, meteor budgets, wishes, Stardust, registry/recipe loading, guild progression, gadget costs/cooldowns, trial enrollment and cleanup, every aspect hazard, attunement payment, once-only victory rewards, atomic delivery, progression gates, two full commission circuits, recipe discovery, and actual main-hand repair interaction with an offhand Bow.

The full server output is captured by CI as `minecraft/build/verification.log`, alongside available per-module logs. The installable ZIP is `minecraft/build/distributions/convergence-0.2.0-fabric-1.21.1.zip`; its manifest and checksums record the exact four jars.

These results cover the Fabric suite. The original NeoForge Starfall import had a separate successful GitHub Actions run before this integration and remains a separate build profile.

Desktop rendering, animation feel, audio, controls, multiplayer latency and long survival pacing have not been human-playtested. The alpha is intended for an initial fresh-world playtest. Starfall cannot identify pre-installation constructions made entirely from natural dirt or stone; existing worlds can disable crater excavation with `craters.enabled = false`. See the play guide and module READMEs.
