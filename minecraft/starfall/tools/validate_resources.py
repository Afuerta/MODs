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
