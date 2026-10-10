#!/usr/bin/env python3
"""Validate Starfall's source resources without Minecraft or third-party packages."""

from __future__ import annotations

import json
import pathlib
import re
import sys


ROOT = pathlib.Path(__file__).resolve().parent.parent
RESOURCES = ROOT / "src/main/resources"
ASSETS = RESOURCES / "assets/starfall"
DATA = RESOURCES / "data/starfall"
PIXEL_ART = ROOT / "src/main/pixelart"
BUILDING_BLOCKS = {
    "starstone_stairs", "starstone_slab", "starstone_wall",
    "starstone_brick_stairs", "starstone_brick_slab", "starstone_brick_wall",
    "polished_starstone", "polished_starstone_stairs", "polished_starstone_slab",
    "polished_starstone_wall", "chiseled_starstone",
}
ARMOR_PATTERNS = {
    "helmet": ["SSS", "S S"],
    "chestplate": ["S S", "SSS", "SSS"],
    "leggings": ["SSS", "S S", "S S"],
    "boots": ["S S", "S S"],
}
ARMOR_SLOTS = {"helmet": "head_armor", "chestplate": "chest_armor",
               "leggings": "leg_armor", "boots": "foot_armor"}
ARMOR_LAYERS = {PIXEL_ART / f"models/armor/starsteel_layer_{layer}.px" for layer in (1, 2)}
TRIM_MATERIALS = ("quartz", "iron", "netherite", "redstone", "copper", "gold",
                  "emerald", "diamond", "lapis", "amethyst")
ERRORS: list[str] = []


def fail(message: str) -> None:
    ERRORS.append(message)


def pairs_without_duplicates(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def read_json(path: pathlib.Path) -> dict:
    try:
        value = json.loads(path.read_text(), object_pairs_hook=pairs_without_duplicates)
        if not isinstance(value, dict):
            raise ValueError("resource must be a JSON object")
        return value
    except (ValueError, OSError) as exc:
        fail(f"{path.relative_to(ROOT)}: {exc}")
        return {}


def strings(value):
    if isinstance(value, dict):
        for member in value.values():
            yield from strings(member)
    elif isinstance(value, list):
        for member in value:
            yield from strings(member)
    elif isinstance(value, str):
        yield value


def model_exists(identifier: str, source: pathlib.Path) -> None:
    if identifier.startswith("starfall:"):
        target = ASSETS / "models" / (identifier.split(":", 1)[1] + ".json")
        if not target.is_file():
            fail(f"{source.relative_to(ROOT)}: missing model {identifier}")


def item_exists(identifier: str, source: pathlib.Path) -> None:
    if identifier.startswith("starfall:"):
        item = identifier.split(":", 1)[1]
        if not (ASSETS / "models/item" / f"{item}.json").is_file():
            fail(f"{source.relative_to(ROOT)}: unknown item {identifier}")


def validate_pixel_art(path: pathlib.Path) -> tuple[int, int]:
    palette = {"."}
    rows = []
    mode = None
    try:
        for line_number, raw in enumerate(path.read_text().splitlines(), 1):
            line = raw.rstrip()
            if not line or line.lstrip().startswith("//"):
                continue
            if line in ("palette:", "pixels:"):
                mode = line[:-1]
            elif mode == "palette":
                key, colour = line.split()
                if len(key) != 1 or key in palette:
                    raise ValueError(f"line {line_number}: invalid or repeated palette key")
                if not re.fullmatch(r"#[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?", colour):
                    raise ValueError(f"line {line_number}: invalid colour {colour}")
                palette.add(key)
            elif mode == "pixels":
                rows.append(line)
            else:
                raise ValueError(f"line {line_number}: expected palette or pixels header")
        armor_layer = path in ARMOR_LAYERS
        expected_width = 64 if armor_layer else 16
        if armor_layer:
            if len(rows) != 32 or len(rows[0]) != 64:
                raise ValueError("humanoid armor layers must be exactly 64 x 32 pixels")
        elif not rows or len(rows[0]) != 16 or len(rows) % 16:
            raise ValueError("textures must be 16 pixels wide and whole 16-pixel frames tall")
        for index, row in enumerate(rows, 1):
            if len(row) != expected_width or set(row) - palette:
                raise ValueError(f"pixel row {index}: width or undefined colour")
        if len(rows) > 16 and not armor_layer:
            metadata = ASSETS / "textures" / path.relative_to(PIXEL_ART).with_suffix(".png.mcmeta")
            if not metadata.is_file():
                raise ValueError("animated texture has no .png.mcmeta")
    except (ValueError, OSError) as exc:
        fail(f"{path.relative_to(ROOT)}: {exc}")
    return (len(rows[0]) if rows else 0, len(rows))


def validate_starsteel_armor(documents: dict[pathlib.Path, dict], language: dict) -> None:
    """Check armor acquisition, enchanting, trim models and vanilla humanoid UVs."""
    for piece, pattern in ARMOR_PATTERNS.items():
        name = f"starsteel_{piece}"
        identifier = f"starfall:{name}"
        model = documents.get(ASSETS / f"models/item/{name}.json", {})
        if (model.get("parent") != "minecraft:item/generated"
                or model.get("textures") != {"layer0": f"starfall:item/{name}"}):
            fail(f"armor {piece}: missing generated item model or own base texture")
        overrides = [{"predicate": {"trim_type": (i + 1) / 10},
                      "model": f"starfall:item/{name}_{trim}_trim"}
                     for i, trim in enumerate(TRIM_MATERIALS)]
        if model.get("overrides") != overrides:
            fail(f"armor {piece}: inventory model must display all ten vanilla trim materials")
        for trim in TRIM_MATERIALS:
            trim_model = documents.get(ASSETS / f"models/item/{name}_{trim}_trim.json", {})
            if trim_model.get("textures") != {
                    "layer0": f"starfall:item/{name}",
                    "layer1": f"minecraft:trims/items/{piece}_trim_{trim}"}:
                fail(f"armor {piece}: invalid {trim} inventory trim model")
        recipe = documents.get(DATA / f"recipe/{name}.json", {})
        if (recipe.get("type") != "minecraft:crafting_shaped"
                or recipe.get("pattern") != pattern
                or recipe.get("key") != {"S": {"item": "starfall:starsteel_ingot"}}
                or recipe.get("result") != {"id": identifier, "count": 1}):
            fail(f"armor {piece}: needs its standard Starsteel Ingot crafting recipe")
        unlock = documents.get(DATA / f"advancement/recipes/{name}.json", {})
        has_ingot = unlock.get("criteria", {}).get("has_starsteel_ingot", {})
        if (unlock.get("parent") != "minecraft:recipes/root"
                or has_ingot != {"trigger": "minecraft:inventory_changed",
                                 "conditions": {"items": [{"items": "starfall:starsteel_ingot"}]}}
                or unlock.get("rewards", {}).get("recipes") != [identifier]
                or unlock.get("requirements") != [["has_starsteel_ingot", "has_the_recipe"]]):
            fail(f"armor {piece}: needs an independent unlock on obtaining an ingot")
        for tag in (ARMOR_SLOTS[piece], f"enchantable/{ARMOR_SLOTS[piece]}",
                    "enchantable/armor", "enchantable/durability",
                    "enchantable/equippable", "trimmable_armor"):
            values = documents.get(RESOURCES / f"data/minecraft/tags/item/{tag}.json", {})
            if values.get("replace") is not False or identifier not in values.get("values", []):
                fail(f"armor {piece}: missing additive Minecraft tag {tag}")
        if f"item.starfall.{name}" not in language:
            fail(f"armor {piece}: missing English name")

    goal = documents.get(DATA / "advancement/forged_in_starlight.json", {})
    expected_criteria = {piece: {"trigger": "minecraft:inventory_changed",
                                "conditions": {"items": [{"items": f"starfall:starsteel_{piece}"}]}}
                         for piece in ARMOR_PATTERNS}
    if (goal.get("parent") != "starfall:starsteel" or goal.get("criteria") != expected_criteria
            or goal.get("requirements") != [[piece] for piece in ARMOR_PATTERNS]
            or goal.get("rewards") != {"experience": 50}):
        fail("armor: full-set advancement must require all four pieces and award 50 XP once")
    for key in ("item.starfall.starsteel_armor.tooltip", "item.starfall.starsteel_armor.bonus"):
        if key not in language:
            fail(f"armor: missing language key {key}")

    # Standard 1.21.1 humanoid cuboid nets. Outside these rectangles is unused atlas space.
    uv_regions = [(8, 0, 16, 8), (0, 8, 32, 8),                 # head
                  (4, 16, 8, 4), (0, 20, 16, 12),             # leg (mirrored pair)
                  (20, 16, 16, 4), (16, 20, 24, 12),          # body
                  (44, 16, 8, 4), (40, 20, 16, 12)]           # arm (mirrored pair)
    used_uv = {(x, y) for rx, ry, width, height in uv_regions
               for x in range(rx, rx + width) for y in range(ry, ry + height)}
    for path in sorted(ARMOR_LAYERS):
        if not path.is_file():
            fail(f"armor: missing layer {path.name}")
            continue
        rows = path.read_text().partition("pixels:\n")[2].splitlines()
        if len(rows) != 32 or any(len(row) != 64 for row in rows):
            continue  # The parser gives the precise dimension error.
        if any(char != "." and (x, y) not in used_uv
               for y, row in enumerate(rows) for x, char in enumerate(row)):
            fail(f"armor {path.name}: paint outside the humanoid UV faces")
        # Each visible front/back region must carry art. The open helmet visor and
        # upper boot cutouts intentionally remain transparent.
        regions = ([(8, 8, 8, 8), (24, 8, 8, 8), (20, 20, 8, 12), (32, 20, 8, 12),
                    (44, 20, 4, 12), (52, 20, 4, 12), (4, 26, 4, 6), (12, 26, 4, 6)]
                   if path.stem.endswith("_1") else
                   [(20, 28, 8, 4), (32, 28, 8, 4), (4, 20, 4, 12), (12, 20, 4, 12)])
        for x, y, width, height in regions:
            if not any(rows[row][column] != "." for row in range(y, y + height)
                       for column in range(x, x + width)):
                fail(f"armor {path.name}: missing visible face at {x}, {y}")


def validate_star_compass(documents: dict[pathlib.Path, dict], language: dict) -> None:
    """Check the complete needle sequence and its survival acquisition path."""
    model = documents.get(ASSETS / "models/item/star_compass.json", {})
    if model.get("textures", {}).get("layer0") != "starfall:item/star_compass_16":
        fail("star compass: default texture must be frame 16")
    # Verified against Mojang's 1.21.1 client model: 00 down, 08 left, 16 up, 24 right.
    # Frame 16 spans zero; explicit frame models avoid the vanilla model's self-reference.
    expected = [(0.0, 16)] + [((step + 0.5) / 32, (step + 17) % 32) for step in range(32)]
    overrides = model.get("overrides", [])
    if len(overrides) != len(expected) or any(
        entry.get("predicate") != {"angle": angle}
        or entry.get("model") != f"starfall:item/star_compass_{frame:02}"
        for entry, (angle, frame) in zip(overrides, expected)
    ):
        fail("star compass: angle overrides must cover all 32 frames in vanilla order")
    frames = set()
    for frame in range(32):
        name = f"star_compass_{frame:02}"
        frame_model = documents.get(ASSETS / f"models/item/{name}.json", {})
        if frame_model.get("textures", {}).get("layer0") != f"starfall:item/{name}":
            fail(f"star compass: frame {frame:02} model must use its own texture")
        if "overrides" in frame_model:
            fail(f"star compass: frame {frame:02} must not recurse through overrides")
        path = PIXEL_ART / f"item/{name}.px"
        if path.is_file():
            rows = path.read_text().partition("pixels:\n")[2].splitlines()
            if len(rows) != 16:
                fail(f"star compass: frame {frame:02} must be a single 16 x 16 image")
            frames.add(tuple(rows))
    if len(frames) != 32:
        fail("star compass: must have 32 distinct text texture frames")
    recipe = documents.get(DATA / "recipe/star_compass.json", {})
    if (recipe.get("type") != "minecraft:crafting_shaped"
            or recipe.get("pattern") != [" S ", "SCS", " S "]
            or recipe.get("key") != {"S": {"item": "starfall:star_shard"},
                                     "C": {"item": "minecraft:compass"}}
            or recipe.get("result") != {"id": "starfall:star_compass", "count": 1}):
        fail("star compass: recipe must consume one compass and four Star Shards")
    unlock = documents.get(DATA / "advancement/recipes/star_compass.json", {})
    unlocks = unlock.get("rewards", {}).get("recipes", [])
    if "starfall:star_compass" not in unlocks:
        fail("star compass: needs an independent recipe unlock for existing players")
    if unlock.get("criteria", {}).get("has_star_shard", {}).get("trigger") != "minecraft:inventory_changed":
        fail("star compass: obtaining shards must unlock the recipe")
    for key in ("item.starfall.star_compass", "item.starfall.star_compass.tooltip",
                "item.starfall.star_compass.unbound", "item.starfall.star_compass.target"):
        if key not in language:
            fail(f"star compass: missing language key {key}")


def main() -> int:
    documents = {path: read_json(path) for path in sorted(RESOURCES.rglob("*.json"))}
    pixel_files = sorted(PIXEL_ART.rglob("*.px"))
    for path in pixel_files:
        validate_pixel_art(path)
    for path in ASSETS.rglob("*.png"):
        fail(f"{path.relative_to(ROOT)}: commit .px source rather than generated PNG")
    for path in ASSETS.rglob("*.mcmeta"):
        read_json(path)
    for plural in ("recipes", "loot_tables", "advancements", "tags/items", "tags/blocks"):
        for path in (RESOURCES / "data").glob(f"*/{plural}"):
            fail(f"{path.relative_to(ROOT)}: Minecraft 1.21 uses singular resource folders")

    for path, document in documents.items():
        if "models" in path.parts:
            model_exists(document.get("parent", ""), path)
            for override in document.get("overrides", []):
                model_exists(override.get("model", ""), path)
            for texture in document.get("textures", {}).values():
                if texture.startswith("starfall:"):
                    target = PIXEL_ART / (texture.split(":", 1)[1] + ".px")
                    if not target.is_file():
                        fail(f"{path.relative_to(ROOT)}: missing text texture {texture}")
        if "blockstates" in path.parts:
            for identifier in strings(document):
                model_exists(identifier, path)
        if "recipe" in path.parts:
            result = document.get("result", {})
            if not isinstance(result, dict) or "id" not in result:
                fail(f"{path.relative_to(ROOT)}: recipe result requires an id")
            else:
                item_exists(result["id"], path)
                if result.get("count", 1) < 1:
                    fail(f"{path.relative_to(ROOT)}: recipe count must be positive")
            for identifier in strings(document):
                if identifier.startswith("starfall:") and identifier != document.get("type"):
                    item_exists(identifier, path)
        if "loot_table" in path.parts:
            def entries(value):
                if isinstance(value, dict):
                    if value.get("type") == "minecraft:item":
                        item_exists(value.get("name", ""), path)
                    for child in value.values():
                        entries(child)
                elif isinstance(value, list):
                    for child in value:
                        entries(child)
            entries(document)
        if "advancement" in path.parts:
            parent = document.get("parent", "")
            if parent.startswith("starfall:"):
                target = DATA / "advancement" / (parent.split(":", 1)[1] + ".json")
                if not target.is_file():
                    fail(f"{path.relative_to(ROOT)}: missing advancement parent {parent}")
            criteria = document.get("criteria", {})
            if not criteria or any("trigger" not in entry for entry in criteria.values()):
                fail(f"{path.relative_to(ROOT)}: advancement needs real trigger criteria")
            for group in document.get("requirements", []):
                if not group or any(key not in criteria for key in group):
                    fail(f"{path.relative_to(ROOT)}: advancement has unknown requirements")
        if "tags" in path.parts:
            for value in document.get("values", []):
                identifier = value if isinstance(value, str) else value.get("id", "")
                if identifier.startswith("starfall:"):
                    item_exists(identifier, path)

    language = documents.get(ASSETS / "lang/en_us.json", {})
    validate_star_compass(documents, language)
    validate_starsteel_armor(documents, language)
    pickaxe_tag = documents.get(RESOURCES / "data/minecraft/tags/block/mineable/pickaxe.json", {})
    for block in BUILDING_BLOCKS:
        for path in (ASSETS / "blockstates" / f"{block}.json",
                     ASSETS / "models/item" / f"{block}.json",
                     DATA / "loot_table/blocks" / f"{block}.json",
                     DATA / "recipe" / f"{block}.json"):
            if path not in documents:
                fail(f"building block {block}: missing {path.relative_to(ROOT)}")
        if f"block.starfall.{block}" not in language:
            fail(f"building block {block}: missing English name")
        if f"starfall:{block}" not in pickaxe_tag.get("values", []):
            fail(f"building block {block}: missing pickaxe mining tag")
    for path, document in documents.items():
        if "advancement" in path.parts:
            display = document.get("display", {})
            for element in ("title", "description"):
                key = display.get(element, {}).get("translate")
                if key and key not in language:
                    fail(f"{path.relative_to(ROOT)}: missing language key {key}")
    if ERRORS:
        print("\n".join(ERRORS), file=sys.stderr)
        return 1
    print(f"Validated {len(documents)} JSON resources, {len(pixel_files)} text textures, "
          f"{len(BUILDING_BLOCKS)} building variants and "
          f"{sum('advancement' in path.parts for path in documents)} advancements.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
