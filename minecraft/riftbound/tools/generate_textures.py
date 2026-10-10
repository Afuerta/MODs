#!/usr/bin/env python3
"""Draw Riftbound's original 16x16 pixel art, with no downloaded source assets.

Requires Pillow: python -m pip install Pillow
Run from any directory. --check verifies the committed PNGs byte-for-byte.
--preview PATH makes an enlarged contact sheet for art review outside the pack.
"""
from __future__ import annotations

import argparse
import hashlib
import io
from pathlib import Path
import random

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
TEXTURES = ROOT / "src/main/resources/assets/riftbound/textures"
OUTLINE = "#14212c"
ASPECTS = {
    "verdant": ("#2f7358", "#53bf7b", "#c0f291"),
    "ember": ("#aa402e", "#f4883d", "#ffe9a1"),
    "tidal": ("#23618e", "#4abbd1", "#b6f1f1"),
    "hollow": ("#54456e", "#927cb8", "#e2c7f6"),
}


def canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    im = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def echo(aspect: str) -> Image.Image:
    im, d = canvas()
    dark, base, light = ASPECTS[aspect]
    # Four related gems with different silhouettes and readable inner glyphs.
    if aspect == "verdant":
        d.polygon([(3, 11), (4, 6), (8, 2), (13, 2), (13, 7), (9, 12), (5, 13)], fill=OUTLINE)
        d.polygon([(4, 10), (5, 6), (9, 3), (12, 3), (12, 7), (8, 11), (5, 12)], fill=base)
        d.line([(5, 11), (10, 6), (11, 4)], fill=light, width=1)
        d.line([(7, 9), (7, 6)], fill=dark, width=1)
        d.line([(9, 7), (11, 7)], fill=dark, width=1)
        d.line([(3, 14), (6, 11)], fill=dark, width=1)
    elif aspect == "ember":
        d.polygon([(8, 1), (11, 5), (12, 3), (14, 8), (12, 13), (8, 15), (3, 12), (2, 8), (5, 3), (5, 7)], fill=OUTLINE)
        d.polygon([(8, 3), (10, 7), (12, 6), (13, 9), (11, 12), (8, 14), (4, 11), (3, 8), (5, 6), (6, 9)], fill=base)
        d.polygon([(8, 7), (10, 10), (9, 13), (6, 12), (6, 10)], fill=light)
        d.line([(4, 9), (5, 11)], fill=dark, width=1)
    elif aspect == "tidal":
        d.polygon([(8, 1), (13, 8), (14, 11), (12, 14), (4, 14), (2, 11), (3, 8)], fill=OUTLINE)
        d.polygon([(8, 3), (12, 9), (13, 11), (11, 13), (5, 13), (3, 11), (4, 9)], fill=base)
        d.line([(4, 10), (6, 9), (8, 10), (10, 11), (12, 10)], fill=light, width=1)
        d.line([(5, 12), (7, 11), (9, 12), (11, 12)], fill=dark, width=1)
        d.point((7, 5), fill=light)
        d.point((6, 6), fill=light)
    else:
        d.polygon([(9, 1), (13, 4), (14, 10), (11, 14), (5, 14), (2, 11), (2, 6), (5, 2)], fill=OUTLINE)
        d.polygon([(8, 3), (5, 5), (4, 9), (6, 12), (10, 12), (12, 10), (11, 13), (6, 13), (3, 10), (3, 6), (6, 3)], fill=base)
        d.line([(6, 4), (4, 7), (4, 9)], fill=light, width=1)
        d.point((11, 5), fill=light)
        d.point((12, 7), fill=base)
        d.point((9, 8), fill=dark)
    return im


def shard() -> Image.Image:
    im, d = canvas()
    d.polygon([(9, 1), (13, 5), (10, 12), (5, 15), (3, 10), (5, 4)], fill=OUTLINE)
    d.polygon([(9, 2), (12, 5), (9, 11), (5, 14), (4, 10), (6, 5)], fill="#54c3cb")
    d.polygon([(9, 2), (9, 9), (5, 14), (6, 6)], fill="#d8fff0")
    d.line([(10, 6), (8, 11)], fill="#308591", width=1)
    d.point((2, 4), fill="#aef3d7")
    d.point((14, 10), fill="#aef3d7")
    return im


def relic(kind: str) -> Image.Image:
    im, d = canvas()
    d.polygon([(5, 1), (10, 1), (14, 5), (14, 10), (10, 14), (5, 14), (1, 10), (1, 5)], fill=OUTLINE)
    d.polygon([(5, 2), (10, 2), (13, 5), (13, 10), (10, 13), (5, 13), (2, 10), (2, 5)], fill="#85523e")
    d.line([(5, 2), (10, 2), (13, 5)], fill="#edb975", width=1)
    d.rectangle((4, 4, 11, 11), fill="#263640")
    if kind == "dormant":
        d.polygon([(8, 4), (10, 8), (8, 11), (5, 8)], fill="#6b7289")
        d.line([(8, 5), (6, 8)], fill="#a3a6ba", width=1)
    elif kind == "wayfarer":
        d.polygon([(6, 4), (9, 4), (9, 8), (11, 9), (11, 11), (5, 11), (5, 9), (6, 8)], fill="#71cfc9")
        d.line([(6, 5), (8, 5)], fill="#d7fff0", width=1)
        d.line([(5, 11), (11, 11)], fill="#2b8c99", width=1)
    elif kind == "bulwark":
        d.polygon([(4, 5), (8, 4), (11, 5), (11, 8), (8, 12), (4, 8)], fill="#dbb668")
        d.line([(8, 5), (8, 10)], fill="#fff0b0", width=1)
        d.line([(5, 6), (10, 6)], fill="#fff0b0", width=1)
    else:
        d.line([(5, 11), (9, 5)], fill="#af905d", width=2)
        d.line([(8, 4), (10, 4), (12, 6), (12, 8), (10, 9)], fill="#a9e68e", width=2)
        d.line([(9, 4), (11, 5), (12, 7)], fill="#ebffd7", width=1)
    return im


def anchor(face: str) -> Image.Image:
    # A stable per-face seed makes each texture reproducible across Python runs.
    seed = int.from_bytes(hashlib.sha256(("riftbound/anchor/" + face).encode()).digest()[:8], "big")
    rng = random.Random(seed)
    im = Image.new("RGBA", (16, 16))
    d = ImageDraw.Draw(im)
    for y in range(16):
        for x in range(16):
            shade = rng.randint(-8, 8)
            d.point((x, y), fill=(max(0, 31 + shade), max(0, 34 + shade), max(0, 48 + shade), 255))
    d.rectangle((0, 0, 15, 15), outline="#624b46")
    if face == "top":
        d.rectangle((1, 1, 14, 14), outline="#a57252")
        d.polygon([(7, 2), (13, 7), (13, 8), (8, 13), (7, 13), (2, 8), (2, 7)], outline="#608d96")
        d.rectangle((6, 6, 9, 9), fill="#d6f1db")
        for box, aspect in [((6, 2, 9, 4), "verdant"), ((11, 6, 13, 9), "ember"), ((6, 11, 9, 13), "tidal"), ((2, 6, 4, 9), "hollow")]:
            d.rectangle(box, fill=ASPECTS[aspect][1])
        d.point((7, 7), fill="#ffffff")
    elif face == "side":
        d.rectangle((1, 1, 14, 2), fill="#a57252")
        d.rectangle((1, 13, 14, 14), fill="#624b46")
        d.line([(2, 4), (4, 6), (3, 9), (5, 12)], fill="#45465d", width=1)
        d.line([(13, 4), (11, 7), (12, 10)], fill="#45465d", width=1)
        d.polygon([(7, 4), (10, 7), (8, 11), (5, 8)], fill="#3c737d")
        d.line([(7, 5), (7, 9), (8, 10)], fill="#a6e3d6", width=1)
        d.point((8, 6), fill="#e2fff0")
    else:
        d.rectangle((3, 3, 12, 12), outline="#45465d")
        d.line([(4, 11), (11, 4)], fill="#3d3d50", width=1)
    return im


def images() -> dict[str, Image.Image]:
    return {
        **{f"item/{aspect}_echo.png": echo(aspect) for aspect in ASPECTS},
        "item/resonance_shard.png": shard(),
        **{f"item/{kind}_relic.png": relic(kind) for kind in ("dormant", "wayfarer", "bulwark", "harvester")},
        **{f"block/rift_anchor_{face}.png": anchor(face) for face in ("top", "side", "bottom")},
    }


def mod_icon() -> Image.Image:
    im = Image.new("RGBA", (64, 64), "#14212c")
    d = ImageDraw.Draw(im)
    d.rectangle((2, 2, 61, 61), outline="#a57252", width=2)
    im.alpha_composite(anchor("top").resize((48, 48), Image.Resampling.NEAREST), (8, 8))
    for x, y in ((5, 5), (58, 5), (5, 58), (58, 58)):
        d.point((x, y), fill="#d6f1db")
    return im


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Check rather than rewrite textures")
    parser.add_argument("--preview", type=Path, help="Write an optional labeled contact sheet")
    args = parser.parse_args()
    sprites = images()
    failures = []
    outputs = {TEXTURES / name: im for name, im in sprites.items()}
    outputs[TEXTURES.parent / "icon.png"] = mod_icon()
    for path, im in outputs.items():
        encoded = io.BytesIO()
        im.save(encoded, format="PNG", optimize=False)
        if args.check:
            if not path.exists() or path.read_bytes() != encoded.getvalue():
                failures.append(str(path.relative_to(ROOT)))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(encoded.getvalue())
    if failures:
        raise SystemExit("Non-reproducible or missing textures:\n" + "\n".join(failures))
    if args.preview:
        sheet = Image.new("RGB", (4 * 176, 3 * 190), "#17232d")
        draw = ImageDraw.Draw(sheet)
        for i, (name, im) in enumerate(sprites.items()):
            x, y = (i % 4) * 176, (i // 4) * 190
            sheet.paste(im.resize((128, 128), Image.Resampling.NEAREST), (x + 24, y + 12), im.resize((128, 128), Image.Resampling.NEAREST))
            draw.text((x + 8, y + 151), Path(name).stem, fill="#dce8ee")
        args.preview.parent.mkdir(parents=True, exist_ok=True)
        sheet.save(args.preview)
    print(f"{'Verified' if args.check else 'Generated'} {len(sprites)} original 16x16 textures and a 64x64 mod icon.")


if __name__ == "__main__":
    main()
