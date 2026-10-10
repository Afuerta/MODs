#!/usr/bin/env python3
"""Preview the source armor UVs and icons; this is not an in-game screenshot.

Uses Pillow, as does px_render.py. Pass --out PATH to choose another destination.
"""

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

from px_render import parse_px


ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "src/main/pixelart"


def mannequin(outer, inner, back=False):
    figure = Image.new("RGBA", (32, 34))
    draw = ImageDraw.Draw(figure)
    # A neutral dummy beneath the open visor and armor, not a Minecraft skin.
    for rect in ((12, 0, 19, 7), (12, 8, 19, 19), (8, 8, 11, 19),
                 (20, 8, 23, 19), (12, 20, 15, 31), (16, 20, 19, 31)):
        draw.rectangle(rect, fill="#353345")

    def face(texture, rect, position, flip=False):
        crop = texture.crop(rect)
        if flip:
            crop = ImageOps.mirror(crop)
        figure.alpha_composite(crop, position)

    hx, bx, ax, lx = (24, 32, 52, 12) if back else (8, 20, 44, 4)
    face(outer, (hx, 8, hx + 8, 16), (12, 0))
    for texture in (inner, outer):
        face(texture, (bx, 20, bx + 8, 32), (12, 8))
        face(texture, (lx, 20, lx + 4, 32), (12, 20))
        face(texture, (lx, 20, lx + 4, 32), (16, 20), flip=True)
    face(outer, (ax, 20, ax + 4, 32), (8, 8))
    face(outer, (ax, 20, ax + 4, 32), (20, 8), flip=True)
    return figure


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=ROOT / "docs/starsteel-armor.png")
    args = parser.parse_args()
    outer, inner = [parse_px(ART / f"models/armor/starsteel_layer_{n}.px") for n in (1, 2)]
    sheet = Image.new("RGB", (1104, 872), "#111323")
    draw = ImageDraw.Draw(sheet)

    def font(size):
        try:
            return ImageFont.truetype("DejaVuSans.ttf", size)
        except OSError:
            return ImageFont.load_default(size=size)

    def text(x, y, value, size=18, colour="#BAC9E4"):
        draw.text((x, y), value, font=font(size), fill=colour)

    def place(image, x, y, scale):
        big = image.resize((image.width * scale, image.height * scale), Image.Resampling.NEAREST)
        sheet.paste(big, (x, y), big)

    text(40, 25, "STARSTEEL", 36, "#EEF8FF")
    text(42, 73, "Starlight-forged armor  /  original pixel art", 18, "#FFE79A")
    text(42, 110, "Icy steel  /  indigo recesses  /  gold celestial inlay", 16)
    for index, piece in enumerate(("helmet", "chestplate", "leggings", "boots")):
        x = 40 + index * 136
        draw.rounded_rectangle((x, 154, x + 120, 274), radius=8, fill="#20243C")
        place(parse_px(ART / f"item/starsteel_{piece}.px"), x + 12, 166, 6)
        text(x + 5, 285, piece.title(), 16)
    text(42, 336, "LAYER 1   Helmet / chestplate / boots", 18, "#EEF8FF")
    text(42, 659, "LAYER 2   Leggings", 18, "#EEF8FF")

    def atlas(image, x, y, scale):
        for row in range(32):
            for column in range(64):
                colour = "#20243C" if (row // 4 + column // 4) % 2 else "#2A2E49"
                draw.rectangle((x + column * scale, y + row * scale,
                                x + (column + 1) * scale - 1, y + (row + 1) * scale - 1), fill=colour)
        place(image, x, y, scale)

    atlas(outer, 42, 369, 8)
    # Smaller second atlas keeps the entire UV net visible on one page.
    atlas(inner, 42, 694, 4)
    text(321, 710, "Both layers: 64 x 32 px", 15)
    text(321, 738, "Icons: 16 x 16 px", 15)
    text(321, 766, "Source: editable .px text", 15)
    text(628, 152, "FRONT", 18, "#EEF8FF")
    text(879, 152, "BACK", 18, "#EEF8FF")
    place(mannequin(outer, inner), 564, 196, 9)
    place(mannequin(outer, inner, back=True), 809, 196, 9)
    text(618, 540, "Flat UV mannequins", 20, "#FFE79A")
    text(618, 577, "Open visor, star pauldrons and", 17)
    text(618, 605, "layered plates with gold inlay.", 17)
    text(618, 659, "Standard humanoid UV layout.", 16)
    text(618, 687, "Mirrored arm and leg pairs.", 16)
    text(618, 741, "Texture preview, not a game render.", 16)
    text(42, 837, "STARFALL  /  Minecraft Java 1.21.1  /  C03 armor artwork", 14, "#7E8CA9")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(args.out)
    print(args.out)


if __name__ == "__main__":
    main()
