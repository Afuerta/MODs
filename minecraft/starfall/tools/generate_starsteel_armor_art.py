#!/usr/bin/env python3
"""Recreate the original Starsteel armor's editable .px sources.

The vanilla 64 x 32 humanoid UV positions were checked against Minecraft
1.21.1's iron armor textures. No vanilla pixels are copied. The palette,
inventory silhouettes, embossed stars and layered plate patterns are original.
"""

from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "src/main/pixelart"
PALETTE = {
    "a": "#1A1838",  # outline / deep indigo
    "b": "#EEF8FF",  # reflected starlight
    "c": "#C4E2FF",  # cold steel
    "d": "#5A79B8",  # shaded steel
    "e": "#FFE79A",  # celestial inlay
    "f": "#3A4A86",  # recessed plate
    "g": "#8FB8E8",  # middle steel
    "h": "#B78B46",  # shaded gold
}

ITEMS = {
    "helmet": [
        "................",
        "......aaaa......",
        "....aabbebaa....",
        "...abccceccda...",
        "..abccccccccda..",
        "..abccccecgcda..",
        "..acccceeeccda..",
        "..aheeeeeeehfa..",
        "..acdffffffgfa..",
        "..acd......gfa..",
        "..acd......gfa..",
        "..acd......gfa..",
        "..aeg......hfa..",
        "...aa......aa...",
        "................",
        "................",
    ],
    "chestplate": [
        "................",
        "..aaa......aaa..",
        ".abehaa..aaheba.",
        "abcccea..aeccdda",
        "accgceeaaeecgdda",
        "aghgccebbecgdhfa",
        ".aaacccbcccdaaa.",
        "...accbebccda...",
        "...acbehebdda...",
        "...accbebcdda...",
        "...agdcbdddfa...",
        "...agddbdddfa...",
        "...aheeeeehfa...",
        "...abggggddfa...",
        "....aaaaaaaa....",
        "................",
    ],
    "leggings": [
        "................",
        "...aaaaaaaaaa...",
        "..aheeeeeeehfa..",
        "..accccbdgddfa..",
        "..accgbbdgddfa..",
        "..acccbaabddfa..",
        "..acccda.addfa..",
        "..acbeda.aedfa..",
        "..aceeda.aehfa..",
        "..acbeda.aedfa..",
        "..agggda.addfa..",
        "..acggda.addfa..",
        "..aeghda.ahdfa..",
        "..agddfa.afdfa..",
        "...aaaa...aaa...",
        "................",
    ],
    "boots": [
        "................",
        "................",
        "..aaaa....aaaa..",
        "..aeha....aeha..",
        "..acga....acga..",
        "..acda....acda..",
        "..abda....abda..",
        "..acda....acda..",
        ".abecda..abecda.",
        "abccccdaabccccda",
        "abggggdaabggggda",
        "aheeehfa aheehfa",
        "affffffaaffffffa",
        ".aaaaaa..aaaaaa.",
        "................",
        "................",
    ],
}
# Keep intentional transparent gaps explicit in the text format.
ITEMS["boots"] = [row.replace(" ", ".") for row in ITEMS["boots"]]


def write_px(relative, rows, comment):
    width = len(rows[0])
    assert all(len(row) == width and not (set(row) - set(PALETTE) - {"."}) for row in rows)
    path = ART / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    palette = "\n".join(f"{key} {colour}" for key, colour in PALETTE.items())
    path.write_text(f"// {comment}\npalette:\n{palette}\npixels:\n" + "\n".join(rows) + "\n")


def canvas():
    return [["."] * 64 for _ in range(32)]


def fill(image, x, y, width, height, colour):
    for row in range(y, y + height):
        image[row][x:x + width] = [colour] * width


def plate(image, x, y, width, height, base="c"):
    fill(image, x, y, width, height, base)
    for row in range(height):
        image[y + row][x] = "g"
        image[y + row][x + width - 1] = "f"
    fill(image, x, y, width, 1, "b")
    fill(image, x, y + height - 1, width, 1, "d")


def star(image, x, y):
    """A four-point, five-pixel gold star centered at x,y."""
    for dx, dy in ((0, -1), (-1, 0), (0, 0), (1, 0), (0, 1)):
        image[y + dy][x + dx] = "e"
    image[y][x] = "b"


def torso(image, leggings=False):
    # Body: top, bottom, right, front, left, back. Leggings use only its belt.
    if not leggings:
        plate(image, 20, 16, 8, 4)
        plate(image, 28, 16, 8, 4, "d")
    for x, width in ((16, 4), (20, 8), (28, 4), (32, 8)):
        if leggings:
            plate(image, x, 28, width, 4, "g")
            fill(image, x, 28, width, 1, "h")
            fill(image, x, 29, width, 1, "e")
        else:
            plate(image, x, 20, width, 12, "c" if x == 20 else "g")
            fill(image, x, 30, width, 1, "h")
            fill(image, x, 31, width, 1, "e")
    if not leggings:
        # Neckline, breastplate split, star, and rear constellation rivets.
        fill(image, 22, 20, 4, 1, "f")
        fill(image, 23, 21, 2, 1, "f")
        for y in range(26, 30):
            image[y][23] = "b"
            image[y][24] = "d"
        star(image, 23, 24)
        star(image, 35, 23)
        image[27][34] = "e"
        image[28][37] = "e"


def armor_layers():
    outer, inner = canvas(), canvas()
    # Helmet. Open visor reveals the player's face; gold brow joins all sides.
    plate(outer, 8, 0, 8, 8)
    for x in (0, 8, 16, 24):
        plate(outer, x, 8, 8, 8, "c" if x == 8 else "g")
        fill(outer, x, 10, 8, 1, "h")
        fill(outer, x, 11, 8, 1, "e")
    fill(outer, 10, 12, 4, 4, ".")
    star(outer, 11, 9)
    star(outer, 27, 13)
    torso(outer)
    torso(inner, leggings=True)
    # Arms. Mirrored UV makes the pair symmetric. Gold pauldrons, steel forearms.
    plate(outer, 44, 16, 4, 4)
    plate(outer, 48, 16, 4, 4, "d")
    for x in (40, 44, 48, 52):
        plate(outer, x, 20, 4, 12, "c" if x == 44 else "g")
        fill(outer, x, 22, 4, 1, "e")
        fill(outer, x, 26, 4, 1, "f")
        fill(outer, x, 30, 4, 1, "e")
    star(outer, 45, 24)
    # Layer 1 legs are boots: transparent above the calf; soles use leg bottom UV.
    plate(outer, 8, 16, 4, 4, "f")
    for x in (0, 4, 8, 12):
        plate(outer, x, 26, 4, 6, "c" if x == 4 else "g")
        fill(outer, x, 26, 4, 1, "e")
        fill(outer, x, 31, 4, 1, "a")
    star(outer, 5, 28)
    # Layer 2 legs: upper plates, knee stars and recessed greaves behind boots.
    plate(inner, 4, 16, 4, 4)
    plate(inner, 8, 16, 4, 4, "d")
    for x in (0, 4, 8, 12):
        plate(inner, x, 20, 4, 12, "c" if x == 4 else "g")
        fill(inner, x, 26, 4, 1, "f")
    star(inner, 5, 25)
    return outer, inner


def main():
    for item, rows in ITEMS.items():
        write_px(f"item/starsteel_{item}.px", rows, f"Original Starsteel {item}: icy metal, indigo shadows and gold star inlay.")
    for number, image in enumerate(armor_layers(), 1):
        write_px(f"models/armor/starsteel_layer_{number}.px", ["".join(row) for row in image],
                 f"Original Starsteel armor layer {number}. Vanilla humanoid UV, 64 x 32. Generated by tools/generate_starsteel_armor_art.py.")
    print("Wrote four Starsteel item sprites and two 64 x 32 armor layers.")


if __name__ == "__main__":
    main()
