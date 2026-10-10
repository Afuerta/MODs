#!/usr/bin/env python3
"""Render Starfall pixel-art (.px) files to PNG for previewing.

The Gradle build does the same conversion (task `renderPixelArt`), so you only
need this script to *look* at textures while editing them.

Usage:
    python3 tools/px_render.py                 # contact sheet -> build/px-preview/sheet.png
    python3 tools/px_render.py --scale 16      # bigger preview
    python3 tools/px_render.py --out DIR       # also write every texture as a PNG

.px format (see AGENTS.md for the full description):
    // comment
    palette:
    a #2A2346
    b #FFFFFF80        <- optional alpha
    pixels:
    aaaabbbb........   <- one row per line, '.' is transparent
"""
import argparse
import pathlib
import sys

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    sys.exit("Pillow is required: pip install pillow")

ROOT = pathlib.Path(__file__).resolve().parent.parent
PX_DIR = ROOT / "src" / "main" / "pixelart"


def parse_color(text):
    text = text.lstrip("#")
    if len(text) == 6:
        text += "FF"
    if len(text) != 8:
        raise ValueError(f"bad colour '{text}'")
    return tuple(int(text[i:i + 2], 16) for i in range(0, 8, 2))


def parse_px(path):
    palette = {".": (0, 0, 0, 0)}
    rows = []
    mode = None
    for lineno, raw in enumerate(path.read_text().splitlines(), 1):
        line = raw.rstrip()
        if not line or line.lstrip().startswith("//"):
            continue
        if line == "palette:":
            mode = "palette"
            continue
        if line == "pixels:":
            mode = "pixels"
            continue
        if mode == "palette":
            key, colour = line.split()
            if len(key) != 1:
                raise ValueError(f"{path}:{lineno}: palette key must be one character")
            palette[key] = parse_color(colour)
        elif mode == "pixels":
            rows.append(line)
        else:
            raise ValueError(f"{path}:{lineno}: expected 'palette:' or 'pixels:' first")
    if not rows:
        raise ValueError(f"{path}: no pixel rows")
    width = len(rows[0])
    for i, row in enumerate(rows):
        if len(row) != width:
            raise ValueError(f"{path}: row {i} has {len(row)} pixels, expected {width}")
        for ch in row:
            if ch not in palette:
                raise ValueError(f"{path}: row {i} uses '{ch}' which is not in the palette")
    img = Image.new("RGBA", (width, len(rows)))
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            img.putpixel((x, y), palette[ch])
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scale", type=int, default=8)
    ap.add_argument("--out", type=pathlib.Path)
    args = ap.parse_args()

    files = sorted(PX_DIR.rglob("*.px"))
    images = []
    for f in files:
        img = parse_px(f)
        rel = f.relative_to(PX_DIR).with_suffix(".png")
        images.append((rel, img))
        if args.out:
            dest = args.out / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            img.save(dest)

    # Contact sheet: first 16x16 frame of each texture on a checkerboard.
    s = args.scale
    cols = 6
    cell = 16 * s + 8
    rows = (len(images) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell, rows * cell), (40, 40, 48, 255))
    for i, (rel, img) in enumerate(images):
        frame = img.crop((0, 0, img.width, min(img.height, img.width)))
        big = frame.resize((frame.width * s, frame.height * s), Image.NEAREST)
        bg = Image.new("RGBA", big.size)
        for y in range(0, big.height, s * 2):
            for x in range(0, big.width, s * 2):
                for dy, dx, c in ((0, 0, 70), (0, s, 90), (s, 0, 90), (s, s, 70)):
                    bg.paste((c, c, c, 255), (x + dx, y + dy, x + dx + s, y + dy + s))
        bg.alpha_composite(big)
        sheet.paste(bg, ((i % cols) * cell + 4, (i // cols) * cell + 4))
    out = ROOT / "build" / "px-preview" / "sheet.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print(f"Rendered {len(images)} textures -> {out}")
    for rel, _ in images:
        print("  ", rel)


if __name__ == "__main__":
    main()
