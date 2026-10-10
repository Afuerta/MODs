# Starfall for Fabric

*When night falls, so do the stars.*

Starfall adds a reason to explore the night in Minecraft Java **1.21.1**. Falling stars land
near players, leaving glowing Starstone craters with a hot Fallen Star at the center. This
Fabric edition uses the same content IDs and text pixel art as the original NeoForge mod.

## Playing

- Watch for the falling-star direction message, then follow its particle trail.
- Craft a **Star Compass** from a compass and four Star Shards. It points to the nearest
  remembered Fallen Star in your current dimension and updates as you travel.
- Mine Starstone Ore and Fallen Stars for Star Shards, Stardust and a chance of a Wishing Star.
  Fallen Stars hurt players who stand on them without sneaking.
- Turn shards and iron into Starsteel. The five Starsteel tools gain mining and attack bonuses
  under a clear night sky.
- Forge a full **Starsteel armor** set to gain Night Vision and fall protection while Starlit.
  Each piece uses normal armor crafting, enchanting, trimming and Starsteel Ingot repairs.
- Use Stardust on crops for two growth pulses, or consume a Wishing Star for a temporary blessing.
- Turn crater stone into **11 building variants**: Starstone and Starstone Brick stairs, slabs
  and walls; Polished Starstone with stairs, slabs and walls; and Chiseled Starstone.
  Use a crafting table or stonecutter. Slabs yield two per stonecutting input.
- Follow seven visible advancements from your first shard through a full Starsteel arsenal and a
  collection of celestial building materials.
- Meteor showers increase the star rate for one night, with a configurable impact limit.

## Installation

Use **Minecraft 1.21.1**, **Fabric Loader 0.16.14 or later**, **Fabric API for 1.21.1**, and
**Java 21**. Put the built `starfall-<version>.jar` in the client's and server's `mods` folders.
The Fabric edition runs alone or beside the Fabric editions of Riftbound and Copperwake.
Use one edition of Starfall in a modpack; the original project in `../../starfall` uses NeoForge.

## Recipes

| Result | Ingredients |
|---|---|
| Star Compass | 4 Star Shards surrounding a Compass (plus shape) |
| 2 Stardust | 1 Star Shard |
| Starsteel Ingot | 1 Iron Ingot + 4 Star Shards |
| Starsteel tools | Standard tool shapes using Starsteel Ingots and sticks |
| Starsteel armor | Standard armor shapes; 5 / 8 / 7 / 4 Starsteel Ingots |
| Wishing Star | 8 Stardust surrounding a Gold Ingot |
| 2 Star Lanterns | Glass in a plus shape around Stardust |
| 4 Starstone Bricks | 4 Starstone in a square |
| 4 Polished Starstone | 4 Starstone Bricks in a square, or stonecut Starstone |
| Chiseled Starstone | 2 Starstone Slabs stacked vertically |
| Stairs / slabs / walls | Standard building shapes or a stonecutter |
| Star Shard | Smelt or blast Starstone Ore |

## Star Compass

Successful impacts are remembered across server restarts, with at most **64 positions per
dimension**. The oldest recorded impact is forgotten when the limit is reached. Mining or
replacing a Fallen Star removes its record; the compass retargets within one second. Existing
stars from before this update are not automatically indexed. The recipe unlocks when you obtain
a Star Shard, including in worlds where the first-shard advancement was already completed.

The compass points toward the nearest remembered star, including one in an unloaded chunk,
without loading terrain. An unloaded target remains a remembered location until that area loads
and can be checked. If no target exists in the current dimension, the needle spins and the
tooltip says no star is remembered. Changing dimension clears the old dimension's target.
Player-placed Fallen Stars do not create new impact records.
Positions outside the current world border or build limits are pruned before any chunk lookup;
a shrinking border cannot leave the compass pointing toward an unreachable recorded star.

[View the 32-direction compass artwork](docs/star-compass-frames.png).

## Starsteel armor

[View the original armor artwork and texture layout](docs/starsteel-armor.png).

Forge all four pieces with **24 Starsteel Ingots** total (96 Star Shards and 24 Iron Ingots).
Obtaining an ingot unlocks the four recipes, including for players with existing advancement
progress. Equip the complete set in its armor slots; pieces held in your hand do not count.

| Piece | Ingots | Armor points | Durability |
|---|---:|---:|---:|
| Helmet | 5 | 3 | 297 |
| Chestplate | 8 | 7 | 432 |
| Leggings | 7 | 6 | 405 |
| Boots | 4 | 3 | 351 |

The complete set gives **19 armor points and 4 toughness**. Each piece has enchantability 18
and repairs with Starsteel Ingots. Vanilla armor enchantments and armor trims are supported.

**Starlit set bonus:** wear all four pieces outside under a clear Overworld sky between
13,000 and 23,000 world-time ticks. Night Vision refreshes once per second without flickering.
Fall-type damage, including landing on pointed dripstone, is prevented while the conditions
hold. The set does not prevent fire, melee, projectile or void damage.

Removing a piece, moving under cover, rain, dawn or leaving the Overworld ends fall protection
immediately. Night Vision naturally fades within 13 seconds; longer, stronger and infinite
effects from potions or other mods are preserved. This avoids deleting another source's effect.
Collecting all four pieces earns **Forged in Starlight** and 50 XP once.

## Commands

`/starfall status` reports event activity. Operators with permission level 2 can use
`/starfall summon` to request a falling star nearby and `/starfall shower` to start a meteor shower.
Events require loaded, suitable terrain; forcing an event does not bypass impact safety checks.

## Server configuration

The Fabric edition uses `config/starfall.json`. Restart the server after changing it.

| Section | Key | Purpose |
|---|---|---|
| `falling_stars` | `enabled` | Enable ordinary falling stars |
| `falling_stars` | `chance_per_second` | Chance per eligible player each second |
| `falling_stars` | `min_distance`, `max_distance` | Impact distance from the player |
| `falling_stars` | `require_clear_sky` | Require clear weather for natural events |
| `craters` | `enabled` | Place terrain craters at impacts |
| `craters` | `max_radius` | Maximum crater radius |
| `showers` | `enabled` | Enable meteor showers |
| `showers` | `chance_per_night` | Chance that a new night becomes a shower |
| `showers` | `multiplier` | Star rate multiplier during a shower |
| `showers` | `max_impacts_per_night` | Limit event impacts in one night |

Impacts preflight the entire footprint before changing terrain. They reject fluids, block entities,
bedrock, unloaded chunks, positions outside the world border, and blocks outside a strict natural
terrain whitelist. Player block placement marks protect entire vertical columns persistently using
256 bits per touched chunk. Marks remain after mining a block, favoring safety over star availability.

**Existing worlds:** natural-material builds created before installation (for example an old dirt
house) cannot be distinguished from generated terrain. Set `craters.enabled` to `false` when this
matters; this retains safe, surface-only star placement. The whitelist also rejects wood, stone bricks,
farmland and modded blocks, so many wooded or built areas will not receive stars.

A star takes two seconds to land and repeats the complete safety check at impact. A blocked star
fades without damage. Meteor flight, shower selection and the per-night launch budget reset on a
server restart. At most eight stars can be in flight, and the night budget includes operator summons.
The Starsteel tool bonuses require open sky and apply to mining plus the primary vanilla melee strike.
They do not increase projectiles, sweep strikes or damage from other mods such as an Arc Gauntlet.

## Building and resource checks

```sh
python3 tools/validate_resources.py
bash ./gradlew runGameTest build
```

The build renders `src/main/pixelart/*.px` into PNG textures in its generated-resource directory.
PNG files belong in build output. Edit the text sprites to change the art. To view a texture
contact sheet, install Pillow and run `python3 tools/px_render.py`.

## Verified behavior

Starfall has **27 dedicated-server GameTests** for the 17-block/31-item registry,
recipe outputs, safe crater placement, constructed blocks/block entities/fluids/bedrock, unloaded
terrain and the world border, compact persisted protection columns, two-pulse Stardust growth,
wish consumption and cooldown, clear-night mining and actual melee bonuses, unamplified mod
attributed damage, Fallen Star loot/Silk Touch, bounded config, shower restrictions and launch
limits, and construction placed during a meteor's flight. Tests live in `src/gametest` and are
excluded from the released mod jar.

The seven Star Compass tests verify nearest selection, duplicate/cap eviction, save/reload through
a fresh world state manager, malformed saved entries, missing and unloaded targets, scheduled
inventory updates, dimension changes and shrinking-border/build-limit pruning without target loads.
The existing impact tests also verify that successful
landings are recorded and rejected impacts leave the index unchanged.

Eight Starsteel armor tests cover real shaped crafting and costs, material stats, repair and
enchantment tags, exact equipment slots, night boundaries, weather/roof/dimension exclusions,
longer/stronger/infinite potions, actual fall and ordinary damage, registered server tick events,
and the natural expiry of Night Vision after equipment removal.

The resource validator passes **272 JSON resources and 55 text textures**, including all 11
building variants, seven visible advancements and five hidden recipe unlocks. Texture previews were rendered and visually checked.
Desktop/client playtesting has not been performed in this headless environment.
Current pack verification is recorded in [the shared validation record](../../docs/VALIDATION.md);
earlier independent C02/C03 results are preserved in [their historical record](../../docs/VALIDATION-C02-C03.md).
