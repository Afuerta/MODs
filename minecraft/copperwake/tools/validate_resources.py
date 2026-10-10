#!/usr/bin/env python3
"""Validate Copperwake resource links and recipe economy without Minecraft or deps.

Optional --minecraft-jar checks referenced vanilla texture paths against an
official client jar. This is a consistency check; loading a server/client remains
necessary to validate Minecraft codecs and rendering behavior.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / "src/main/resources"
NS = "copperwake:"
ITEMS = {
    "scrap", "brass_gear", "memory_glass", "charged_core", "field_journal",
    "survey_key", "arc_gauntlet", "spring_boots", "patch_kit", "foreman_seal",
    "foreman_heart", "salvage_bench", "riveted_copper", "lumen_glass",
    "survey_flare", "field_repairer",
}
BLOCKS = {"salvage_bench", "riveted_copper", "lumen_glass"}
ENTITIES = {"rust_mite", "coil_sentry", "foundry_foreman"}
STRUCTURES = {"salvage_yard", "relay_tower", "foundry", "siphon_gardens", "switchyard_depot"}
ERRORS: list[str] = []


def check(test: bool, path: Path, message: str) -> None:
    if not test:
        ERRORS.append(f"{path.relative_to(ROOT)}: {message}")


def custom_item(value: object, path: Path) -> None:
    if isinstance(value, str) and value.startswith(NS):
        check(value.removeprefix(NS) in ITEMS, path, f"unknown item {value}")


def resource_ref(value: str, category: str, path: Path, suffix=".json") -> None:
    if not isinstance(value, str) or not value.startswith(NS):
        return
    target = RES / "data/copperwake" / category / (value.removeprefix(NS) + suffix)
    check(target.is_file(), path, f"missing {category} reference {value}")


def walk(value: object):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--minecraft-jar", type=Path)
    args = parser.parse_args()
    vanilla_assets = None
    if args.minecraft_jar:
        with zipfile.ZipFile(args.minecraft_jar) as jar:
            vanilla_assets = set(jar.namelist())
    documents = {}
    for path in sorted(RES.rglob("*.json")):
        try:
            documents[path] = json.loads(path.read_text())
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            ERRORS.append(f"{path.relative_to(ROOT)}: invalid JSON: {exc}")

    language_path = RES / "assets/copperwake/lang/en_us.json"
    language = documents.get(language_path, {})
    for item in sorted(ITEMS):
        model = RES / f"assets/copperwake/models/item/{item}.json"
        check(model in documents, model, "missing item model")
        key = f"{'block' if item in BLOCKS else 'item'}.copperwake.{item}"
        check(key in language, language_path, f"missing name {key}")
        check(f"tooltip.copperwake.{item}" in language, language_path, f"missing tooltip for {item}")
    for entity in ENTITIES:
        check(f"entity.copperwake.{entity}" in language, language_path, f"missing entity name {entity}")
    catalog = ROOT / "src/main/java/com/afuerta/copperwake/domain/ContractCatalog.java"
    contract_ids = re.findall(r'contract\("([a-z_]+)"', catalog.read_text())
    check(len(contract_ids) == 22 and len(set(contract_ids)) == 22, catalog, "expected 22 unique authored contracts")
    for contract in contract_ids:
        for field in ("title", "description"):
            key = f"contract.copperwake.{contract}.{field}"
            check(bool(language.get(key)), language_path, f"missing contract translation {key}")
    for source in (ROOT / "src/main/java/com/afuerta/copperwake").glob("*.java"):
        for key in re.findall(r'Text\.translatable\("((?:message|journal)\.copperwake\.[a-z_]+)"', source.read_text()):
            check(bool(language.get(key)), language_path, f"missing device/guidance message {key}")
    for block in BLOCKS:
        for relative in [f"assets/copperwake/blockstates/{block}.json", f"data/copperwake/loot_table/blocks/{block}.json"]:
            path = RES / relative
            check(path in documents, path, "missing block resource")

    recipes = {}
    progression = 0
    for path, doc in documents.items():
        relative = path.relative_to(RES).as_posix()
        if relative.startswith("data/copperwake/recipe/"):
            recipe_id = "copperwake:" + path.relative_to(RES / "data/copperwake/recipe").with_suffix("").as_posix()
            recipes[recipe_id] = doc
            result = doc.get("result", {})
            check("id" in result and "item" not in result, path, "1.21 recipe result requires id")
            custom_item(result.get("id"), path)
            check(1 <= result.get("count", 1) <= 64, path, "invalid output count")
            check(result.get("id") not in {NS + "brass_gear", NS + "charged_core"}, path, "gear/core rewards must not be trivially craftable")
            ingredients = list(doc.get("key", {}).values()) + doc.get("ingredients", [])
            for ingredient in ingredients:
                custom_item(ingredient.get("item"), path)
            if doc.get("type") == "minecraft:crafting_shaped":
                pattern = doc.get("pattern", [])
                check(1 <= len(pattern) <= 3 and len({len(row) for row in pattern}) == 1, path, "invalid recipe pattern")
                check(all(1 <= len(row) <= 3 for row in pattern), path, "recipe is wider than crafting grid")
                used = set("".join(pattern)) - {" "}
                check(used == set(doc.get("key", {})), path, "recipe symbols and keys differ")
            unlock = RES / f"data/copperwake/advancement/recipes/{path.stem}.json"
            check(unlock in documents, path, "missing recipe-book advancement")
            if unlock in documents:
                check(recipe_id in documents[unlock].get("rewards", {}).get("recipes", []), unlock, "recipe unlock rewards do not match recipe")

        if relative.startswith("data/copperwake/advancement/"):
            if "/recipes/" not in relative:
                progression += 1
            resource_ref(doc.get("parent", ""), "advancement", path)
            custom_item(doc.get("display", {}).get("icon", {}).get("id"), path)
            for recipe in doc.get("rewards", {}).get("recipes", []):
                resource_ref(recipe, "recipe", path)
            for obj in walk(doc):
                if "translate" in obj:
                    key = obj["translate"]
                    if key.startswith("advancement.copperwake."):
                        check(key in language, path, f"missing translation {key}")
                if "items" in obj and isinstance(obj["items"], list):
                    for item in obj["items"]:
                        custom_item(item, path)
                if obj.get("trigger") == "minecraft:recipe_unlocked":
                    resource_ref(obj["conditions"]["recipe"], "recipe", path)

        if relative.startswith("data/copperwake/loot_table/"):
            for obj in walk(doc):
                if obj.get("type") == "minecraft:item":
                    custom_item(obj.get("name"), path)
                if obj.get("type") == "minecraft:loot_table":
                    resource_ref(obj.get("value", obj.get("name", "")), "loot_table", path)

        if relative.startswith("assets/copperwake/"):
            for obj in walk(doc):
                for key in ["parent", "model"]:
                    value = obj.get(key, "")
                    if isinstance(value, str) and value.startswith(NS):
                        model_path = RES / "assets/copperwake/models" / (value.removeprefix(NS) + ".json")
                        check(model_path in documents, path, f"missing model reference {value}")
            if "/models/" in relative:
                textures = doc.get("textures", {})
                for element in doc.get("elements", []):
                    a, b = element.get("from", []), element.get("to", [])
                    check(len(a) == len(b) == 3 and all(-16 <= x < y <= 32 for x, y in zip(a, b)), path, "invalid element bounds")
                    rotation = element.get("rotation", {})
                    check(rotation.get("angle", 0) in [-45, -22.5, 0, 22.5, 45], path, "invalid element rotation")
                    for face in element.get("faces", {}).values():
                        texture = face.get("texture", "")
                        if texture.startswith("#"):
                            check(texture[1:] in textures, path, f"undefined texture variable {texture}")
                for texture in textures.values():
                    if texture.startswith("copperwake:"):
                        target = RES / "assets/copperwake/textures" / (texture.removeprefix(NS) + ".png")
                        check(target.is_file(), path, f"missing texture {texture}")
                    elif vanilla_assets is not None and texture.startswith("minecraft:"):
                        target = "assets/minecraft/textures/" + texture.removeprefix("minecraft:") + ".png"
                        check(target in vanilla_assets, path, f"vanilla texture absent from jar: {texture}")

        # World generation is owned separately. Validate its custom links when present.
        if "/worldgen/template_pool/" in relative:
            resource_ref(doc.get("fallback", ""), "worldgen/template_pool", path)
            for entry in doc.get("elements", []):
                element = entry.get("element", {})
                if element.get("element_type") in ["minecraft:single_pool_element", "minecraft:legacy_single_pool_element"]:
                    resource_ref(element.get("location", ""), "structure", path, ".nbt")
        if "/worldgen/structure/" in relative:
            resource_ref(doc.get("start_pool", ""), "worldgen/template_pool", path)
            biomes = doc.get("biomes", "")
            if isinstance(biomes, str) and biomes.startswith("#copperwake:"):
                resource_ref(biomes[1:], "tags/worldgen/biome", path)
            check(doc.get("terrain_adaptation") == "beard_thin", path, "landmarks must retain surface terrain anchoring")
            check(doc.get("project_start_to_heightmap") == "WORLD_SURFACE_WG", path, "landmarks must project to the natural surface")
            check(doc.get("size") == 1, path, "1.21.1 jigsaw starts need positive size to register their first piece")
        if "/worldgen/structure_set/" in relative:
            for entry in doc.get("structures", []):
                resource_ref(entry.get("structure", ""), "worldgen/structure", path)
            placement = doc.get("placement", {})
            check(placement.get("type") == "minecraft:random_spread", path, "unbounded or unsupported placement")
            check(0 < placement.get("separation", 0) < placement.get("spacing", 0) <= 64, path, "invalid landmark spacing/separation")
        if "/worldgen/placed_feature/" in relative:
            resource_ref(doc.get("feature", ""), "worldgen/configured_feature", path)
        if "/worldgen/biome/" in relative:
            for step in doc.get("features", []):
                for feature in step:
                    resource_ref(feature, "worldgen/placed_feature", path)

    key_recipe = recipes.get("copperwake:survey_key", {})
    check(bool(key_recipe), RES / "data/copperwake/recipe/survey_key.json", "missing independent dimension-access recipe")
    for obj in walk(key_recipe.get("key", {})):
        check(not str(obj.get("item", "")).startswith(NS), RES / "data/copperwake/recipe/survey_key.json", "dimension access must not require loot from inside the dimension")
    salts = []
    for name in sorted(STRUCTURES):
        for category in ("worldgen/structure", "worldgen/structure_set", "worldgen/template_pool", "tags/worldgen/biome/has_structure"):
            path = RES / f"data/copperwake/{category}/{name}.json"
            check(path in documents, path, "missing landmark generation definition")
        path = RES / f"data/copperwake/worldgen/structure_set/{name}.json"
        salts.append(documents.get(path, {}).get("placement", {}).get("salt"))
        tag = RES / f"data/copperwake/tags/worldgen/biome/has_structure/{name}.json"
        values = documents.get(tag, {}).get("values", [])
        check(bool(values) and set(values) <= {NS + biome for biome in ("oxide_flats", "verdigris_woods", "cinder_works")}, tag, "landmarks must stay in Rustwild land biomes")
    check(None not in salts and len(salts) == len(set(salts)), RES / "data/copperwake/worldgen/structure_set", "landmark placement salts must be distinct")
    for name in ("siphon_gardens", "switchyard_depot"):
        path = RES / f"data/copperwake/loot_table/chests/{name}.json"
        doc = documents.get(path, {})
        names = [obj.get("name") for obj in walk(doc) if obj.get("type") == "minecraft:item"]
        check(NS + "memory_glass" in names, path, "expedition loot must replenish exploration-only Memory Glass")
        check(all(item.startswith(("minecraft:", NS)) and item not in {NS + "foreman_heart", NS + "foreman_seal"} for item in names), path, "landmark loot must not grant boss/trial-gated rewards")
        check(all(pool.get("rolls") == 1 for pool in doc.get("pools", [])), path, "expedition caches must have fixed bounded rolls")
    try:
        from generate_structures import validate_committed
        validate_committed()
    except (AssertionError, ValueError, OSError) as exc:
        ERRORS.append(f"structure validation: {exc}")
    if ERRORS:
        print("Resource validation FAILED:", file=sys.stderr)
        print("\n".join(f"- {error}" for error in ERRORS), file=sys.stderr)
        return 1
    print(f"Resource validation passed: {len(documents)} JSON files, {len(ITEMS)} modeled items, {len(recipes)} recipes, {progression} progression advancements.")
    print("Checks: JSON, item/recipe/model links, language, loot, voxel bounds, worldgen references and entry-recipe reachability.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
