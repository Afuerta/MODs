# Rustwild world generation

Copperwake adds the separate `copperwake:rustwild` dimension. It uses Minecraft
1.21.1's `minecraft:overworld` noise settings, cave carvers, ore distribution and
384-block height range. A custom multi-noise source selects **three new land
biomes**. Low continentalness maps to vanilla deep lukewarm ocean; this keeps the
landmark biome tags out of open seas. Lakes and occasional shore intersections
remain possible with vanilla jigsaw surface projection.

The dimension has daylight, weather, safe beds, and normal resource collection.
The root mod's travel item controls entry and return; these data files do not
overwrite the Overworld, Nether, End, or another mod's world generation.

| Biome | Landscape and atmosphere | Encounters | Landmarks |
| --- | --- | --- | --- |
| Oxide Flats | Rust-colored grasses, orange haze, sparse acacia, red terracotta ground patches, granite boulders | Rust Mite groups, occasional Coil Sentries | Salvage yards and relay towers |
| Verdigris Woods | Teal foliage and water, green fog, birch/oak woodland, moss patches and mossy boulders | More Rust Mites, scattered Coil Sentries | Salvage yards and relay towers |
| Cinder Works | Ash-colored grass and fog, extensive basalt ground patches, blackstone boulders, dead scrub | Increased Coil Sentry weight | Relay towers and foundries |

Biome monster tables emphasize the new machines while retaining small spider
and skeleton populations. Vanilla ore, caves, food animals, and surface water
support survival and recovery between expeditions. Ground patches are actual
placed block features; the palette changes are more than biome tint alone.

## Original architectural landmarks

All structures are authored in `tools/generate_structures.py`. They use original
voxel geometry and vanilla block palettes. No third-party schematic, mod code,
texture, or player build is bundled. The generator uses Python's standard
library, deterministic gzip headers, and Minecraft 1.21.1 structure NBT
(`DataVersion: 3955`). It round-trips every tag through its own binary reader
before writing a file.

| Landmark | Bounding box | Playable spaces | Rewards and guards |
| --- | --- | --- | --- |
| Salvage Yard | 29 × 20 × 27 | Open fenced yard, entry arch, two walk-in cargo sheds, giant cantilever crane, rail lane and salvage piles | Three salvage barrels; two Rust Mites and one Coil Sentry |
| Relay Tower | 19 × 31 × 19 | Ground control room, three observation decks, continuous supported ladder, copper coil rings and antenna | One salvage barrel and two relay caches; one Rust Mite and two Coil Sentries |
| Foundry | 31 × 28 × 29 | Large entrance and factory hall, glowing central engine, furnace banks, wraparound upper catwalk, two backed ladders, sawtooth roof and unequal twin chimneys | Salvage barrel, relay barrel and upper foreman cache; two Rust Mites and two Coil Sentries |

Each structure is a one-piece rigid jigsaw start, projected to the world surface
with beard-thin terrain adaptation. Authored interior air clears rooms and
ladder shafts; block foundations provide usable floors on modest slopes. The
templates include persistent guards, so the first visit has opponents even in
daylight. There is no boss entity or hidden automatic boss summon in a template.

Random-spread placement uses separate salts. Candidate grid spacing is 24 chunks
for yards, 30 for relay towers, and 38 for foundries; corresponding minimum
separations are 10, 12, and 16 chunks. These are placement-grid settings, **not a
promise of one landmark every X blocks**: biome availability and terrain affect
successful starts. Foundries are intentionally rarer and confined to Cinder
Works, encouraging exploration rather than repeated farming at the spawn point.

## Reward progression

Yard barrels supply Scrap, Brass Gears, basic survival resources, and a small
chance of Memory Glass or a Charged Core. Relay caches guarantee Memory Glass
and can provide Charged Cores. The foundry's **single upper cache** guarantees a
Foreman Seal and supplies higher material quantities. Ground-floor foundry loot
uses lower-tier tables, so the building does not award three seals.

No chest table contains a boss heart. The Foundry Foreman remains summon-only,
under the root mod's summon-item rules. World-generation loot uses these
registered mod item IDs: `scrap`, `brass_gear`, `memory_glass`, `charged_core`,
and `foreman_seal`.

## Rebuild and inspection

From the mod directory:

```sh
python tools/generate_structures.py
```

The generator validates coordinates, full NBT round-trip equivalence, and clear
space above every loot barrel. Repeating the command produces byte-identical
compressed NBT files. All JSON uses the Minecraft 1.21.1 singular resource paths:
`structure`, `worldgen/structure`, `worldgen/structure_set`,
`worldgen/template_pool`, and `loot_table/chests`.

Useful operator checks after loading the mod in a fresh test world:

```mcfunction
/execute in copperwake:rustwild run locate biome copperwake:verdigris_woods
/execute in copperwake:rustwild run locate structure copperwake:salvage_yard
/execute in copperwake:rustwild run locate structure copperwake:relay_tower
/execute in copperwake:rustwild run locate structure copperwake:foundry
/execute in copperwake:rustwild run place structure copperwake:relay_tower
```

The serialized resources and generator checks do not substitute for an in-game
visual and combat playtest. Verify natural spacing, terrain joining, ladder
access, guards, container loot and return travel in an expendable world before
release. New generation appears in newly generated chunks.
