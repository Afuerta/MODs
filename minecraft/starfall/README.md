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
- Use Stardust on crops for two growth pulses, or consume a Wishing Star for a temporary blessing.
- Turn crater stone into **11 building variants**: Starstone and Starstone Brick stairs, slabs
  and walls; Polished Starstone with stairs, slabs and walls; and Chiseled Starstone.
  Use a crafting table or stonecutter. Slabs yield two per stonecutting input.
- Follow six visible advancements from your first shard through a full Starsteel arsenal and a
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

[View the 32-direction compass artwork](docs/star-compass-frames.png).

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
Clear-night bonuses require open sky and apply to mining plus the primary vanilla melee strike.
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

The combined Fabric 1.21.1 headless server passed **all 18 Starfall GameTests** alongside the other
mods (**51 required tests passed** in total). Starfall tests cover the 17-block/27-item registry,
recipe outputs, safe crater placement, constructed blocks/block entities/fluids/bedrock, unloaded
terrain and the world border, compact persisted protection columns, two-pulse Stardust growth,
wish consumption and cooldown, clear-night mining and actual melee bonuses, unamplified mod
attributed damage, Fallen Star loot/Silk Touch, bounded config, shower restrictions and launch
limits, and construction placed during a meteor's flight. Tests live in `src/gametest` and are
excluded from the released mod jar.

The six Star Compass tests verify nearest selection, duplicate/cap eviction, save/reload through
a fresh world state manager, malformed saved entries, missing and unloaded targets, scheduled
inventory updates and dimension changes. The existing impact tests also verify that successful
landings are recorded and rejected impacts leave the index unchanged.

The resource validator passes **207 JSON resources and 49 text textures**, including all 11
building variants, six visible advancements and a hidden recipe unlock. Texture previews were rendered and visually checked.
Desktop/client playtesting has not been performed in this headless environment.
