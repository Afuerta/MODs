# Copperwake validation

## Version 0.3.0-alpha.1 expedition expansion

- Resource validation passed **116 production JSON resources**, **16 modeled
  items**, **13 recipes** and **14 progression advancements**. The new resources
  are two bounded chest loot tables and eight Rustwild-only generation files.
- Both new NBT templates pass complete binary round-trip, exact deterministic
  gzip comparison with authored source, coordinate checks, clear barrel lids,
  and entrance-to-cache/guard route validation. The three original NBT files
  regenerate without byte changes.
- Standalone Fabric build passed against the pinned 1.21.1 mappings, including
  production/common/client and GameTest source compilation. **All 17 headless
  Minecraft GameTests passed**, retaining the original 13 checks. Four new
  engine checks cover placed templates and persistent guard counts, dry entrances,
  backed ladders and landings, contained cisterns, actual one-time barrel loot,
  empty reopening/replacement, 128 seeded loot outcomes, and production Rustwild
  noise-generator jigsaw starts for all five landmarks with surface anchoring and
  biome rejection. All five structures create exactly one piece at each of three
  sampled coordinates; their ground level matches the production noise terrain.
  The unchanged domain harness also passed **639 checks**. The complete pack's
  combined verification is recorded in the root release validation.
- The first actual-start check exposed the old zero-depth jigsaw problem:
  Minecraft 1.21.1 omits the start piece when `size` is zero. All five definitions
  now use positive depth one with no connectors. Tests require one actual child
  for every landmark, instead of treating template placement as natural-generation
  verification. Original IDs, templates, biomes, salts and grid spacing are kept.
- The deterministic guild domain/catalog and both devices retain their existing
  definitions and rank thresholds. No loot grants a guild completion, Foreman
  Heart/Seal or another mod's gated material.
- `docs/expedition-landmarks.png` was generated from committed NBT and inspected
  as a geometry illustration. It does not verify Minecraft textures, client
  rendering, combat feel or natural terrain joins.

Several real seeds, steep terrain and human survival traversal remain necessary
playtests. Headless template/start tests establish the authored layout and height
projection; they do not establish that every terrain intersection is polished.

## Version 0.2.0-alpha.1 expansion checks

- Main/common/client source and GameTest source compilation passed against the
  pinned Minecraft 1.21.1/Fabric/Yarn APIs.
- The dependency-free Java 21 progression harness passed **639 checks**, including
  preservation of the first 18 legacy progression positions, every one of 22
  contracts, expanded late rotation, both rank boundaries, economy sinks,
  immutability and integer saturation.
- Python resource validation passed **106 production JSON resources**, **16 modeled
  items**, **13 recipes**, and **14 progression advancements**, including both new
  gadgets and all 22 translated contract titles/descriptions. Referenced vanilla
  textures were checked against the official cached Minecraft client JAR.
- **All 13 Copperwake headless Minecraft GameTests passed** in the combined
  four-mod engine run, including the original ten integration checks and three
  new checks: every contract's real payment/reward in sequence; Survey Flare
  rank/fuel/radius/cap/passive exclusion/non-damage/cooldown; Field Repairer partial
  payment/durability/components/clamp/cooldown/hand placement. The initial combined
  run completed 44 tests and reported six failures in other mods; the complete
  pack's subsequent validation is recorded separately by its release workflow.
- No Copperwake construct entity or renderer behavior changed in this expansion.

These expansion checks do not replace a real client inspection or human survival
playtest. The normal-server Rustwild smoke below was recorded for the unchanged
foundation; it was not rerun as a claim about the new field devices.

## Recorded 0.1.0-alpha.1 foundation checks

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

Use `./gradlew runGameTest` to run GameTests. The separate `runRuntimeSmoke` task runs a normal
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
