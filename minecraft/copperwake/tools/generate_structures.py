#!/usr/bin/env python3
"""Author and validate Copperwake's original structures; standard library only.

Run from any directory. Gzip mtime=0 and stable block order make output identical.
All architecture is original voxel code, with Minecraft's vanilla block palette.
"""
from __future__ import annotations

import gzip
from collections import deque
import io
import json
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/main/resources/data/copperwake/structure"
BYTE, INT, DOUBLE, STRING, LIST, COMPOUND = 1, 3, 6, 8, 9, 10


def string(value):
    data = value.encode("utf-8")
    return struct.pack(">H", len(data)) + data


def encode_payload(kind, value):
    if kind == BYTE:
        return struct.pack(">b", value)
    if kind == INT:
        return struct.pack(">i", value)
    if kind == DOUBLE:
        return struct.pack(">d", value)
    if kind == STRING:
        return string(value)
    if kind == LIST:
        element_kind, values = value
        return bytes([element_kind]) + struct.pack(">i", len(values)) + b"".join(
            encode_payload(element_kind, item) for item in values
        )
    if kind == COMPOUND:
        return b"".join(
            bytes([tag]) + string(name) + encode_payload(tag, payload)
            for name, (tag, payload) in value.items()
        ) + b"\x00"
    raise ValueError(kind)


def decode_payload(stream, kind):
    def read_string():
        return stream.read(struct.unpack(">H", stream.read(2))[0]).decode("utf-8")
    if kind == BYTE:
        return struct.unpack(">b", stream.read(1))[0]
    if kind == INT:
        return struct.unpack(">i", stream.read(4))[0]
    if kind == DOUBLE:
        return struct.unpack(">d", stream.read(8))[0]
    if kind == STRING:
        return read_string()
    if kind == LIST:
        tag = stream.read(1)[0]
        size = struct.unpack(">i", stream.read(4))[0]
        return tag, [decode_payload(stream, tag) for _ in range(size)]
    if kind == COMPOUND:
        result = {}
        while tag := stream.read(1)[0]:
            name = read_string()
            result[name] = (tag, decode_payload(stream, tag))
        return result
    raise ValueError(kind)


class Structure:
    def __init__(self, name, size):
        self.name, self.size = name, size
        self.blocks, self.entities, self.loot_positions = {}, [], []
        self.entrance = None

    def block(self, x, y, z, name, properties=None, nbt=None):
        assert all(0 <= n < bound for n, bound in zip((x, y, z), self.size)), (self.name, x, y, z)
        state = {"Name": (STRING, name if ":" in name else "minecraft:" + name)}
        if properties:
            state["Properties"] = (COMPOUND, {k: (STRING, str(v)) for k, v in sorted(properties.items())})
        self.blocks[x, y, z] = (state, nbt)

    def fill(self, x0, y0, z0, x1, y1, z1, name, properties=None):
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1):
                for z in range(z0, z1 + 1):
                    self.block(x, y, z, name, properties)

    def ring(self, x0, z0, x1, z1, y, name, properties=None):
        self.fill(x0, y, z0, x1, y, z0, name, properties)
        self.fill(x0, y, z1, x1, y, z1, name, properties)
        self.fill(x0, y, z0 + 1, x0, y, z1 - 1, name, properties)
        self.fill(x1, y, z0 + 1, x1, y, z1 - 1, name, properties)

    def barrel(self, x, y, z, loot=None):
        self.block(x, y, z, "barrel", {"facing": "up", "open": "false"}, {
            "id": (STRING, "minecraft:barrel"),
            "LootTable": (STRING, "copperwake:chests/" + (loot or self.name)),
        })
        self.loot_positions.append((x, y, z))

    def guard(self, x, y, z, entity):
        self.entities.append({
            "pos": (LIST, (DOUBLE, [float(x) + 0.5, float(y), float(z) + 0.5])),
            "blockPos": (LIST, (INT, [x, y, z])),
            "nbt": (COMPOUND, {
                "id": (STRING, "copperwake:" + entity),
                "Pos": (LIST, (DOUBLE, [float(x) + 0.5, float(y), float(z) + 0.5])),
                "PersistenceRequired": (BYTE, 1),
            }),
        })

    def encoded(self):
        palette, indexes, blocks = [], {}, []
        for position, (state, nbt) in sorted(self.blocks.items(), key=lambda b: (b[0][1], b[0][2], b[0][0])):
            key = json.dumps(state, sort_keys=True)
            if key not in indexes:
                indexes[key] = len(palette)
                palette.append(state)
            entry = {"pos": (LIST, (INT, list(position))), "state": (INT, indexes[key])}
            if nbt is not None:
                entry["nbt"] = (COMPOUND, nbt)
            blocks.append(entry)
        root = {
            "DataVersion": (INT, 3955),
            "size": (LIST, (INT, list(self.size))),
            "palette": (LIST, (COMPOUND, palette)),
            "blocks": (LIST, (COMPOUND, blocks)),
            "entities": (LIST, (COMPOUND, self.entities)),
        }
        # Positive jigsaw depth is required for the start piece in 1.21.1.
        # No connectors means that depth one remains a single-piece landmark.
        assert all(state["Name"][1] != "minecraft:jigsaw" for state in palette), (self.name, "unexpected jigsaw connector")
        encoded = bytes([COMPOUND]) + string("") + encode_payload(COMPOUND, root)
        # Round-trip the entire binary tag tree, not just its header or gzip stream.
        stream = io.BytesIO(encoded)
        assert stream.read(3) == b"\x0a\x00\x00"
        assert decode_payload(stream, COMPOUND) == root
        assert not stream.read()
        for position in self.loot_positions:
            assert self.blocks[position][1]["LootTable"][1].startswith("copperwake:chests/")
            x, y, z = position
            above = self.blocks.get((x, y + 1, z))
            assert above is None or above[0]["Name"][1] == "minecraft:air", (self.name, "blocked loot", position)
            loot = self.blocks[position][1]["LootTable"][1].removeprefix("copperwake:")
            assert (ROOT / "src/main/resources/data/copperwake/loot_table" / (loot + ".json")).is_file(), (self.name, "missing loot", loot)
        if self.entrance is not None:
            self.validate_access()
        return encoded

    def validate_access(self):
        """Conservative two-block headroom route check with one-block steps/ladders.

        This checks authored geometry, not Minecraft pathfinding or naturally
        generated slopes. Every cache must have a reachable adjacent opening.
        """
        def name(pos):
            return self.blocks.get(pos, ({"Name": (STRING, "minecraft:air")}, None))[0]["Name"][1].removeprefix("minecraft:")

        def clear(pos):
            return name(pos) in {"air", "ladder", "rail"}

        def walkable(pos):
            x, y, z = pos
            if not (0 <= x < self.size[0] and 1 <= y < self.size[1] - 1 and 0 <= z < self.size[2]):
                return False
            below = name((x, y - 1, z))
            supported = below not in {"air", "water", "rail", "ladder", "chain"} and not below.endswith(("fence", "bars"))
            return clear(pos) and clear((x, y + 1, z)) and (supported or name(pos) == "ladder")

        assert walkable(self.entrance), (self.name, "blocked entrance", self.entrance)
        queue, reached = deque([self.entrance]), {self.entrance}
        while queue:
            x, y, z = queue.popleft()
            candidates = [(x + dx, y + dy, z + dz) for dx, dz in ((1, 0), (-1, 0), (0, 1), (0, -1)) for dy in (-1, 0, 1)]
            if name((x, y, z)) == "ladder":
                candidates += [(x, y - 1, z), (x, y + 1, z)]
            for pos in candidates:
                if pos not in reached and walkable(pos):
                    reached.add(pos)
                    queue.append(pos)
        for x, y, z in self.loot_positions:
            assert any((x + dx, y, z + dz) in reached for dx, dz in ((1, 0), (-1, 0), (0, 1), (0, -1))), (self.name, "unreachable barrel", (x, y, z))
        for entity in self.entities:
            position = tuple(entity["blockPos"][1][1])
            assert position in reached, (self.name, "guard has no reachable floor/headroom", position)

    def save(self):
        encoded = self.encoded()
        OUT.mkdir(parents=True, exist_ok=True)
        output = OUT / (self.name + ".nbt")
        output.write_bytes(gzip.compress(encoded, compresslevel=9, mtime=0))
        print(f"{self.name}: {self.size}, {len(self.blocks)} blocks, "
              f"{len(self.loot_positions)} barrels, {len(self.entities)} guards, {output.stat().st_size} bytes")


def salvage_yard():
    s = Structure("salvage_yard", (29, 20, 27))
    # Low yard silhouette, giant cantilever crane, two walk-in shipping sheds.
    s.fill(0, 0, 0, 28, 1, 26, "cobblestone")
    s.fill(1, 2, 1, 27, 18, 25, "air")
    s.fill(1, 1, 1, 27, 1, 25, "gravel")
    for x in range(1, 28):
        for z in range(1, 26):
            if (x * 13 + z * 7) % 11 == 0:
                s.block(x, 1, z, "coarse_dirt")
    for y in (2, 3):
        s.ring(0, 0, 28, 26, y, "dark_oak_fence")
    s.fill(12, 2, 0, 16, 4, 1, "air")
    for x in (11, 17):
        s.fill(x, 2, 0, x, 6, 0, "granite")
    s.fill(11, 6, 0, 17, 6, 0, "exposed_cut_copper")
    for x0, color in ((2, "orange_terracotta"), (20, "cyan_terracotta")):
        s.fill(x0, 2, 4, x0 + 6, 6, 13, color)
        s.fill(x0 + 1, 2, 5, x0 + 5, 5, 12, "air")
        s.fill(x0 + 2, 2, 4, x0 + 4, 4, 4, "air")
        for z in range(5, 14, 3):
            s.fill(x0, 2, z, x0, 5, z, "polished_andesite")
            s.fill(x0 + 6, 2, z, x0 + 6, 5, z, "polished_andesite")
        s.barrel(x0 + 1, 2, 11)
        s.block(x0 + 3, 5, 10, "lantern", {"hanging": "true", "waterlogged": "false"})
    # Crane: tall dual columns, triangulated beam, suspended hook above a salvage pile.
    for x in (5, 8):
        s.fill(x, 2, 20, x, 17, 21, "yellow_terracotta")
    for y in range(3, 17, 3):
        s.fill(6, y, 20, 7, y, 20, "dark_oak_fence")
    s.fill(3, 17, 19, 24, 18, 22, "yellow_terracotta")
    s.fill(3, 18, 20, 24, 18, 21, "polished_andesite")
    s.fill(21, 8, 20, 21, 16, 20, "chain", {"axis": "y", "waterlogged": "false"})
    s.fill(20, 7, 20, 22, 7, 20, "polished_deepslate")
    s.fill(6, 2, 21, 7, 5, 23, "dark_oak_planks")
    s.block(7, 4, 24, "glass")
    # Walkable piles at the rear, deliberately decorative rather than iron-block jackpots.
    for x, z, h in ((12, 18, 3), (16, 21, 4), (22, 17, 2), (13, 23, 2)):
        s.fill(x, 2, z, x + 2, h, z + 2, "polished_andesite")
        s.block(x + 1, h + 1, z + 1, "exposed_cut_copper")
    for z in range(4, 19):
        s.block(13, 2, z, "rail", {"shape": "north_south", "waterlogged": "false"})
    s.barrel(17, 2, 16)
    s.guard(11, 2, 10, "rust_mite")
    s.guard(17, 2, 13, "rust_mite")
    s.guard(24, 2, 22, "coil_sentry")
    return s


def relay_tower():
    s = Structure("relay_tower", (19, 31, 19))
    s.fill(0, 0, 0, 18, 1, 18, "stone_bricks")
    s.fill(1, 2, 1, 17, 30, 17, "air")
    # Octagonal-ish buttressed base with three accessible observation levels.
    s.fill(5, 2, 5, 13, 6, 13, "deepslate_bricks")
    s.fill(6, 2, 6, 12, 5, 12, "air")
    s.fill(8, 2, 5, 10, 4, 6, "air")
    for x, z in ((5, 5), (5, 13), (13, 5), (13, 13)):
        s.fill(x, 7, z, x, 23, z, "stripped_dark_oak_log")
    for y in (7, 14, 21):
        s.fill(3, y, 3, 15, y, 15, "dark_oak_planks")
        s.ring(3, 3, 15, 15, y + 1, "dark_oak_fence")
        # Inner void keeps the scaffold visibly airy from below.
        s.fill(7, y, 7, 11, y, 11, "air")
        s.fill(7, y, 10, 11, y, 10, "dark_oak_planks")
        for x, z in ((4, 4), (14, 4), (4, 14), (14, 14)):
            s.block(x, y + 1, z, "lantern", {"hanging": "false", "waterlogged": "false"})
    # A ladder is continuous from ground to the top deck, with backed blocks and a clear shaft.
    s.fill(6, 2, 11, 6, 23, 11, "polished_deepslate")
    for y in range(2, 24):
        s.block(7, y, 11, "ladder", {"facing": "east", "waterlogged": "false"})
    # Copper coil rings around the mast; open decks distinguish this from the foundry.
    for y in (9, 11, 16, 18):
        s.ring(5, 5, 13, 13, y, "waxed_oxidized_cut_copper_slab", {"type": "bottom", "waterlogged": "false"})
    s.fill(9, 15, 9, 9, 27, 9, "polished_deepslate")
    for x in range(6, 13):
        s.block(x, 26, 9, "waxed_weathered_cut_copper")
    for z in range(6, 13):
        s.block(9, 26, z, "waxed_weathered_cut_copper")
    for y in range(27, 31):
        s.block(9, y, 9, "lightning_rod", {"facing": "up", "powered": "false", "waterlogged": "false"})
    s.barrel(11, 2, 11, "salvage_yard")
    s.barrel(12, 15, 10)
    s.barrel(12, 22, 10)
    s.guard(10, 2, 10, "rust_mite")
    s.guard(11, 8, 12, "coil_sentry")
    s.guard(11, 22, 12, "coil_sentry")
    return s


def foundry():
    s = Structure("foundry", (31, 28, 29))
    s.fill(0, 0, 0, 30, 1, 28, "deepslate_tiles")
    s.fill(1, 2, 1, 29, 27, 27, "air")
    # Enormous open factory hall, heavy ribs, sawtooth roof and paired chimney skyline.
    s.fill(2, 2, 3, 28, 12, 25, "bricks")
    s.fill(3, 2, 4, 27, 11, 24, "air")
    s.fill(12, 2, 3, 18, 6, 4, "air")
    for x in (2, 8, 15, 22, 28):
        s.fill(x, 2, 3, x, 14, 3, "polished_blackstone_bricks")
        s.fill(x, 2, 25, x, 14, 25, "polished_blackstone_bricks")
    for z in range(6, 24, 5):
        for x in (2, 28):
            s.fill(x, 5, z, x, 8, z + 2, "orange_stained_glass")
            s.fill(x, 2, z - 1, x, 12, z - 1, "polished_blackstone_bricks")
    # Repeated gabled roof ridges over the main hall; fully enclosed weatherproof shell.
    for x in range(3, 28):
        ridge_height = 13 + min((x - 3) % 8, 8 - (x - 3) % 8) // 2
        s.fill(x, 12, 4, x, ridge_height, 24, "deepslate_tiles")
        if x % 4 == 0:
            s.fill(x, ridge_height, 9, x, ridge_height, 19, "orange_stained_glass")
    # Twin smokestacks, hollow down to the roof; lit grates imply heat without lava traps.
    for x0, height in ((4, 27), (22, 24)):
        for y in range(13, height + 1):
            s.ring(x0, 19, x0 + 4, 23, y, "polished_blackstone_bricks" if y % 5 == 0 else "bricks")
        s.fill(x0 + 1, 13, 20, x0 + 3, 13, 22, "magma_block")
        s.fill(x0 + 1, 14, 20, x0 + 3, 14, 22, "iron_bars")
    # Central engine: narrow copper shell, furnace banks, safe loot aisles around it.
    s.fill(12, 2, 13, 18, 2, 20, "polished_blackstone")
    s.fill(13, 3, 14, 17, 6, 19, "orange_terracotta")
    s.fill(14, 4, 13, 16, 5, 13, "orange_stained_glass")
    s.fill(14, 4, 14, 16, 5, 14, "shroomlight")
    for x in (12, 18):
        for z in (14, 16, 18):
            s.block(x, 3, z, "blast_furnace", {"facing": "west" if x == 12 else "east", "lit": "false"})
    s.fill(14, 7, 16, 16, 11, 18, "exposed_cut_copper")
    # Upper catwalk circles the hall, with supported continuous ladders and loot overlooks.
    s.fill(3, 8, 4, 27, 8, 6, "dark_oak_planks")
    s.fill(3, 8, 22, 27, 8, 24, "dark_oak_planks")
    s.fill(3, 8, 7, 5, 8, 21, "dark_oak_planks")
    s.fill(25, 8, 7, 27, 8, 21, "dark_oak_planks")
    for x in range(6, 25):
        s.block(x, 9, 6, "iron_bars")
        s.block(x, 9, 22, "iron_bars")
    for z in range(7, 22):
        s.block(5, 9, z, "iron_bars")
        s.block(25, 9, z, "iron_bars")
    for x in (4, 26):
        for y in range(2, 10):
            s.block(x, y, 24, "ladder", {"facing": "north", "waterlogged": "false"})
    for x in (7, 23):
        for z in (7, 21):
            s.block(x, 10, z, "chain", {"axis": "y", "waterlogged": "false"})
            s.block(x, 9, z, "lantern", {"hanging": "true", "waterlogged": "false"})
    # Ground loot does not hand out summon seals; the upper control cache does.
    s.barrel(5, 2, 12, "salvage_yard")
    s.barrel(25, 2, 12, "relay_tower")
    s.barrel(15, 9, 23)
    s.guard(8, 2, 10, "rust_mite")
    s.guard(22, 2, 10, "rust_mite")
    s.guard(10, 2, 20, "coil_sentry")
    s.guard(20, 9, 23, "coil_sentry")
    return s


def siphon_gardens():
    s = Structure("siphon_gardens", (35, 19, 31))
    s.fill(0, 0, 0, 34, 0, 30, "mossy_stone_bricks")
    s.fill(0, 1, 0, 34, 18, 30, "air")
    s.fill(13, 0, 0, 21, 0, 30, "stone_bricks")
    s.fill(1, 0, 12, 33, 0, 19, "stone_bricks")
    # Four shallow cisterns surround an arched, glass-roofed pump gallery.
    # Sealed still water stays inside the basins; the expedition route is dry.
    for x0 in (2, 24):
        for z0 in (3, 20):
            s.fill(x0, 0, z0, x0 + 8, 0, z0 + 8, "stone_bricks")
            for y in (1, 2):
                s.ring(x0, z0, x0 + 8, z0 + 8, y, "mossy_stone_bricks")
            s.fill(x0 + 1, 1, z0 + 1, x0 + 7, 1, z0 + 7, "water", {"level": "0"})
            for x, z in ((x0, z0), (x0 + 8, z0), (x0, z0 + 8), (x0 + 8, z0 + 8)):
                s.fill(x, 3, z, x, 5, z, "waxed_oxidized_cut_copper")
                s.block(x, 6, z, "lantern", {"hanging": "false", "waterlogged": "false"})
    for x in (12, 22):
        s.fill(x, 1, 4, x, 7, 27, "green_stained_glass")
        for z in (4, 11, 20, 27):
            s.fill(x, 1, z, x, 11, z, "waxed_weathered_cut_copper")
    # A greenhouse vault, visibly lower and broader than the relay mast.
    for x in range(12, 23):
        height = 10 + (5 - abs(x - 17)) // 2
        s.fill(x, height, 4, x, height, 27, "green_stained_glass")
        for z in (4, 11, 20, 27):
            s.block(x, height, z, "waxed_oxidized_cut_copper")
    # Four freestanding piers hold a transverse aqueduct and two dry service lanes.
    for x in (3, 8, 26, 31):
        s.fill(x, 1, 15, x, 8, 16, "stone_bricks")
        for y in (3, 6):
            s.fill(x - 1, y, 15, x + 1, y, 16, "mossy_stone_bricks")
    s.fill(1, 9, 12, 33, 9, 19, "stone_bricks")
    for z in (12, 19):
        s.fill(1, 10, z, 33, 10, z, "dark_oak_fence")
    # The southern service lane has two full blocks of headroom through the vault.
    s.fill(1, 10, 18, 33, 11, 18, "air")
    s.fill(1, 10, 13, 33, 11, 13, "air")
    for z in (14, 17):
        s.fill(1, 10, z, 33, 10, z, "waxed_weathered_cut_copper")
    s.fill(1, 10, 15, 33, 10, 16, "water", {"level": "0"})
    for x in (1, 33):
        s.fill(x, 10, 14, x, 10, 17, "waxed_weathered_cut_copper")
    # A central machine, backed ladder and landing connect both ground caches
    # to the elevated inspection cache without blocks or flight.
    s.fill(18, 1, 20, 20, 4, 22, "orange_terracotta")
    s.fill(19, 2, 19, 20, 3, 19, "green_stained_glass")
    s.fill(19, 2, 20, 20, 3, 20, "shroomlight")
    s.fill(20, 5, 21, 20, 8, 21, "waxed_oxidized_cut_copper")
    s.fill(13, 9, 18, 16, 9, 26, "dark_oak_planks")
    # Clear the vault above this landing and its fence gate. The backed ladder
    # exits directly onto the dry inspection lane, rather than onto the roof.
    s.fill(14, 10, 18, 16, 11, 26, "air")
    s.fill(13, 1, 24, 13, 11, 24, "stone_bricks")
    for y in range(1, 12):
        s.block(14, y, 24, "ladder", {"facing": "east", "waterlogged": "false"})
    s.barrel(14, 1, 7, "salvage_yard")
    s.barrel(20, 1, 25, "siphon_gardens")
    # Keep the elevated cache off the rail and on the clear service lane.
    s.barrel(31, 10, 18, "siphon_gardens")
    s.guard(16, 1, 12, "rust_mite")
    s.guard(15, 1, 23, "rust_mite")
    s.guard(20, 1, 11, "coil_sentry")
    s.guard(27, 10, 18, "coil_sentry")
    s.entrance = (17, 1, 0)
    return s


def switchyard_depot():
    s = Structure("switchyard_depot", (39, 17, 35))
    s.fill(0, 0, 0, 38, 0, 34, "granite")
    s.fill(0, 1, 0, 38, 16, 34, "air")
    # Five freight lines fan across a broad apron. Raised loading islands
    # preserve clear passages between the office, bridge and cargo sheds.
    for x in (6, 12, 19, 26, 32):
        s.fill(x - 1, 0, 2, x + 1, 0, 33, "gravel")
        for z in range(2, 34):
            s.block(x, 1, z, "rail", {"shape": "north_south", "waterlogged": "false"})
    for x in (8, 14, 22, 28):
        s.fill(x, 1, 7, x + 2, 1, 23, "polished_andesite")
        for i in range(3):
            s.block(x + i, 1, 6, "stone_brick_stairs", {"facing": "south", "half": "bottom", "shape": "straight", "waterlogged": "false"})
    # Two-storey dispatch office with a tall serrated roof and upper bridge exit.
    s.fill(3, 1, 24, 15, 10, 32, "orange_terracotta")
    s.fill(4, 1, 25, 14, 9, 31, "air")
    s.fill(4, 6, 25, 14, 6, 31, "dark_oak_planks")
    s.fill(8, 1, 24, 10, 3, 25, "air")
    s.fill(8, 7, 24, 10, 9, 25, "air")
    for x in (3, 15):
        for z in (25, 29):
            s.fill(x, 3, z, x, 4, z + 1, "cyan_stained_glass")
            s.fill(x, 8, z, x, 9, z + 1, "cyan_stained_glass")
    for x in range(3, 16):
        height = 11 + (6 - abs(x - 9)) // 2
        s.fill(x, 10, 24, x, height, 32, "deepslate_tiles")
        if x in (8, 9, 10):
            s.fill(x, height, 27, x, height, 29, "cyan_stained_glass")
    for y in range(1, 9):
        s.block(4, y, 29, "ladder", {"facing": "east", "waterlogged": "false"})
    # Dry, fenced signal bridge spans all five lines. A stair connects it
    # to the upper office; nobody needs the Spring Boots to reach its cache.
    for x in (3, 35):
        s.fill(x, 1, 17, x, 7, 20, "polished_deepslate")
    s.fill(3, 7, 17, 35, 7, 20, "dark_oak_planks")
    for z in (17, 20):
        s.fill(3, 8, z, 35, 8, z, "iron_bars")
    s.fill(8, 6, 21, 10, 6, 24, "dark_oak_planks")
    s.fill(8, 8, 20, 10, 9, 20, "air")
    s.fill(8, 7, 21, 10, 7, 21, "stone_brick_stairs", {"facing": "north", "half": "bottom", "shape": "straight", "waterlogged": "false"})
    # Signal mast stands at the bridge edge, leaving both walking lanes open.
    s.fill(19, 8, 17, 19, 15, 17, "polished_deepslate")
    for x in (17, 21):
        s.fill(x, 12, 17, x, 14, 17, "yellow_terracotta")
        s.block(x, 13, 16, "red_stained_glass")
        s.block(x, 13, 17, "shroomlight")
    s.fill(17, 15, 17, 21, 15, 17, "exposed_cut_copper")
    # Open loading canopy and raised cargo platform; cargo is decorative stone
    # and wood rather than mineral blocks that swamp the existing economy.
    s.fill(22, 1, 25, 34, 1, 31, "polished_andesite")
    for x in (21, 35):
        for z in (25, 32):
            s.fill(x, 1, z, x, 8, z, "stripped_dark_oak_log")
    for x in range(20, 37):
        height = 8 + (8 - abs(x - 28)) // 3
        s.fill(x, height, 24, x, height, 33, "waxed_weathered_cut_copper_slab", {"type": "bottom", "waterlogged": "false"})
    s.fill(26, 2, 29, 29, 3, 31, "dark_oak_planks")
    s.fill(30, 2, 30, 32, 4, 31, "polished_andesite")
    for x in (24, 33):
        s.block(x, 5, 26, "lantern", {"hanging": "false", "waterlogged": "false"})
    s.barrel(13, 1, 30, "salvage_yard")
    s.barrel(13, 7, 30, "switchyard_depot")
    s.barrel(23, 2, 27, "switchyard_depot")
    s.guard(18, 1, 10, "rust_mite")
    s.guard(10, 2, 15, "rust_mite")
    s.guard(29, 2, 23, "coil_sentry")
    s.guard(12, 7, 27, "coil_sentry")
    s.guard(30, 8, 19, "coil_sentry")
    s.entrance = (18, 1, 0)
    return s


def authored_structures():
    return (salvage_yard(), relay_tower(), foundry(), siphon_gardens(), switchyard_depot())


def validate_committed():
    for authored in authored_structures():
        expected = authored.encoded()
        path = OUT / (authored.name + ".nbt")
        assert path.is_file(), (authored.name, "missing committed template")
        actual = path.read_bytes()
        assert gzip.decompress(actual) == expected, (authored.name, "committed NBT differs from authored geometry")
        assert actual == gzip.compress(expected, compresslevel=9, mtime=0), (authored.name, "non-deterministic gzip encoding")
    print("Structure validation passed: five complete NBT round-trips, deterministic committed bytes, loot links, and new landmark entrance/cache/guard access.")


if __name__ == "__main__":
    for authored in authored_structures():
        authored.save()
