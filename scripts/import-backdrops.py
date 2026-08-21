"""
Turn a delivered backdrop painting into the WebP the travel scene loads.

The source files arrive as artwork inset in white matting with a thin dark border
around it. Three things have to happen, and the reason for each is in the code:

  1. Find the artwork inside the matting, rather than assuming a fixed crop —
     the inset is not identical between files.
  2. Drop the anti-aliased rows against the border, which otherwise show as a
     faint dark edge along the top and bottom of the scene.
  3. Export at exactly the canvas height (360px) so Phaser draws at scale 1.0
     and never resamples.

Width is deliberately left alone. The scroll factor is
`min((width - 640) / (legKm * 200), 1)`, so any panorama narrower than
`legKm * 200 + 640` is consumed exactly edge to edge, which is what the derived
parallax wants. See the backdrop brief in PLAN.md.

Usage:  python scripts/import-backdrops.py <source.png> <out.webp>
"""

import sys
from PIL import Image

CANVAS_HEIGHT = 360
# Rows/columns brighter than this on average are matting, not artwork.
WHITE = 245
# A row this flat is the border rule itself rather than any painted content.
FLAT_SPREAD = 40
# Rows immediately inside the border are part-border, part-art. They read as real
# content by any flatness test and still show as a faint dark edge in the scene,
# so a fixed margin is stepped past once the rule itself has been found.
AA_MARGIN = 2


def band(values, is_content):
    """First and last index for which `is_content` holds, or None."""
    hits = [i for i, v in enumerate(values) if is_content(v)]
    return (hits[0], hits[-1]) if hits else None


def row_stats(px, width, y, step=8):
    vals = [sum(px[x, y]) / 3 for x in range(0, width, step)]
    return sum(vals) / len(vals), max(vals) - min(vals)


def col_mean(px, height, x, step=8):
    vals = [sum(px[x, y]) / 3 for y in range(0, height, step)]
    return sum(vals) / len(vals)


def convert(src_path, out_path):
    im = Image.open(src_path).convert("RGB")
    width, height = im.size
    px = im.load()

    rows = [row_stats(px, width, y) for y in range(height)]
    vertical = band(rows, lambda r: r[0] < WHITE)
    if vertical is None:
        raise SystemExit(f"{src_path}: no artwork found — the whole image is matting")
    top, bottom = vertical

    # Step past the border rule and its anti-aliased neighbours at both edges.
    while top < bottom and rows[top][1] < FLAT_SPREAD:
        top += 1
    while bottom > top and rows[bottom][1] < FLAT_SPREAD:
        bottom -= 1
    top = min(top + AA_MARGIN, bottom)
    bottom = max(bottom - AA_MARGIN, top)

    cols = [col_mean(px, height, x) for x in range(width)]
    horizontal = band(cols, lambda v: v < WHITE)
    left, right = horizontal if horizontal else (0, width - 1)

    crop = im.crop((left, top, right + 1, bottom + 1))
    target_w = round(crop.size[0] * CANVAS_HEIGHT / crop.size[1])
    out = crop.resize((target_w, CANVAS_HEIGHT), Image.LANCZOS)
    out.save(out_path, "WEBP", quality=90, method=6)
    return crop.size, out.size


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    cropped, final = convert(sys.argv[1], sys.argv[2])
    print(f"{sys.argv[1]} -> {sys.argv[2]}  crop {cropped}  final {final}")
