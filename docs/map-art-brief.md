# Map redraw brief — By Way of the Wilderness, Episode 1

The delivered `game_map.png` is drawn against a different list of camps from the one the
game walks. This is what a corrected version needs, and why.

**What is already handled in code:** the medallion ribbon is built by
`scripts/import-map-ribbon.py`, which slices the strip along the bottom of the map. It
finds the medallions rather than assuming positions, so a redraw at another size still
imports without code changes.

---

## The corrections

| | Current map | Should be |
|---|---|---|
| **Missing** | — | **Pi-hahiroth** between Etham and the crossing |
| **Missing** | — | **Elim** between Marah and the Red Sea camp |
| **Wrong last stop** | Mount Sinai | **The wilderness of Sinai** |

**On the last one.** Numbers 33:15 ends the itinerary at the wilderness of Sinai, and
Exodus 19:2 says Israel camped *in the wilderness, before the mountain*. The mountain is
not a camp — it is what the camp is looking at. So the twelfth stop should show a camp
pitched in front of the mountain rather than the mountain as a destination. Drawing the
mountain in the picture is right; labelling the stop "Mount Sinai" is not.

**On the two missing camps.** Both are recorded, and one of them is one of the most
generous details in the whole route:

- **Pi-hahiroth** — Numbers 33:7, Exodus 14:2. Israel is told to turn *back* and camp
  before Pi-hahiroth, between Migdol and the sea, opposite Baal Zephon.
- **Elim** — Numbers 33:9, Exodus 15:27. Twelve springs of water and seventy palm trees,
  arrived at immediately after three waterless days and a pool nobody could drink.

Leaving them off means the map shows a route that skips two places the text names, which
is the one thing this game has been careful never to do.

---

## The thirteen stops

Rameses is where they set out from; the twelve after it are the camps of Numbers 33:5-15.
`leg id` is what the code keys on.

| # | Place | leg id | Recorded at | What the medallion should show |
|---|---|---|---|---|
| 0 | Rameses | *(origin)* | Ex 12:37 | Egyptian city, the Nile, the last green country |
| 1 | Succoth | `leg-01-rameses-succoth` | Num 33:5 | First camp, still in the delta |
| 2 | Etham | `leg-02-succoth-etham` | Num 33:6, Ex 13:20 | The edge of the wilderness — where the green gives out |
| 3 | **Pi-hahiroth** | `leg-03-etham-pi-hahiroth` | Num 33:7, Ex 14:2 | **Needed.** A camp on open shore, water in front, a fort on high ground behind. Exposed — the camp is bait and the people in it do not know |
| 4 | The crossing | `leg-04-the-crossing` | Num 33:8, Ex 14:22 | Water standing as a wall either side of dry ground |
| 5 | Marah | `leg-05-marah` | Num 33:8, Ex 15:23 | A pool in dry country nobody is drinking from |
| 6 | **Elim** | `leg-06-elim` | Num 33:9, Ex 15:27 | Twelve springs, seventy palms. *(Currently filled from the Elim end of leg 7's panorama — a purpose-drawn one would be better)* |
| 7 | By the Red Sea | `leg-07-red-sea` | Num 33:10 | A shore camp. One line in the Bible and nothing else |
| 8 | The wilderness of Sin | `leg-08-wilderness-of-sin` | Num 33:11, Ex 16:1 | Open desert. Where the food ran out and the manna began |
| 9 | Dophkah | `leg-09-dophkah` | Num 33:12 | Rocky wadi. Nothing else is recorded about it |
| 10 | Alush | `leg-10-alush` | Num 33:13 | Rocky wadi. Nothing else is recorded about it |
| 11 | Rephidim | `leg-11-rephidim` | Num 33:14, Ex 17:1 | Dry ground with no water — the itinerary says so outright |
| 12 | The wilderness of Sinai | `leg-12-sinai` | Num 33:15, Ex 19:1-2 | A camp pitched in the open, the mountain ahead of it |

---

## The route line is ours, not the text's

Worth stating on the map itself if there is room, because the game says it in the Codex
entry "Which road is this?": Numbers 33 gives the camps and their order, and locates almost
none of them. Where the crossing happened and which mountain is Sinai are both disputed
among readers who take the text equally seriously.

So the drawn line is one reconstruction among several. It is fine for the map to commit to
one — a map has to — but it should not be presented as *the* route. If a caption is
possible, something like *"one reading of a route the text names but does not locate"* is
accurate.

---

## Technical notes

The importer is tolerant, so these are preferences rather than hard requirements.

- **Thirteen medallions** in the bottom ribbon, in the order above, evenly spaced on a dark
  backing, each roughly as wide as it is tall.
- **Scroll arrows** at either end are fine — the importer filters them out by width against
  the median, so keep them clearly narrower than a medallion.
- **Resolution:** the current map is 1619 × 971 and the medallions come out at 84 × 96,
  which is a little soft. Anything larger is welcome; the importer normalises height.
- **Style:** match the existing medallions — a gold oval ring on black, painted scene
  inside. The frames are what make the ribbon read as one object.
- **Deliver as PNG** into `assets/`, then run `python scripts/import-map-ribbon.py`.

If the framed map above the ribbon is redrawn to the corrected thirteen stops, it can be
shipped in the Codex too. It is deliberately not shipped at the moment, because its route
omits two camps the text names.
