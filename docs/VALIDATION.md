# Convergence 0.2.0 validation

Recorded on 2026-10-10 with Java 21, Minecraft 1.21.1 and the pinned Fabric toolchain.

GitHub CI independently passed on implementation commit `a4dcdbe7a3574fa1f52c1e88db967f8aad730ba8`: [combined PR build](https://github.com/Afuerta/MODs/actions/runs/38024871080), [Riftbound](https://github.com/Afuerta/MODs/actions/runs/38024871023), [Copperwake](https://github.com/Afuerta/MODs/actions/runs/38024871008), and [original NeoForge Starfall](https://github.com/Afuerta/MODs/actions/runs/38024871076). The verified GitHub pack is byte-identical to the local pack, SHA-256 `4a3a4589e6ca41272f86c2c3112c4eee20bd57feb869f7c7a1ceed5ee6e5ec86`.

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

## C02: Persistent Star Compass

The Fabric Starfall update passed the complete `build combinedGameTest modpack` workflow
on implementation commit `94a901bce41a89972be02780622ab7f4cb2b1997`
([GitHub verification](https://github.com/Afuerta/MODs/actions/runs/38036442844),
[PR #4](https://github.com/Afuerta/MODs/pull/4)).

- Combined Minecraft server: **51 / 51 required tests passed**.
- Standalone Starfall: **18 / 18 passed**, including six new compass tests.
- Standalone Copperwake: **13 / 13 passed**; Riftbound: **12 / 12 passed**.
- Pure domain checks: **10,696 passed** across the existing modules.
- Current Starfall resource validation: **207 JSON files, 49 text textures**, including the
  subsequent independent recipe-unlock advancement for players with existing first-shard progress.
- The four-mod installable pack was produced, with test fixtures excluded from release jars.

The compass tests exercise actual disk save/reload using a fresh `PersistentStateManager`,
nearest-target ties, 64-entry retention, duplicate and malformed records, mined/replaced targets,
unloaded terrain, scheduled inventory updates and changing dimension. Directional model
thresholds and cardinal sprites were checked against the official Minecraft 1.21.1 assets.
The recipe-unlock follow-up is covered by resource validation and the PR's final CI run.

Builds ran on GitHub because this container rejects Loom's Unix-socket capability probe.
No dependency or permission bypass was used. Desktop/client rendering and multiplayer latency
still require human playtesting. Existing pre-update stars are intentionally not backfilled.
