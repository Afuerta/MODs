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
| Oxide Flats | Rust-colored grasses, orange haze, sparse acacia, red terracotta ground patches, granite boulders | Rust Mite groups, occasional Coil Sentries | Salvage yards, relay towers and Switchyard Depots |
| Verdigris Woods | Teal foliage and water, green fog, birch/oak woodland, moss patches and mossy boulders | More Rust Mites, scattered Coil Sentries | Salvage yards, relay towers and Siphon Gardens |
| Cinder Works | Ash-colored grass and fog, extensive basalt ground patches, blackstone boulders, dead scrub | Increased Coil Sentry weight | Relay towers, foundries and Switchyard Depots |

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
| Siphon Gardens | 35 × 19 × 31 | Four shallow still-water cisterns around a dry pump hall, green glass vault, transverse aqueduct on stone piers, two service lanes and continuous backed ladder | Basic salvage barrel, ground inspection cache and aqueduct cache; two Rust Mites and two Coil Sentries |
| Switchyard Depot | 39 × 17 × 35 | Five rail lanes and loading islands, two-floor dispatch office, internal backed ladder, signal bridge with office stair and open freight canopy | Basic salvage barrel, upper dispatch cache and cargo cache; two Rust Mites and three Coil Sentries |

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

The new Gardens use **34-chunk spacing / 14-chunk separation**, salt `39014747`,
and only the Verdigris Woods tag. Depots use **32 / 13**, salt `39014759`, and only
Oxide Flats/Cinder Works. Existing grid definitions and their salts are unchanged.
Minecraft 1.21.1 registers the initial jigsaw piece only when `size` is positive.
Earlier `size: 0` definitions decoded and their templates placed in isolation,
but generated no natural start pieces. Version 0.3 corrects **all five** starts
to `size: 1`; the templates have no jigsaw connectors, so each still produces
exactly one piece. The engine test verifies this for the three existing builds
and both new landmarks. All five starts use `size: 1`, a rigid template pool, `WORLD_SURFACE_WG` projection,
and `beard_thin` terrain adaptation. They add no global tick scan, forced chunk
loading or structures in vanilla dimensions. The new templates have a one-block
foundation and entrance floor at template y=0; ordinary surface projection joins
that floor to the terrain. Exceptional slopes can still expose foundation edges.

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

Each new landmark has **two** dedicated expedition caches plus one existing
low-tier salvage barrel. Per dedicated cache:

| Cache | Guaranteed | One bonus roll | Food |
| --- | --- | --- | --- |
| Siphon Gardens | 2–4 Memory Glass, 6–12 Scrap, 1–3 Brass Gears | 20% one Charged Core; otherwise 4–8 Redstone | 3–6 Bread |
| Switchyard Depot | 1–3 Memory Glass, 8–14 Scrap, 2–4 Brass Gears | 25% one Charged Core; otherwise 8–16 Rails | 3–6 Bread |

Each listed row is five fixed one-roll loot pools; no table includes seals,
Foreman Hearts, guild rank changes or another mod's materials. Glass replenishes
the existing contract sink. Rails occasionally offset the Artificer return-line
shipment, while its glass and other costs still apply. Loot is standard deferred
Minecraft barrel loot: the marker clears on first generation. Emptying or
replacing a barrel cannot generate another shipment. New caches appear in newly
generated structures, rather than regenerating loot at existing bases. Operator
`/place` or edited NBT can deliberately create new structures, as with vanilla.

Navigation: the Gardens' ground entrance is centered beneath the green vault.
Search the dry gallery, climb the backed ladder beside the rear pump, and use the
dry southern aqueduct lane to reach the upper barrel. At the Depot, the dispatch
door faces the front apron; its west-wall interior ladder reaches the second
floor. The north upper door and short stair connect to the bridge over the rails.
The other expedition barrel is on the raised loading platform beneath the canopy.
No jump gadget, mining, swimming or Nether gear is needed to reach any cache.

## Rebuild and inspection

From the mod directory:

```sh
python tools/generate_structures.py
python tools/validate_resources.py
```

Optional geometry illustration (Pillow required only for this preview tool):

```sh
python tools/render_expedition_landmarks.py
```

It reads the committed compressed NBT and produces
`docs/expedition-landmarks.png`. Block colors are drawn locally; vanilla textures
are neither copied nor bundled. Rails, ladders and fences are simplified cuboids,
so the image does not establish collision or in-game visual appearance.

The generator validates coordinates, full NBT round-trip equivalence, and clear
space above every loot barrel. For the new landmarks it also performs a bounded
two-block-headroom route search from the entrance, including steps and backed
ladders, and verifies access to every cache and guard. Resource validation compares
all committed NBT bytes with the generator and checks distinct placement salts,
Rustwild-only biome tags, loot links and fixed roll counts. Repeating the command produces byte-identical
compressed NBT files. All JSON uses the Minecraft 1.21.1 singular resource paths:
`structure`, `worldgen/structure`, `worldgen/structure_set`,
`worldgen/template_pool`, and `loot_table/chests`.

Useful operator checks after loading the mod in a fresh test world:

```mcfunction
/execute in copperwake:rustwild run locate biome copperwake:verdigris_woods
/execute in copperwake:rustwild run locate structure copperwake:salvage_yard
/execute in copperwake:rustwild run locate structure copperwake:relay_tower
/execute in copperwake:rustwild run locate structure copperwake:foundry
/execute in copperwake:rustwild run locate structure copperwake:siphon_gardens
/execute in copperwake:rustwild run locate structure copperwake:switchyard_depot
/execute in copperwake:rustwild run place structure copperwake:relay_tower
```

Headless engine tests also construct all five production jigsaw starts against the
Rustwild noise generator at three coordinates, compare their ground level with
the actual generator height sample, and verify biome rejection and single-piece
bounds. Template tests inspect real placed blocks, ladder/headroom, cistern
containment and barrel NBT, consume the two special caches, and confirm they stay
empty after reopening/replacement. Loot tables are sampled at 64 seeds each.

The serialized resources and generator checks do not substitute for an in-game
visual and combat playtest. Verify natural spacing, terrain joining, ladder
access, guards, container loot and return travel in an expendable world before
release. New generation appears in newly generated chunks.
