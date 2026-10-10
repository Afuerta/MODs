# AGENTS.md: working on this repo

This repo is built by more than one AI agent (ChatGPT and Claude) plus a human owner (**@Afuerta**).
Read this file before you change anything. It covers how we split work, how to build and test, and
the Minecraft 1.21.1 details that are easy to get wrong.

## The project

| Path | What it is |
|---|---|
| `starfall/` | **Starfall**, a NeoForge 1.21.1 mod. Stars fall at night and leave craters full of loot. |
| `starfall/DESIGN.md` | The vision, current features, roadmap and balance numbers. Read it first. |
| `starfall/TASKS.md` | The backlog: every task with acceptance criteria, plus who is doing what. |
| `.github/workflows/` | CI: builds the mod, runs GameTests, uploads the jar, comments on failed PRs. |

## How we split the work

1. **Pick a task** from `starfall/TASKS.md` (the backlog, with acceptance criteria for every task).
   Take the next `ready` task in the suggested order, unless the owner asks for something else.
2. **Claim it** by setting yourself as Owner and status `in progress` in `TASKS.md` in your first commit.
   If the task has a GitHub issue, comment there too.
3. **Branch** from `main`: `chatgpt/<task-id>-<short-slug>` or `claude/<task-id>-<short-slug>`
   (e.g. `chatgpt/T01-starstone-building-set`). Never push directly to `main`.
4. **One task per pull request.** Keep PRs focused. Put the task ID in the PR title (and `Closes #<issue>` if there is one).
5. **CI must be green** (build + GameTests). If CI fails, the workflow posts the error lines as a PR comment.
6. **Finish** by marking the task `done` in `TASKS.md` in the same PR.
7. **Got an idea?** Add it to the "Idea parking lot" in `DESIGN.md`, or open an issue with acceptance criteria.
8. **Reviewing each other:** if you're asked to review the other agent's PR, check it against the issue's
   acceptance criteria and this file. Leave concrete comments, not rewrites.

Rules that protect players' worlds:
- **Never rename or remove a registry id** (`starfall:starstone`, etc.) once it's on `main`. Old worlds would lose those blocks.
- Don't change existing config keys; add new ones instead.

## Build & test

You need **JDK 21**. The Gradle wrapper downloads the right Gradle (9.2.1) by itself.

```bash
cd starfall
./gradlew build               # compile + package -> build/libs/starfall-<version>.jar
./gradlew runGameTestServer   # headless server that runs every @GameTest, exits non-zero on failure
./gradlew runClient           # play it (needs a desktop)
python3 tools/px_render.py    # preview all textures -> build/px-preview/sheet.png (needs Pillow)
```

The first build downloads Minecraft and NeoForge (a few minutes). On Windows use `gradlew.bat`.

Useful in-game: `/starfall summon` drops a star 12 blocks east of you; `/time set night`.

## Code layout (`starfall/src/main/java/io/github/afuerta/starfall/`)

| Package | Contents |
|---|---|
| `Starfall` | `@Mod` entry point. Registers everything and adds game-event listeners with `NeoForge.EVENT_BUS.addListener`. |
| `StarfallConfig` | Server config (`ModConfigSpec`). |
| `registry/` | `ModBlocks`, `ModItems` (also sets creative tab order), `ModCreativeTabs`, `ModTags`, `ModTiers`. |
| `block/`, `item/` | Custom block and item classes. |
| `event/` | `FallingStarManager` (night event), `StarImpact` (craters), `StarlitEvents` (night bonus). |
| `command/` | `/starfall` command. |
| `util/` | Helpers (`isNight`, `isStarlit`, compass directions). |
| `gametest/` | `StarfallGameTests`. **Add a test for every feature you build.** |

Resources are hand-written JSON in `src/main/resources` (datagen is a later task):
- `assets/starfall/`: `blockstates/`, `models/block/`, `models/item/`, `lang/en_us.json`, `textures/**.png.mcmeta`
- `data/starfall/`: `loot_table/blocks/`, `recipe/`, `tags/item/`, `damage_type/`
- `data/minecraft/tags/...` and `data/c/tags/...` for vanilla and common tags

Checklist for a new block: register in `ModBlocks` → block item in `ModItems` → blockstate → block model →
item model → texture `.px` → loot table → `mineable/*` (+ `needs_*_tool`) tag → lang → GameTest.

## Textures are text (`.px` files)

PNG textures are **generated at build time** from text pixel art in `starfall/src/main/pixelart/`.
`block/foo.px` becomes `assets/starfall/textures/block/foo.png`. Don't commit PNGs into
`src/main/resources/assets/starfall/textures`. Edit the `.px` file instead.

```
// comments start with //
palette:
a #2A2346
b #FFFFFF80          <- optional alpha (#RRGGBBAA)
pixels:
aaaabbbb........     <- one line per row; '.' is always transparent
```

- One character per palette colour; every row must be the same width.
- Items and blocks are 16×16. Animated textures stack frames vertically (16×64 = 4 frames) and need
  a matching `textures/<path>.png.mcmeta` in `src/main/resources`.
- Armor layers are 64×32 (vanilla layout).
- Preview with `python3 tools/px_render.py`. Style: a dark navy outline (`#1A1838`) on items,
  indigo/violet for starstone, icy blue for starsteel and warm gold for anything star-hot.

## Minecraft 1.21.1 / NeoForge 21.1 gotchas

These change between versions. Most online examples are for other versions, so check them:
- `ResourceLocation.fromNamespaceAndPath(ns, path)` (or `Starfall.id(path)`); the constructor is private.
- Data folders are **singular**: `recipe/`, `loot_table/`, `advancement/`, `tags/item/`, `tags/block/`, `structure/`.
- Recipe results use `"id"`: `"result": {"id": "starfall:stardust", "count": 2}`.
- Effects are `Holder<MobEffect>` with the old names: `MobEffects.MOVEMENT_SPEED`, `DIG_SPEED`, `DAMAGE_BOOST`, `JUMP`.
- Tools: `Tier` interface (`getIncorrectBlocksForDrops()` instead of levels) and
  `new Item.Properties().attributes(SwordItem.createAttributes(tier, dmg, speed))`.
- Armor materials are a registry in 1.21.1 (`Registries.ARMOR_MATERIAL`, `Holder<ArmorMaterial>`).
- `Item#use` returns `InteractionResultHolder<ItemStack>`, and `appendHoverText` takes an `Item.TooltipContext`.
- Use `DeferredRegister.Blocks/Items` with `DeferredBlock`/`DeferredItem`. Use `registryOrThrow(...)` and
  `getHolderOrThrow(...)` (the 1.21.2+ names `lookupOrThrow`/`getOrThrow` don't exist yet).
- Client-only code (renderers, screens, item properties) goes in a `client/` package and is registered from
  a `@EventBusSubscriber(modid = Starfall.MOD_ID, bus = EventBusSubscriber.Bus.MOD, value = Dist.CLIENT)` class.
  Never reference client classes from common code.
- GameTests: `@GameTestHolder(Starfall.MOD_ID)` + `@PrefixGameTestTemplate(false)`, template `"empty"`
  (a 9×9×9 air box generated by the `generateTestStructures` Gradle task).

## Style

- Java 21, 4-space indent, `final` utility classes with private constructors, no wildcard imports.
- Keep magic numbers as named constants and write a short Javadoc on every public class.
- Put player-facing text in `en_us.json`; never hard-code English in Java.
- Commit messages: imperative mood ("Add starstone stairs"), reference the issue (`#12`).
