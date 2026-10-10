#!/usr/bin/env python3
"""Optional architectural preview of committed NBT; requires Pillow.

This is a geometry illustration, not an in-game screenshot or texture preview.
No Minecraft textures are bundled. The production build needs no image library.
"""
from __future__ import annotations

import gzip
import io
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from generate_structures import COMPOUND, OUT, ROOT, decode_payload


COLORS = {
    "mossy_stone_bricks": (117, 138, 112), "stone_bricks": (151, 160, 155),
    "green_stained_glass": (71, 151, 126), "cyan_stained_glass": (82, 164, 184),
    "waxed_weathered_cut_copper": (88, 154, 128), "waxed_oxidized_cut_copper": (70, 142, 121),
    "waxed_weathered_cut_copper_slab": (88, 154, 128), "exposed_cut_copper": (185, 139, 94),
    "water": (63, 140, 184), "dark_oak_planks": (112, 87, 59), "dark_oak_fence": (85, 69, 48),
    "stripped_dark_oak_log": (100, 82, 57), "barrel": (183, 145, 79), "lantern": (238, 190, 85),
    "shroomlight": (240, 187, 105), "orange_terracotta": (158, 104, 75),
    "polished_andesite": (161, 167, 162), "polished_deepslate": (75, 87, 91),
    "deepslate_tiles": (73, 81, 90), "rail": (182, 174, 151), "gravel": (126, 126, 124),
    "granite": (139, 111, 105), "iron_bars": (146, 156, 160), "ladder": (195, 157, 92),
    "red_stained_glass": (208, 100, 82), "yellow_terracotta": (191, 151, 79),
    "stone_brick_stairs": (151, 160, 155),
}


def load(name):
    stream = io.BytesIO(gzip.decompress((OUT / (name + ".nbt")).read_bytes()))
    assert stream.read(3) == b"\x0a\x00\x00"
    root = decode_payload(stream, COMPOUND)
    palette = root["palette"][1][1]
    size = root["size"][1][1]
    blocks = {}
    for entry in root["blocks"][1][1]:
        x, y, z = entry["pos"][1][1]
        state = palette[entry["state"][1]]
        kind = state["Name"][1].removeprefix("minecraft:")
        if kind != "air":
            blocks[x, y, size[2] - 1 - z] = kind
    return size, blocks


def geometry(name, panel_size):
    size, blocks = load(name)
    transparent = {"green_stained_glass", "cyan_stained_glass", "water"}
    scale = 14
    canvas = Image.new("RGBA", (1450, 1050), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas, "RGBA")

    def point(x, y, z):
        return (700 + (x - z) * scale, 460 + (x + z) * scale / 2 - y * scale)

    for (x, y, z), kind in sorted(blocks.items(), key=lambda item: (sum(item[0]), item[0][1], item[0][2])):
        color = COLORS.get(kind, (143, 148, 141))
        # Thin authored objects are simplified cuboids for legibility; template
        # tests, not this illustration, validate collision and state properties.
        alpha = 105 if kind in transparent else 255
        faces = [
            ((x + 1, y, z), [(x + 1, y, z), (x + 1, y, z + 1), (x + 1, y + 1, z + 1), (x + 1, y + 1, z)], .70),
            ((x, y, z + 1), [(x, y, z + 1), (x + 1, y, z + 1), (x + 1, y + 1, z + 1), (x, y + 1, z + 1)], .84),
            ((x, y + 1, z), [(x, y + 1, z), (x + 1, y + 1, z), (x + 1, y + 1, z + 1), (x, y + 1, z + 1)], 1.05),
        ]
        for neighbor, corners, brightness in faces:
            if neighbor in blocks and blocks[neighbor] not in transparent:
                continue
            polygon = [point(*corner) for corner in corners]
            tint = tuple(min(255, round(channel * brightness)) for channel in color)
            draw.polygon(polygon, fill=tint + (alpha,))
            if kind not in transparent:
                draw.line(polygon + polygon[:1], fill=(43, 57, 55, 95), width=1)
    crop = canvas.getbbox()
    assert crop is not None
    canvas = canvas.crop(crop)
    canvas.thumbnail(panel_size, Image.Resampling.LANCZOS)
    return canvas


def font(size, bold=False):
    suffix = "-Bold" if bold else ""
    try:
        return ImageFont.truetype(f"/usr/share/fonts/truetype/dejavu/DejaVuSans{suffix}.ttf", size)
    except OSError:
        return ImageFont.load_default(size=size)


def main():
    image = Image.new("RGB", (1600, 850), (17, 28, 33))
    draw = ImageDraw.Draw(image)
    draw.text((52, 30), "COPPERWAKE  /  EXPEDITION LANDMARKS", fill=(236, 227, 201), font=font(30, True))
    draw.text((52, 76), "Original voxel architecture from committed Minecraft structure NBT", fill=(145, 176, 178), font=font(20))
    for left, name, title, subtitle, detail in [
        (36, "siphon_gardens", "Siphon Gardens", "Verdigris Woods  /  35 x 19 x 31", "Four cisterns • pump gallery • aqueduct inspection lane"),
        (812, "switchyard_depot", "Switchyard Depot", "Oxide Flats + Cinder Works  /  39 x 17 x 35", "Freight platforms • dispatch office • raised signal bridge"),
    ]:
        draw.rounded_rectangle((left, 126, left + 752, 782), 18, fill=(27, 44, 49), outline=(62, 88, 89), width=2)
        draw.text((left + 24, 148), title, fill=(244, 214, 162), font=font(30, True))
        draw.text((left + 24, 192), subtitle, fill=(146, 181, 179), font=font(20))
        art = geometry(name, (700, 474))
        image.paste(art, (left + (752 - art.width) // 2, 234 + (474 - art.height) // 2), art)
        draw.text((left + 24, 732), detail, fill=(188, 202, 191), font=font(19))
    draw.text((52, 806), "Geometry illustration. Simplified colors and transparency; client visuals and terrain need playtesting.", fill=(143, 165, 165), font=font(18))
    output = ROOT / "docs/expedition-landmarks.png"
    image.save(output, optimize=True)
    print(output)


if __name__ == "__main__":
    main()
