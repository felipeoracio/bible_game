"""
Slice the twelve camp medallions out of the delivered map into one sprite sheet.

The map art carries a ribbon of oval medallions along its bottom edge, one per
camp. The game needs them individually so the ribbon can mark which camps the
household has actually reached — so they are cut out and laid into a single
horizontal strip, which the interface then windows with `background-position`.
One request instead of twelve.

The columns are found rather than hardcoded: the medallions sit on a black
backing, so a column carrying any non-black content in the ribbon band is part of
one. That also means this still works if the art is redelivered at a different
size or spacing.

Only the medallions are taken. The framed map above them is deliberately not
shipped: its numbered route runs Rameses to Mount Sinai in twelve stops and has no
Pi-hahiroth and no Elim, both of which are recorded camps (Numbers 33:7 and 33:9).
Presenting it in the Codex would show a route that drops two camps the text names,
next to a game that walks all of them — so the ribbon carries the itinerary and the
drawn map does not.

Usage:  python scripts/import-map-ribbon.py
"""

from PIL import Image

SOURCE = "assets/game_map.png"
SHEET_OUT = "public/art/map-ribbon.webp"

# The ribbon band, below the framed map and above the printed labels.
BAND_TOP, BAND_BOTTOM = 722, 845
# Height each medallion is normalised to in the sheet.
CELL = 96


def medallion_columns(px, width):
    """
    Every run of columns in the ribbon band carrying non-black content, minus the
    scroll arrows at either end.

    The arrows light up the same way a medallion does but are roughly a third the
    width, so runs are filtered against the median rather than dropped by index —
    which keeps this working if the art is redelivered without them.
    """
    runs, start = [], None
    for x in range(width):
        lit = sum(1 for y in range(BAND_TOP, BAND_BOTTOM, 3) if sum(px[x, y]) > 120)
        if lit > 3 and start is None:
            start = x
        elif lit <= 3 and start is not None:
            if x - start > 30:
                runs.append((start, x))
            start = None
    if start is not None:
        runs.append((start, width))

    if not runs:
        return runs
    widths = sorted(b - a for a, b in runs)
    median = widths[len(widths) // 2]
    return [(a, b) for a, b in runs if (b - a) >= median * 0.6]


def main():
    im = Image.open(SOURCE).convert("RGB")
    width, _ = im.size
    px = im.load()

    columns = medallion_columns(px, width)
    if len(columns) != 12:
        raise SystemExit(f"expected 12 medallions, found {len(columns)}")

    cells = []
    for left, right in columns:
        cell = im.crop((left, BAND_TOP, right, BAND_BOTTOM))
        scale = CELL / cell.size[1]
        cells.append(cell.resize((round(cell.size[0] * scale), CELL), Image.LANCZOS))

    # A uniform cell width keeps the windowing arithmetic in the interface trivial.
    cell_w = max(c.size[0] for c in cells)
    sheet = Image.new("RGB", (cell_w * len(cells), CELL), (12, 9, 7))
    for i, cell in enumerate(cells):
        sheet.paste(cell, (i * cell_w + (cell_w - cell.size[0]) // 2, 0))
    sheet.save(SHEET_OUT, "WEBP", quality=92, method=6)

    print(f"{SHEET_OUT}: {len(cells)} cells, {cell_w}x{CELL} each, sheet {sheet.size}")
    print(f"CELL_WIDTH = {cell_w}")


if __name__ == "__main__":
    main()
