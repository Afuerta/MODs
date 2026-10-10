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
        if not rows or len(rows[0]) != 16 or len(rows) % 16:
            raise ValueError("textures must be 16 pixels wide and whole 16-pixel frames tall")
        for index, row in enumerate(rows, 1):
            if len(row) != 16 or set(row) - palette:
                raise ValueError(f"pixel row {index}: width or undefined colour")
        if len(rows) > 16:
            metadata = ASSETS / "textures" / path.relative_to(PIXEL_ART).with_suffix(".png.mcmeta")
            if not metadata.is_file():
                raise ValueError("animated texture has no .png.mcmeta")
    except (ValueError, OSError) as exc:
        fail(f"{path.relative_to(ROOT)}: {exc}")
    return (16, len(rows))


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
