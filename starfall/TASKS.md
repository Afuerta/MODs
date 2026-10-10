# Starfall task board

This is the shared backlog for everyone working on Starfall (ChatGPT, Claude, and @Afuerta).
Rules are in [`AGENTS.md`](AGENTS.md). The short version: claim a task by editing its row,
work on a branch named `<agent>/<task-id>-<slug>` (for example `chatgpt/T01-starstone-building-set`),
open one PR per task, keep CI green, and mark the row `done` in the same PR.

If GitHub issues exist for these tasks, keep their numbers in the Issue column. If not, the task
IDs (T01, T02, ...) are the reference.

**Status:** `ready` (can start) · `blocked` (waiting on another task) · `in progress` · `review` · `done`
**Size:** S ≈ an afternoon · M ≈ a day · L ≈ a few days · XL ≈ a week+

## Board

| ID | Task | Phase | Size | Depends on | Owner | Status | Issue |
|---|---|---|---|---|---|---|---|
| T00 | Foundation: falling stars, craters, starsteel, wishes, CI, GameTests | 0 | L | – | Claude | review | |
| T01 | Starstone building set | 1 | M | T00 | ChatGPT | ready | |
| T02 | Advancements tree | 1 | S | T00 | ChatGPT | ready | |
| T03 | Fallen stars cool down (heat → Burnt-out Star) | 1 | M | T00 | ChatGPT | ready | |
| T04 | Debug commands: shower, list, cool | 1 | S | T00 (T03 for `cool`) | ChatGPT | ready | |
| T05 | Config polish + config screen | 1 | S | T00 | ChatGPT | ready | |
| T06 | Impact registry (SavedData) + Star Compass | 2 | M | T00 | ChatGPT | ready | |
| T07 | Starsteel armor + Starlit set bonus | 2 | L | T00 | ChatGPT | ready | |
| T08 | FallingStar entity with trail renderer | 2 | L | T00 | ChatGPT | ready | |
| T09 | Starfall Nights (meteor showers) | 2 | M | T00 (T08 nice) | ChatGPT | ready | |
| T10 | Custom sounds | 2 | S | T00 | ChatGPT | ready | |
| T11 | Data-driven wishes + rare wishes | 3 | M | T00 | ChatGPT | ready | |
| T12 | Star Wisp mob | 3 | L | T00 | ChatGPT | ready | |
| T13 | Astral Altar + `astral_infusion` recipes | 3 | XL | T00 | ChatGPT | ready | |
| T14 | Constellations (spyglass charting) | 3 | XL | T13 | ChatGPT | blocked | |
| T15 | Ancient craters (worldgen) | 4 | L | T03 | ChatGPT | blocked | |
| T16 | Star Bow & Starfall Arrows | 4 | M | T00 | ChatGPT | ready | |
| T17 | Art pass: tools, 3D fallen star model, mod logo | 4 | M | T00 | ChatGPT | ready | |
| T18 | Stargazer's Journal (guide book) | 4 | M | T02 | ChatGPT | blocked | |
| T19 | JEI / EMI / Jade integration | 4 | M | T13, T03 | ChatGPT | blocked | |
| T20 | Migrate JSON to data generators | 4 | L | T01–T07 merged | ChatGPT | blocked | |
| T21 | Release pipeline (GitHub Releases on tag) | 4 | S | T00 | ChatGPT | ready | |
| T22 | Stardust fires NeoForge's bonemeal event | 1 | S | T00 | ChatGPT | ready | |

Suggested order for ChatGPT: T01 → T02 → T03 → T06 → T04 → T07 → T05 → T08 → T09 → T11 → T13 →
then anything else. Claude is available to review PRs or take any task when asked.

---

## Task details

Every task also needs: lang entries for new text, `.px` textures for new art, a GameTest where the
behavior can be tested headless, and an update to the feature table in `DESIGN.md` and `README.md`.

### T00: Foundation (done in the first PR)
Falling-star night event, craters, Fallen Star / Starstone / Starstone Ore / Starstone Bricks /
Starsteel Block / Star Lantern, Star Shard, Stardust, Starsteel Ingot, Wishing Star, Starsteel tools
with the Starlit bonus, `/starfall summon`, server config, creative tab, recipes, loot, tags,
6 GameTests, CI workflow, text-based textures.
**Acceptance:** CI green on the first PR. If the first CI run finds compile errors, fixing them is the
top priority (any agent).

### T01: Starstone building set
- Add `polished_starstone`, `chiseled_starstone`, plus `_stairs`, `_slab`, `_wall` for `starstone`,
  `starstone_bricks` and `polished_starstone` (9 shaped blocks + 2 full blocks).
- Crafting recipes, stonecutter recipes from starstone, and loot tables (slabs drop 2 when double).
- Tags: `minecraft:stairs`, `slabs`, `walls`, `mineable/pickaxe` (block and item tags where vanilla has both).
- Blockstates/models for stairs, slabs and walls (copy vanilla's stone_brick ones and change textures).
- **Acceptance:** all blocks place correctly in-game, walls connect, GameTest checks that recipes and
  loot tables load for every new block.

### T02: Advancements tree
- Tab root "Starfall: Look Up" (icon: wishing star, background: `minecraft:textures/block/obsidian.png` or a custom one).
- Advancements: *Look Up* (be within 192 blocks of a landing star, needs a custom trigger or
  a `minecraft:location` workaround), *Catch a Falling Star* (obtain `fallen_star` drops → `inventory_changed` with star_shard),
  *Stardust to Stardust* (use stardust), *Make a Wish* (`consume_item`/`using_item` or custom trigger),
  *Forged in Starlight* (starsteel ingot), *Starlit Arsenal* (all 5 starsteel tools), *Shooting for the Stars* (wishing star level II, custom).
- Prefer vanilla triggers. Add a custom `CriterionTrigger` only where needed (register via `Registries.TRIGGER_TYPE`).
- **Acceptance:** tree shows in-game, every advancement is obtainable in survival, JSON in `data/starfall/advancement/`.

### T03: Fallen stars cool down
- Add `IntegerProperty HEAT` (0–3) to `FallenStarBlock`, default 3. Random ticks lower heat ~once per
  in-game day (tune so a star stays hot for ~3 days).
- Light level and particles scale with heat. While heat ≥ 2, random ticks can ignite flammable blocks next to it.
- At heat 0, replace with a new `burnt_out_star` block: no light, drops 1–2 star shards, no stardust, no wishing star.
- Loot table for `fallen_star` should only give the wishing star chance when heat == 3 (use `block_state_property`).
- Textures: heat stages can share the animated texture with a tint, or have 4 textures (your call).
- **Acceptance:** GameTest forces random ticks and asserts the star eventually becomes `burnt_out_star`.

### T04: Debug commands
- `/starfall shower [seconds]` starts a mini meteor shower around the executor (needs T09 logic or a simple loop).
- `/starfall list` lists recent impacts (needs T06's registry; until then list in-flight stars).
- `/starfall cool <pos>` sets a fallen star's heat (needs T03).
- All op level 2, all text in lang.
- **Acceptance:** commands work and show translated feedback.

### T05: Config polish
- New server options: `dimensions` allowlist (default `["minecraft:overworld"]`), `max_stars_per_player_per_night`.
- New client config: `streak_particles` (`full`/`reduced`/`off`). Particles are sent from the server
  today, so this needs either a custom payload or moving streak rendering client-side (coordinate with T08).
- Register NeoForge's `ConfigurationScreen` for the mod (client only) and add translation keys for every option.
- **Acceptance:** the in-game Mods → Starfall → Config screen shows translated options.

### T06: Impact registry + Star Compass
- `StarImpactData extends SavedData` on the Overworld storing recent impacts (pos, game time), capped at 64.
  Record in `StarImpact.impact`; remove when the fallen star is mined.
- `star_compass` item (craft: compass + 4 star shards). In `inventoryTick`, set the vanilla
  `DataComponents.LODESTONE_TRACKER` to the nearest recorded impact (tracked = false) so vanilla
  compass rendering works. Spin randomly when none exist.
- Item model: copy vanilla compass's 32 `angle` overrides and register the `angle` item property on the
  client with `CompassItemPropertyFunction` (client package only).
- **Acceptance:** compass points at the latest star, GameTest checks SavedData records and removes impacts.

### T07: Starsteel armor + set bonus
- Register `ArmorMaterial` via `DeferredRegister<ArmorMaterial>` (`Registries.ARMOR_MATERIAL`), defense like
  diamond minus 1 total, toughness 1.0, enchantability 18, repair with starsteel ingot.
- Helmet, chestplate, leggings, boots + recipes + `minecraft:*_armor` / `enchantable/*` tags.
- Armor layer textures `textures/models/armor/starsteel_layer_1.px` and `_layer_2.px` (64×32).
- Set bonus (all 4 pieces, Starlit): Night Vision (refreshing, no flicker) and no fall damage.
- **Acceptance:** wearing the set at night gives the bonus; GameTest for the bonus logic.

### T08: FallingStar entity
- `FallingStarEntity` (not a projectile you can deflect): moves along the path that
  `FallingStarManager` computes today, calls `StarImpact.impact` when it hits terrain, damages mobs it passes through.
- Client renderer: bright billboard quad + long particle trail. Glows (full bright).
- Replace the particle streak in `FallingStarManager` (keep `launchStarAt` as the API).
- Entity must not save to disk mid-flight in a way that duplicates stars. Either discard on unload or
  persist and resume.
- **Acceptance:** stars visibly fall as entities; `/starfall summon` still works; existing GameTests pass.

### T09: Starfall Nights
- At dusk, 1-in-10 chance (config) that the night is a Starfall Night: chat announcement to the dimension,
  star chance ×8 (config), stars still need clear weather.
- Client: tint the night sky slightly purple during a shower (`ViewportEvent.ComputeFogColor` or a sky color hook) via a small sync payload.
- Advancement "Heavenly Shower" (be outside during a full Starfall Night). Coordinate with T02.
- **Acceptance:** `/starfall shower` (T04) or a config toggle can force one; GameTest for the scheduling logic.

### T10: Custom sounds
- Sounds: `star_whoosh` (incoming), `star_impact`, `wish_granted`, `fallen_star_ambient` (quiet crackle).
- Register `SoundEvent`s (`Registries.SOUND_EVENT`), add `assets/starfall/sounds.json` and subtitles in lang.
- `.ogg` files are binary. Commit them normally with git. If you can't create audio, use vanilla
  sounds remapped in `sounds.json` (for example pitch-shifted `minecraft:entity.firework_rocket.large_blast`).
- **Acceptance:** sounds play with subtitles.

### T11: Data-driven wishes
- Move the wish list in `WishingStarItem` to JSON under `data/starfall/starfall/wishes/*.json`
  (custom datapack registry via `DataPackRegistryEvent.NewRegistry`, or a reload listener).
- Each wish: weight + outcome type: `effect` (effect, duration, amplifier), `item_shower`, `clear_weather`, `summon` (entity), `levitate_briefly`.
- Ship ~15 wishes including 3 rare ones (weight ≤ 2).
- **Acceptance:** datapacks can add or override wishes; GameTest checks the default table loads.

### T12: Star Wisp
- Small flying passive mob (`PathfinderMob` + `FlyingMoveControl`), glows, 6 HP. Spawns near fallen
  stars at night (spawn in `StarImpact` with a chance, plus natural spawn on starlit nights via biome modifier).
- Follows players holding stardust; dropping stardust "feeds" it, and a fed wisp leaves behind a stardust item every few minutes.
- Model (simple cube + wings), renderer, emissive layer, spawn egg, loot (stardust 0–2).
- **Acceptance:** spawns, flies, follows stardust holders; GameTest spawns one and checks attributes.

### T13: Astral Altar
- Block + block entity + menu + screen. Slots: 1 center input, 4 pedestal inputs, 1 stardust fuel, 1 output.
- Only works when the altar can see the sky at night. Progress bar fills faster when Starlit and clear.
- New recipe type `starfall:astral_infusion` (`RecipeType` + `RecipeSerializer` with MapCodec/StreamCodec),
  JSON: `center`, `pedestals` (list of ingredients), `stardust_cost`, `time`, `result`.
- Ship 6 recipes, e.g. Star Feather (wishing star + 4 feathers → slow-fall charm),
  Starlit Lens (spyglass + shards, needed for T14), Bottled Starlight (glass bottle + stardust → night vision splash).
- **Acceptance:** GUI works, hoppers can insert and extract, GameTest crafts a recipe on a fake night.

### T14: Constellations
- Six constellations at fixed sky positions (azimuth/elevation relative to the moon's path).
- Using a Starlit Lens (T13) or spyglass at night, looking within ~3° of a constellation for 3 seconds
  "charts" it. Per-player attachment (`AttachmentType`) stores charted constellations.
- Charting gives a Constellation Chart item; having all six unlocks an advancement and a permanent +1 luck.
- Client: render faint constellation lines in the sky while looking through the lens (render level stage after sky).
- **Acceptance:** charting works in multiplayer, data persists through death and relog.

### T15: Ancient craters
- Worldgen feature (configured_feature + placed_feature + `neoforge:add_features` biome modifier)
  placing rare cooled craters (burnt-out star at center, mossy starstone, grass/vines grown back).
- About 1 per 40×40 chunks in plains/forest/savanna/desert. A small chance of a buried chest with a custom loot table.
- **Acceptance:** `/locate feature` or a GameTest places one; no cascading worldgen warnings in logs.

### T16: Star Bow & Starfall Arrows
- `starfall_arrow` (arrow + star shard): at night, on hit, calls down a micro-star (light burst, 4 damage
  in a 2-block radius, no crater, no block damage).
- `star_bow` (starsteel + string): +25% arrow speed while Starlit, shows a faint trajectory sparkle.
- **Acceptance:** works on mobs and blocks; GameTest for the arrow impact damage.

### T17: Art pass
- Redraw tool sprites (pickaxe arc, axe blade) for crisper silhouettes. Keep the palette.
- Give the Fallen Star a custom block model (a crystal cluster, not a full cube) with a matching
  shape/collision and render type `cutout`.
- Add a mod logo (`logo.png`, generated from a `.px`) and `logoFile` in `neoforge.mods.toml`.
- **Acceptance:** before/after screenshots or a preview sheet in the PR.

### T18: Stargazer's Journal
- A written-book-style guide (`stargazers_journal`) given the first time a player sees a star land.
  Pages explain stars, craters, starsteel, wishes and the Starlit bonus.
- Use a simple custom screen or vanilla written book components. No hard dependency on Patchouli.
- **Acceptance:** given once per player (attachment flag), text in lang files.

### T19: Compat
- JEI plugin: Astral Infusion category (T13). EMI equivalent if simple. Jade: Fallen Star heat (T03).
- All compat must be optional: `compileOnly` dependencies + runtime checks with `ModList.get().isLoaded`.
- **Acceptance:** the game runs with and without each compat mod.

### T20: Data generators
- Replace hand-written JSON with NeoForge datagen providers (block states, item models, loot, recipes,
  tags, lang, advancements). Output to `src/generated/resources`. Delete the hand-written copies.
- **Acceptance:** `runData` reproduces identical game behavior; CI checks generated files are up to date.

### T21: Release pipeline
- Workflow on tag `v*`: build, run GameTests, create a GitHub Release with the jar and a changelog
  generated from merged PR titles.
- **Acceptance:** pushing tag `v0.1.0` produces a release with `starfall-0.1.0.jar`.

### T22: Stardust fires NeoForge's bonemeal event
- `StardustItem.applyStardust` calls `performBonemeal` directly, so other mods' `BonemealEvent` hooks never see it.
- Fire the event first (see `net.neoforged.neoforge.event.EventHooks` in 21.1 for the bonemeal hook) and stop if it is cancelled.
- **Acceptance:** existing `stardustGrowsCrops` GameTest still passes; a cancelled event leaves the crop and stack unchanged.
