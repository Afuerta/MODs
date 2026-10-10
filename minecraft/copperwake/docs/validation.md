# Copperwake 0.1.0-alpha.1 validation

Completed on 2026-10-10 UTC against Minecraft 1.21.1, Fabric Loader 0.16.14,
Fabric API 0.116.17+1.21.1 and Java 21.

## Executed and passed

- Full Fabric/Loom compile and remapped installable JAR build, including all client
  renderer/model classes.
- **421 pure Java domain assertions**: deterministic contract order, all contract
  reachability, immutable inputs, rank boundaries, invalid inputs and integer saturation.
- **10 headless Minecraft GameTests**: production dimension definition decoding;
  live biome/structure/pool registries; all recipes and loot tables; placement and
  deferred barrel loot for all three real structure NBTs; all-or-nothing delivery
  across inventory/offhand; no duplicate payout on an unpaid retry; promotions and
  surplus supplies; gadget rank/fuel/cooldown; rejected travel; landing hazards,
  headroom and a fractional world border.
- **Normal dedicated-server runtime check**: actual Rustwild world creation; full
  terrain generation in three chunks; Survey Key entry and saved home; cooldown;
  valid boss summon; duplicate-summon rejection without consuming a seal; guaranteed
  Foreman Heart after killing the boss; actual Arc Gauntlet damage and fuel use;
  keyless return with inventory/rank preserved and falling velocity cleared.
- Python resource validation: **98 production JSON resources**, custom references,
  all vanilla texture paths, voxel model bounds, recipes, language, loot and worldgen
  links. The extra test-mod manifest is not a production resource.
- Structure generator: binary NBT round-trip checks, byte-identical regeneration,
  valid vanilla block/feature references, and geometry previews rendered from the
  three authored templates.
- Final package inspection: valid mod metadata, correct version, production
  classes/resources present, and no test-mod classes in the installable JAR.

Commands used (standard local equivalents):

```sh
python tools/validate_resources.py --minecraft-jar /path/to/minecraft-client.jar
./gradlew build runRuntimeSmoke --max-workers=1
```

The build runs GameTests. The separate `runRuntimeSmoke` task runs a normal
dedicated server because Minecraft's GameTest server intentionally constructs its
own flat-world dimension set and excludes data-pack-defined custom dimensions.
These are complementary tests, not interchangeable server-start claims.

For the optional runtime check, prepare `build/run/runtimeSmoke/server.properties`
with a local-only offline test server and a disposable world. Its test entrypoint
places test platforms, creates a simulated player, runs assertions, and stops the
server. The task requires Minecraft's normal EULA acceptance in that directory;
it does not set that acceptance automatically. Never point this test at a player
world. A successful run writes `copperwake-smoke.ok`, which the Gradle task verifies.

The execution environment required a scratch-only Loom capability workaround for
unavailable UNIX sockets and an isolated Gradle cache. Neither is part of the mod
or required on an ordinary supported development machine. An unreachable Mojang
public-key endpoint logged a warning during local offline tests; both server runs
completed their assertions successfully.

## Remaining release checks

- Real client inspection of models, textures, animation, sound and readability.
- Fresh survival pacing from first key through both promotions and first boss.
- Human solo/co-op combat playtests, including real latency and accessibility.
- Several seeds and terrain slopes to tune natural landmark frequency and access.
- Save/restart/reload behavior with real players, multiplayer return positions,
  and inventory-overflow pickups under real network conditions.

The current build is an alpha. Automated success does not establish that combat
feels balanced or that every naturally generated landmark is visually polished.
