# Starfall: design document

> *When night falls, so do the stars.*

Starfall is a NeoForge 1.21.1 mod about watching the night sky. Stars streak down near players,
punch glowing craters into the landscape, and leave behind star-metal, stardust and the occasional
wish. Everything in the mod grows out of one loop:

```
  night falls ──▶ a star streaks down nearby ──▶ chase it (compass, direction message)
       ▲                                                    │
       │                                                    ▼
  stronger at night ◀── craft starsteel, stardust, ◀── mine the crater
  (Starlit gear,        wishes, altar infusions          (shards, ore, wish chance)
   constellations)
```

## Design pillars

1. **Look up.** The sky is the main event. Stars, showers and constellations reward players who
   are outside at night instead of hiding from it.
2. **Chase, don't grind.** Resources come from *events* (a star fell over there!) rather than from
   strip-mining. Every star should feel like a small adventure.
3. **Night is your time.** Starfall gear is good in daylight and great under a clear night sky
   ("Starlit"). That flips vanilla's "night is dangerous" into "night is opportunity".
4. **Vanilla-friendly.** Respects vanilla balance (starsteel sits between diamond and netherite), uses
   vanilla tags and conventions, and plays nicely with other mods (`c:` tags).

## What exists today (v0.1.0)

| Thing | Type | Notes |
|---|---|---|
| Falling stars | World event | Each second of clear night, every player has a 1-in-400 chance (config) of a star falling 24–64 blocks away. Two-second particle streak visible from 300+ blocks, action-bar message with the compass direction. |
| Crater | Terrain | Radius 2–3 bowl, lined with Starstone (some Starstone Ore), with a Fallen Star in the middle. Never touches bedrock, block entities or unloaded chunks. Shockwave deals 6 damage (`starfall:falling_star` damage type). |
| Fallen Star | Block | Light 15, animated texture, particles. Burns you if you walk on it without sneaking. Drops 2–4 Star Shards (Fortune), 1–3 Stardust, 25% Wishing Star. Silk Touch keeps the block. |
| Starstone / Starstone Bricks | Blocks | Crater stone and its brick variant. |
| Starstone Ore | Block | Drops 1–2 Star Shards (Fortune), 2–5 XP, needs an iron pickaxe, faint glow. |
| Star Shard | Material | 1 shard → 2 Stardust. 4 shards + 1 iron ingot → Starsteel Ingot. |
| Stardust | Material / tool | Super bone meal: two growth pulses, always succeeds. |
| Starsteel Ingot / Block | Material | Beacon base and payment, `c:ingots/starsteel`. |
| Starsteel tools | Tools | 1200 durability, speed 8.5, enchantability 18. **Starlit:** +50% mining speed and +25% melee damage under a clear night sky. |
| Wishing Star | Consumable | Random helpful effect for 3 minutes (10% chance of level II). 8 Stardust + 1 gold ingot, or found in fallen stars. |
| Star Lantern | Block | Light 15, made from glass and stardust. |
| `/starfall summon [pos]` | Command | Drops a star on demand (op level 2). |
| Server config | Config | `serverconfig/starfall-server.toml`: enable/disable, chance, distances, clear-sky rule, craters, crater size. |
| GameTests + CI | Tooling | Every PR builds the mod, runs the in-game tests and uploads the jar. |

## Roadmap

Each item is (or will become) a GitHub issue. `TASKS.md` tracks who is working on what.

### Phase 1: Polish the core loop
- **Starstone building set**: stairs, slabs, walls, polished and chiseled starstone, stonecutter recipes.
- **Advancements**: "Look Up" (see a falling star), "Catch a Falling Star" (mine one), "Make a Wish",
  "Starlit Arsenal" (all starsteel tools), "Heavenly Shower" (survive a Starfall Night).
- **Fallen stars cool down**: a `heat` block state (3→0) driven by random ticks. A hot star can set
  nearby flammables alight. Cooling turns it into a **Burnt-out Star** (no light, fewer shards, no
  wish), so players are rewarded for chasing stars quickly.
- **Debug commands**: `/starfall shower`, `/starfall list`, `/starfall cool <pos>`.
- **Config polish**: dimension allowlist, config screen translations, client particle density.

### Phase 2: Tools for the hunt
- **Star Compass**: points to the nearest recent impact (impacts stored in `SavedData`).
- **Starsteel armor** with a set bonus: while Starlit, Night Vision and no fall damage.
- **FallingStar entity**: a real entity with a glowing trail renderer instead of particles. It can
  hit mobs on the way down and lands where its path actually meets terrain.
- **Starfall Nights**: 1 in 10 nights is a meteor shower (8× star rate, announced at dusk,
  purple-tinted sky, unique advancement).
- **Custom sounds**: incoming whoosh, impact boom, wish chime.

### Phase 3: Magic of the night
- **Astral Altar**: block entity + GUI. Infuses items using stardust under the open night sky.
  Data-driven `starfall:astral_infusion` recipe type (e.g. Wishing Star + feather → Star Feather,
  which grants slow falling on demand).
- **Constellations**: on Starlit nights, look through a spyglass at specific angles in the sky to
  chart one of six constellations (the Lantern, the Shard, the Wisp, the Crown, the Arrow, the
  Anvil). Charts unlock altar recipes and grant small permanent buffs.
- **Data-driven wishes**: wish outcomes become a weighted JSON table with rare results (a shower of
  shards, a friendly wisp, clear weather, a few seconds of flight).
- **Star Wisp**: small glowing flying mob that gathers around fallen stars at night, drops
  stardust, and follows players holding stardust.

### Phase 4: The wider world
- **Ancient craters**: rare worldgen structure with overgrown, cooled craters and a buried chest.
- **Star Bow & Starfall Arrows**: at night, an arrow hit calls down a tiny star (light, no crater).
- **Stargazer's Journal**: in-game guide book given on the first star a player sees.
- **Compat**: JEI/EMI categories for altar recipes, Jade tooltip showing star heat.
- **Data generators**: move hand-written JSON into NeoForge datagen once the content settles.
- **Release pipeline**: tagged builds published to GitHub Releases (Modrinth/CurseForge later).

## Balance notes

- Star rate: default 1/400 per player-second ≈ 1.25 stars per player per night (a night is ~500 s).
  Showers multiply this by 8.
- Shards per star ≈ 3 (fallen star) + ~4 (ore in the crater lining) → about 1.5 starsteel ingots per
  star. A full tool set needs 12 ingots (= 48 shards), roughly 6–8 stars.
- Starsteel: 1200 uses (diamond 1561, netherite 2031), speed 8.5 (diamond 8, netherite 9),
  enchantability 18 (gold 22, diamond 10). The Starlit bonus is the real draw.

## Idea parking lot

Ideas that are not scheduled yet. Add yours here (and open an issue if it's ready to build).

- Stardust trails: sprinkle stardust on the ground as a faint glowing path (like redstone dust).
- Star-forged netherite: smithing upgrade from starsteel + netherite into an "Astral" tier.
- "Falling star" fishing: rare chance to fish up a star shard at night.
- Villager trade: a Stargazer profession at a telescope workstation.
- A star that lands in water hisses and leaves a "sea glass" variant of the crater.
