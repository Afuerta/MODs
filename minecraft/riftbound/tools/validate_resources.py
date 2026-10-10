#!/usr/bin/env python3
"""Validate Riftbound's Minecraft 1.21.1 resources without starting Minecraft.

Checks JSON syntax/duplicate keys, local IDs and model/texture references, PNG
integrity/dimensions, the 1.21.1 recipe schema, recipe unlock reachability, and
the anchor's loot/tool tags. This is a static check, not an in-game load test.
Requires only Python's standard library. Run from any working directory.
"""
from __future__ import annotations

import argparse
from collections import Counter
import json
from pathlib import Path
import struct
import zlib

ITEMS = {
    "verdant_echo", "ember_echo", "tidal_echo", "hollow_echo",
    "resonance_shard", "dormant_relic", "wayfarer_relic",
    "bulwark_relic", "harvester_relic", "rift_anchor",
}
BLOCKS = {"rift_anchor"}
VANILLA_ITEMS = {
    "amethyst_shard", "wheat_seeds", "coal", "gunpowder", "kelp",
    "clay_ball", "flint", "rotten_flesh", "obsidian", "copper_ingot",
}
VANILLA_ITEM_TAGS = {"leaves"}
VANILLA_PARENTS = {"item/generated", "block/cube_bottom_top"}
RECIPES = ITEMS - {"resonance_shard"}


def reject_duplicate_keys(pairs: list[tuple[str, object]]) -> dict:
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


class Validator:
    def __init__(self, root: Path):
        self.root = root
        self.resources = root / "src/main/resources"
        self.assets = self.resources / "assets/riftbound"
        self.data = self.resources / "data/riftbound"
        self.errors: list[str] = []
        self.parsed: dict[Path, object] = {}

    def label(self, path: Path) -> str:
        return str(path.relative_to(self.root))

    def expect(self, condition: bool, path: Path, message: str) -> None:
        if not condition:
            self.errors.append(f"{self.label(path)}: {message}")

    def read(self, path: Path) -> dict:
        if path not in self.parsed:
            if not path.is_file():
                self.errors.append(f"{self.label(path)}: required file is missing")
                self.parsed[path] = {}
            else:
                try:
                    self.parsed[path] = json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=reject_duplicate_keys)
                except (ValueError, UnicodeError) as exc:
                    self.errors.append(f"{self.label(path)}: invalid JSON ({exc})")
                    self.parsed[path] = {}
        value = self.parsed[path]
        self.expect(isinstance(value, dict), path, "expected a JSON object")
        return value if isinstance(value, dict) else {}

    def registry_id(self, value: object, path: Path, *, tag: bool = False, block: bool = False) -> None:
        if not isinstance(value, str) or value.count(":") != 1:
            self.expect(False, path, f"invalid registry ID: {value!r}")
            return
        namespace, name = value.split(":")
        if namespace == "riftbound":
            self.expect(name in (BLOCKS if block else ITEMS), path, f"unknown local {'block' if block else 'item'}: {value}")
        elif namespace == "minecraft":
            known = VANILLA_ITEM_TAGS if tag else VANILLA_ITEMS
            self.expect(name in known, path, f"vanilla {'tag' if tag else 'item'} is outside the checked 1.21.1 resource contract: {value}")
        else:
            self.expect(False, path, f"unexpected external registry namespace: {namespace}")

    def ingredient(self, ingredient: object, path: Path) -> set[str]:
        if not isinstance(ingredient, dict):
            self.expect(False, path, "1.21.1 ingredients must be item/tag objects")
            return set()
        valid = len(ingredient) == 1 and ("item" in ingredient or "tag" in ingredient)
        self.expect(valid, path, "ingredient must have exactly one item or tag")
        if not valid:
            return set()
        key = next(iter(ingredient))
        value = ingredient[key]
        self.registry_id(value, path, tag=key == "tag")
        return {str(value)}

    def check_png(self, path: Path, dimensions: tuple[int, int]) -> None:
        if not path.is_file():
            self.expect(False, path, "required PNG is missing")
            return
        try:
            raw = path.read_bytes()
            if raw[:8] != b"\x89PNG\r\n\x1a\n":
                raise ValueError("bad PNG signature")
            offset, compressed, header = 8, bytearray(), None
            ended = False
            while offset < len(raw):
                size = struct.unpack_from(">I", raw, offset)[0]
                kind = raw[offset + 4:offset + 8]
                payload = raw[offset + 8:offset + 8 + size]
                checksum = struct.unpack_from(">I", raw, offset + 8 + size)[0]
                if zlib.crc32(kind + payload) & 0xffffffff != checksum:
                    raise ValueError(f"bad {kind!r} CRC")
                if kind == b"IHDR":
                    header = struct.unpack(">IIBBBBB", payload)
                if kind == b"IDAT":
                    compressed.extend(payload)
                offset += size + 12
                if kind == b"IEND":
                    ended = True
                    break
            if not header or not ended or offset != len(raw):
                raise ValueError("missing header/end marker or trailing bytes")
            width, height, depth, color, compression, filtering, interlaced = header
            self.expect((width, height) == dimensions, path, f"expected {dimensions[0]}x{dimensions[1]}, got {width}x{height}")
            self.expect((depth, color, compression, filtering, interlaced) == (8, 6, 0, 0, 0), path, "expected non-interlaced 8-bit RGBA pixels")
            pixels = zlib.decompress(compressed)
            stride = 1 + width * 4
            self.expect(len(pixels) == stride * height, path, "incorrect decompressed pixel length")
            self.expect(all(pixels[y * stride] <= 4 for y in range(height)), path, "invalid PNG scanline filter")
        except (ValueError, struct.error, IndexError, zlib.error) as exc:
            self.expect(False, path, f"invalid PNG: {exc}")

    def models(self) -> None:
        paths = list((self.assets / "models").rglob("*.json"))
        required = {self.assets / f"models/item/{name}.json" for name in ITEMS}
        required.add(self.assets / "models/block/rift_anchor.json")
        self.expect(set(paths) == required, self.assets / "models", "expected models for all ten items and the Rift Anchor block")
        for path in required:
            model = self.read(path)
            parent = model.get("parent", "")
            if path.parent.name == "item" and path.stem != "rift_anchor":
                self.expect(parent == "minecraft:item/generated", path, "standalone item must use the generated sprite model")
                self.expect(model.get("textures") == {"layer0": "riftbound:item/" + path.stem}, path, "item model must bind its matching sprite")
            elif path.parent.name == "item":
                self.expect(parent == "riftbound:block/rift_anchor", path, "anchor item must use the anchor block model")
            else:
                self.expect(parent == "minecraft:block/cube_bottom_top", path, "anchor block must use distinct top/side/bottom faces")
                self.expect(model.get("textures") == {face: "riftbound:block/rift_anchor_" + face for face in ("top", "side", "bottom")}, path, "anchor block must bind all three matching face textures")
            if isinstance(parent, str) and parent.startswith("riftbound:"):
                ref = self.assets / "models" / (parent.split(":", 1)[1] + ".json")
                self.expect(ref.is_file(), path, f"missing parent model {parent}")
                self.expect(ref != path, path, "model cannot inherit from itself")
            else:
                self.expect(parent in {"minecraft:" + x for x in VANILLA_PARENTS}, path, f"unexpected model parent {parent!r}")
            for texture in model.get("textures", {}).values():
                self.expect(isinstance(texture, str) and texture.startswith("riftbound:"), path, f"expected direct local texture reference: {texture!r}")
                if isinstance(texture, str) and texture.startswith("riftbound:"):
                    ref = self.assets / "textures" / (texture.split(":", 1)[1] + ".png")
                    self.check_png(ref, (16, 16))
        expected_textures = {self.assets / f"textures/item/{name}.png" for name in ITEMS - BLOCKS}
        expected_textures |= {self.assets / f"textures/block/rift_anchor_{face}.png" for face in ("top", "side", "bottom")}
        self.expect(set((self.assets / "textures").rglob("*.png")) == expected_textures, self.assets / "textures", "expected the nine standalone sprites and three anchor faces")
        blockstate_path = self.assets / "blockstates/rift_anchor.json"
        blockstate = self.read(blockstate_path)
        self.expect(blockstate == {"variants": {"": {"model": "riftbound:block/rift_anchor"}}}, blockstate_path, "anchor has no blockstate properties; expected its single local model")
        self.check_png(self.assets / "icon.png", (64, 64))

    def recipes(self) -> None:
        ingredients_by_recipe = {}
        for name in sorted(RECIPES):
            path = self.data / f"recipe/{name}.json"
            recipe = self.read(path)
            output = recipe.get("result", {})
            self.expect(output == {"id": f"riftbound:{name}", "count": 1}, path, "1.21.1 output must use id, count=1, and match the recipe name")
            self.registry_id(output.get("id"), path)
            ingredients = set()
            counts = Counter()
            if recipe.get("type") == "minecraft:crafting_shaped":
                pattern, key = recipe.get("pattern", []), recipe.get("key", {})
                valid_pattern = isinstance(pattern, list) and 1 <= len(pattern) <= 3 and all(isinstance(row, str) and 1 <= len(row) <= 3 for row in pattern) and len({len(row) for row in pattern}) == 1
                self.expect(valid_pattern, path, "shaped recipe needs a rectangular 1-3 by 1-3 pattern")
                self.expect(isinstance(key, dict), path, "shaped recipe key must be an object")
                if valid_pattern and isinstance(key, dict):
                    used = set("".join(pattern)) - {" "}
                    self.expect(used == set(key), path, "pattern symbols and ingredient keys must match exactly")
                    self.expect(all(len(symbol) == 1 and symbol != " " for symbol in key), path, "ingredient symbols must be one non-space character")
                    for symbol, ingredient in key.items():
                        ids = self.ingredient(ingredient, path)
                        ingredients |= ids
                        for item in ids:
                            counts[item] += "".join(pattern).count(symbol)
            elif recipe.get("type") == "minecraft:crafting_shapeless":
                listed = recipe.get("ingredients", [])
                self.expect(isinstance(listed, list) and 1 <= len(listed) <= 9, path, "shapeless recipe requires 1-9 ingredients")
                if isinstance(listed, list):
                    for ingredient in listed:
                        ids = self.ingredient(ingredient, path)
                        ingredients |= ids
                        counts.update(ids)
            else:
                self.expect(False, path, "unsupported or missing recipe type")
            ingredients_by_recipe[name] = ingredients
            if name in {"wayfarer_relic", "bulwark_relic", "harvester_relic"}:
                self.expect(counts == Counter({"riftbound:resonance_shard": 8, "riftbound:dormant_relic": 1}), path, "attuned relic must cost exactly eight earned shards and one dormant relic")
            if name.endswith("_echo"):
                self.expect(all(item.startswith("minecraft:") for item in ingredients), path, "fallback echoes must use obtainable vanilla ingredients")
            advancement_path = self.data / f"advancement/recipes/{name}.json"
            advancement = self.read(advancement_path)
            self.expect(advancement.get("rewards", {}).get("recipes") == [f"riftbound:{name}"], advancement_path, "unlock must reward its matching recipe")
            criteria = advancement.get("criteria", {})
            self.expect(bool(criteria), advancement_path, "recipe unlock has no criteria")
            for criterion in criteria.values():
                self.expect(criterion.get("trigger") == "minecraft:inventory_changed", advancement_path, "recipe unlock must be based on ingredients, not its own craft")
                for predicate in criterion.get("conditions", {}).get("items", []):
                    matches = predicate.get("items", [])
                    self.expect(isinstance(matches, list) and bool(matches), advancement_path, "recipe unlock needs an item predicate")
                    self.expect(f"riftbound:{name}" not in matches, advancement_path, "circular unlock: recipe requires its own output")
                    for item in matches:
                        self.registry_id(item, advancement_path)
            self.expect(advancement.get("requirements") == [["has_material"]], advancement_path, "recipe unlock must use the has_material criterion")
        actual = {p.stem for p in (self.data / "recipe").glob("*.json")}
        self.expect(actual == RECIPES, self.data / "recipe", "expected nine survival recipes and no craftable trial shards")
        # Shards are a gameplay reward, and all vanilla ingredient IDs/tags are
        # available. Iterating to a fixed point detects crafting cycles.
        available = {"minecraft:" + x for x in VANILLA_ITEMS | VANILLA_ITEM_TAGS} | {"riftbound:resonance_shard"}
        pending = dict(ingredients_by_recipe)
        while pending:
            ready = [name for name, needs in pending.items() if needs <= available]
            if not ready:
                self.expect(False, self.data / "recipe", f"unreachable crafting chain: {sorted(pending)}")
                break
            for name in ready:
                available.add("riftbound:" + name)
                del pending[name]

    def loot_and_tags(self) -> None:
        loot_path = self.data / "loot_table/blocks/rift_anchor.json"
        loot = self.read(loot_path)
        self.expect(loot.get("type") == "minecraft:block", loot_path, "anchor loot table needs a block context")
        pools = loot.get("pools", [])
        self.expect(isinstance(pools, list) and len(pools) == 1, loot_path, "anchor needs exactly one drop pool")
        if isinstance(pools, list) and len(pools) == 1 and isinstance(pools[0], dict):
            self.expect(pools[0].get("rolls") == 1, loot_path, "anchor must drop once")
            self.expect(pools[0].get("entries") == [{"type": "minecraft:item", "name": "riftbound:rift_anchor"}], loot_path, "anchor must drop its BlockItem")
            self.expect(pools[0].get("conditions") == [{"condition": "minecraft:survives_explosion"}], loot_path, "anchor drop must honor explosion survival")
        for tag in ("mineable/pickaxe", "needs_stone_tool"):
            path = self.resources / f"data/minecraft/tags/block/{tag}.json"
            content = self.read(path)
            self.expect(content.get("replace") is False, path, "tool tag must extend vanilla, not replace it")
            self.expect(content.get("values") == ["riftbound:rift_anchor"], path, "tool tag must contain exactly the anchor")

    def localization_and_advancements(self) -> None:
        path = self.assets / "lang/en_us.json"
        lang = self.read(path)
        for name in ITEMS:
            self.expect(bool(lang.get("item.riftbound." + name)), path, f"missing item name for {name}")
            self.expect(bool(lang.get("tooltip.riftbound." + name)), path, f"missing tooltip for {name}")
        self.expect(bool(lang.get("block.riftbound.rift_anchor")), path, "missing anchor block name")
        self.expect(bool(lang.get("itemGroup.riftbound")), path, "missing creative tab name")
        for key, value in lang.items():
            self.expect(isinstance(value, str) and bool(value.strip()), path, f"empty/non-text localization value for {key}")
        for advancement_path in (self.data / "advancement").rglob("*.json"):
            advancement = self.read(advancement_path)
            parent = advancement.get("parent", "")
            if isinstance(parent, str) and parent.startswith("riftbound:"):
                ref = self.data / "advancement" / (parent.split(":", 1)[1] + ".json")
                self.expect(ref.is_file(), advancement_path, f"missing advancement parent {parent}")
                self.expect(ref != advancement_path, advancement_path, "advancement cannot parent itself")
            display = advancement.get("display", {})
            if display:
                self.registry_id(display.get("icon", {}).get("id"), advancement_path)
                for label in ("title", "description"):
                    key = display.get(label, {}).get("translate")
                    self.expect(key in lang, advancement_path, f"missing {label} translation {key!r}")
            criteria = advancement.get("criteria", {})
            for requirement in advancement.get("requirements", []):
                self.expect(bool(requirement) and all(key in criteria for key in requirement), advancement_path, "requirements contain an unknown criterion")
            for criterion in criteria.values():
                for predicate in criterion.get("conditions", {}).get("items", []):
                    for item in predicate.get("items", []):
                        self.registry_id(item, advancement_path)

    def run(self) -> None:
        for path in self.resources.rglob("*.json"):
            self.read(path)
        for legacy in ("recipes", "advancements", "loot_tables", "tags/blocks", "tags/items"):
            self.expect(not (self.data / legacy).exists(), self.data / legacy, "Minecraft 1.21.1 uses singular resource directories")
            self.expect(not (self.resources / "data/minecraft" / legacy).exists(), self.resources / "data/minecraft" / legacy, "Minecraft 1.21.1 uses singular resource directories")
        self.models()
        self.recipes()
        self.loot_and_tags()
        self.localization_and_advancements()
        lang_path = self.assets / "lang/en_us.json"
        lang = self.read(lang_path)
        for suffix in ("reinforcements", "reinforcements_arrived", "pincer", "standard_bearer"):
            key = "message.riftbound.encounter." + suffix
            self.expect(isinstance(lang.get(key), str) and bool(lang[key].strip()), lang_path,
                        f"missing encounter telegraph {key}")
        self.expect(bool(lang.get("entity.riftbound.standard_bearer")), lang_path,
                    "missing priority target name")
        fabric_path = self.resources / "fabric.mod.json"
        if fabric_path.exists():
            fabric = self.read(fabric_path)
            self.expect(fabric.get("id") == "riftbound", fabric_path, "mod ID must match the resources namespace")
            self.expect(fabric.get("icon") == "assets/riftbound/icon.png", fabric_path, "metadata must point to the generated mod icon")
        if self.errors:
            raise SystemExit("Resource validation failed:\n" + "\n".join(f"- {error}" for error in self.errors))
        print(f"Resources valid: {len(self.parsed)} JSON files; 10 item models; 12 16x16 textures; 9 reachable recipes; anchor loot/tags; localization and advancement links.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1], help="Project root to validate (useful for testing broken fixtures)")
    args = parser.parse_args()
    Validator(args.root.resolve()).run()


if __name__ == "__main__":
    main()
