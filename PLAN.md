# By Way of the Wilderness — Build Plan

**Episode 1: Egypt to Sinai.** Technical companion to the design doc
(`By-Way-of-the-Wilderness-Game-Plan.docx`). That document says *what* the game is.
This one says what we build, in what order, and how we know each piece is done.

## Locked decisions

| Decision | Choice | Consequence |
|---|---|---|
| Stack | Next.js 15 (App Router) + Phaser 3 + TypeScript | Web-first, Chromebook-friendly, Capacitor-wrappable later |
| Art | Pixel art, 48×64 sprites, 24-colour palette | Placeholder art is generatable now; slice is playable in days |
| Audience | Families playing together | Two reading surfaces: simple in-play text, optional depth in Codex |
| Translation | World English Bible (public domain) | No licence blocker; swappable via a translation adapter |
| Hosting | Vercel | Matches existing workflow |
| Accounts / saves | localStorage first, Supabase later | Slice ships without an auth dependency |

The date-of-the-Exodus question stays open until Feature 12 (Egyptian art direction).
Tribe selection is deferred out of Episode 1 — noted in Feature 4 as a hook, not a system.

## Architecture

The one rule that makes Episodes 2 and 3 cheap: **the simulation is pure TypeScript with
no Phaser and no React imports.** Phaser draws the travel scene. React draws every other
screen. Both read the same store. Content is data, never code.

```
src/
  sim/            # pure, framework-free, unit-tested — the actual game
    types.ts        Tier, ScriptureRef, Leg, Member, Household, GameState
    reducer.ts      (state, action) => state. No side effects, no randomness.
    rng.ts          seeded PRNG so runs are reproducible and testable
    systems/        water.ts, manna.ts, morale.ts, travel.ts, events.ts
  content/        # data only — swap this folder, get a different episode
    episode1/
      legs.ts       the twelve legs from Numbers 33
      events/       one file per event, tier-tagged
      codex/        one file per entry
      quiz/         one file per waypoint
      cast.ts       characters from §8.2
    scripture/
      web.json      World English Bible, only the passages we cite
  game/           # Phaser — travel scene only
    TravelScene.ts, layers.ts, sprites.ts
  ui/             # React screens
    Camp/, Waypoint/, Codex/, Quiz/, Dialogue/, Hud/
  state/
    store.ts        Zustand: holds GameState, dispatches sim actions
app/              # Next.js routes: /, /play, /codex, /about
public/assets/    # sprites, parallax layers, audio
```

**Tier tagging is enforced by the type system.** Every piece of content carries
`tier: 'recorded' | 'reasoned' | 'invented'`. `recorded` requires a `ScriptureRef[]`;
`reasoned` requires a `basis: string`. TypeScript refuses to compile content that
claims Scripture without citing it. Section 6.3 of the design doc becomes a build error,
not a review checklist item.

---

## Features

Each is a self-contained increment that leaves the game runnable. We build one at a time.

### Phase A — Vertical slice (Leg 1, end to end)

The design doc's week-12 decision point. Nothing past Feature 8 gets built until this is fun.

**Opening.** `/opening` runs four tier-tagged beats before character creation — Egypt,
the night of the departure, who the player is, and the promise that everything carries a
label. Menu → opening → household → play. Skippable from the first screen.

**F1 · Scaffold and game shell** — ✅ built and verified; Vercel deploy outstanding
Next.js + TypeScript + Tailwind + Vitest. A `/play` route mounting a Phaser canvas that
renders a coloured rectangle and responds to input. Zustand store wired to a stub reducer.
*Done when:* `npm run dev` shows a canvas that moves a box, `npm test` runs, deploys to Vercel.

Also landed alongside F1, out of sequence because the art arrived early:
- **Typography.** Departure Mono (SIL OFL 1.1), self-hosted via next/font. Drawn on an
  11px grid — measured, so the type scale is locked to 11 / 22 / 33px and nothing between.
- **Main menu.** `/` is the title screen: supplied background art and logo, keyboard
  navigable, greyed entries for Continue and The Codex until F13 and F7 land.

**F2 · Content schema and the tier system** — ✅ built and verified
The tier discriminated union, the scripture adapter, and Leg 1 authored as real data.
A `validateContent()` script that fails CI on an untagged or uncited claim.
*Done when:* Leg 1 exists as data, a deliberately mis-tagged entry fails the validator.

Notes for later legs: content types live in `src/content/types.ts` rather than `sim/`,
since the simulation consumes content and not the other way round. Events, Codex, and
quiz are one file per leg rather than per entity — at twelve legs and eighty events, per
entity is unmanageable. Run `npm run validate:content` before every reviewer handoff.

**F3 · Travel scene** — ✅ built and verified
Phaser side-scroller. Three parallax layers, three pace settings, distance accumulating
against `leg.distanceKm`, terrain affecting movement cost, party sprites stringing out
behind the player at fast pace. Placeholder pixel art.
*Done when:* you can walk Rameses → Succoth and the leg reports complete.

All five terrain themes exist in `game/terrain.ts`, but only delta-marsh has been seen
on screen — the other four have no leg to appear on until F14. Look at each one as its
legs are written. The movement costs are ordered sensibly but the numbers are guesses.

**Backdrop art per leg.** A leg can carry `backdrop: "/art/….webp"`: a panorama of that
whole stage of the journey. The parallax rate is *derived*, not chosen — the painting is
consumed exactly as the leg is walked, so you set out at its left edge and arrive at its
right edge as you reach the camp. Legs without art fall back to generated layers, so
legs 2–12 stay playable before their art exists.

Brief for the remaining eleven backdrops:
- **One continuous panorama per leg**, exported at exactly the canvas height (360px) so
  Phaser draws it at scale 1.0 and never resamples it. Width is free: the scroll factor
  is `min((width − 640) / (legDistanceKm × 200), 1)`, so **any** panorama narrower than
  `legDistanceKm × 200 + 640` is consumed exactly edge to edge. Art *wider* than that is
  the case to avoid — it pins to 1:1 and the player arrives before reaching its right
  edge. For Leg 1 that ceiling is 6640px; the art in use is 1916px.
- **Never tiled**, so the lighting is free to travel across it — Leg 1 runs night over
  Rameses to full daylight at Succoth, which is the whole point of it. Exodus 12:31 has
  Pharaoh sending them out in the night, so the leg begins under a moon and the sun
  comes up as Egypt falls behind.
- **Include the foreground.** A painted leg draws no generated ground; the artwork is
  the ground the household walks on, and covering its lower third throws away the best
  of it. The household stands at 72% of the canvas height.

**F4 · Household model and HUD** — ✅ built and verified
Five members with condition / morale / trust on separate axes. HUD showing the party,
the day counter, and distance to the next camp. Character creation: **every** member is
named and given a face from three variants, plus age and trade for the head. Names and
looks live in `GameState.identities` and carry into the travel scene, camp, and HUD.
(Tribe is omitted, not stubbed.)
*Done when:* morale visibly falls on a long fast-paced leg and the HUD reflects it.

Resolved in F5: `MAKE_CAMP` is now reachable from the HUD, so the household can recover.
The trust axis still only responds to driving a suffering household plus camp decisions;
F6 adds the text-anchored drivers. Frailty and drain rates are tuned by feel, not
research, and want a pass once there are playtesters.

**F5 · Camp screen** — ✅ built and verified
The evening beat. Rest, talk to family, one carried-forward decision. React, not Phaser.
*Done when:* camping advances the day, applies rest, and persists one decision into state.

Two parts of the original scope were deliberately left out. **Provisions** are not
distributed, because there is nothing to distribute until water (F9) and manna (F10)
exist — the camp screen has an obvious slot for it. And the **Codex "read more" on every
term** waits on F7, which is what builds the Codex reader.

Water now exists (F9) and that slot is still empty on purpose. Camp must never become a
place the player tops up the skins — the whole pressure system depends on supply being
outside their hands. If anything lands in that slot it is rationing (deciding who drinks
first on a bad night), not resupply.

`decisions: Record<eventId, choiceId>` on the game state is what "carries forward"
means, and F6 uses the same record and the same `DECIDE` action for road events. Choices
can carry a small `HouseholdEffect`; the numbers are deliberately tiny, since no single
decision should swing a journey.

**F6 · Event engine** — ✅ built and verified
Scripted events (always fire on a given leg) and pooled events (weighted, seeded random,
never repeat within a run). Every event carries its tier tag and renders it visibly in the UI —
a small "Recorded · Exodus 12:34" or "Invented for the game" line the player can always see.
*Done when:* Leg 1's departure-at-night event fires with its tag and offers a real choice.

The scheduler lives in the reducer, not the scene, so a run replays identically from its
seed — `initialState(leg, household, seed)`. `TRAVEL` is ignored while an event is open,
so holding the march key through an incident cannot skip it; the rule is enforced by the
simulation rather than by the UI. Scripted slots beat pooled draws and earlier slots fire
first, so covering a lot of ground between frames never skips the story.

Road events and camp decisions share `EventCard`, which is also where the tier tag lives.
Choices carry their own tag *before* you pick, so a player can see which options are the
text's and which are the game's while deciding — not after.

**F7 · Waypoint and Codex** — ✅ built and verified
Arrival screen: the passage, a plain-language note, map position, links to related entries.
A `/codex` route readable outside of play — this is the thing a parent or teacher evaluates.
*Done when:* completing Leg 1 unlocks the Succoth entry and it's readable from the menu.

Entries are **earned, not listed**: `GameEvent.unlocks` and `Leg.unlocks` say what opens
what, so meeting Hotep is what makes the mixed-multitude entry readable. The validator
now fails the build on a Codex entry nothing can ever unlock — content that reads
perfectly in the source and is invisible in play is worse than content that is missing.

Map position is the itinerary index ("Camp 1 of 12"), not a drawn map; `map_overworld.png`
is staged for a proper map ribbon later. The Codex "read more" on terms inside camp and
event prose is still outstanding — entries link to each other, but the body text does not
yet carry inline links.

**F8 · Checkpoint quiz** — ✅ built and verified
Three to five questions per waypoint. Wrong answers open the passage and allow a retry —
never a punishment. Running accuracy score surfaced at episode end.
*Done when:* Leg 1's quiz runs, a wrong answer reveals the verse, and the score persists.

"Score" means **first-try accuracy**: of the questions answered, how many were known
without opening the passage. That is the only number that can be surfaced honestly when
a wrong answer costs nothing — it rises only by knowing something, and a retry merely
stops that question counting as known. The running figure shows on the Codex header, so
it reads as a study record rather than a grade.

The doc's "small cosmetic rewards" for correct answers are not built; there is no
cosmetic layer to reward with yet.

> **Slice review.** Play it. If it isn't fun before any further teaching content is layered
> on, change the design here — not at Feature 14.

### Phase B — Core systems

**F9 · Water** — ✅ built and verified
Per-member hydration, faster drain in heat and at fast pace, resolved only at scripted
points the player does not control. The genuine pressure system.
*Done when:* water drains at a rate the player can feel, the HUD warns before it is a
crisis, thirst costs the household condition, and nothing in the UI can refill the skins.

The load-bearing constraint is `refill()` in `src/sim/systems/water.ts` — the only function
that raises litres, and it is reachable exclusively from content via a choice's
`provisions`. There is no refill button, no shop, no forage action. That is what makes
Marah and the rock at Rephidim land as relief rather than cutscene: the player has spent
the whole leg unable to solve the problem.

Three things follow from that and are worth not undoing later:
- **The HUD shows days, not litres.** "About two days left at this pace" is the decision;
  "11.7 L" is trivia. It re-reads whenever pace or terrain changes, so switching to driving
  visibly costs days without a single step being taken.
- **Thirst is a fourth track on the household, not a fourth axis.** It sits beside Body,
  Spirit and Trust in the panel but is deliberately not one of them — resting does nothing
  for it, and it is a supply problem rather than a state of mind.
- **Children and elders dry out fastest.** Same frailty ordering as the march, for the same
  reason: the household is a family, not a squad.

Leg 1 gained `the-last-canal` at 88% — the last easy water before the country turns dry,
reasoned from delta geography rather than cited, since Exodus 13:20 puts the edge of the
wilderness on the *next* stage. It exists so the mechanic teaches itself on the only
playable leg: fill everything and pay in condition, or travel light and arrive thin.
Walking the leg four ways gives 4.0 / 3.7 / 2.4 / 1.7 days of water on arrival — pace and
provisioning both matter, and nobody goes parched, which is correct. **No water crisis is
recorded until Marah**, so leg 1 must not manufacture one.

Marah and Rephidim are the relief points the system is built for, and they need legs 5 and
11 — so the payoff does not exist until F14. Exodus 15:22-27 and 17:1-7 are bundled now and
the Codex entry "Water in the wilderness" cites them, which is as far as this can go until
the legs are authored.

Drain rates are still tuned by feel, not research — flagged with the other unresearched
numbers below.

**F10 · Manna** — ✅ built and verified, and **dormant until Leg 8**
One omer per person, hoarded manna spoils overnight, the double portion holds on the sixth
day only, nothing falls on the seventh. The player learns the text by failing at it.
*Done when:* every rule in Exodus 16 is enforced by a test that names its verse, and
nothing in the system perturbs a single thing before it begins.

**The doc asks for a gathering minigame and the text will not support one.** Exodus 16:18
says the one who gathered much had nothing over and the one who gathered little had no
lack. A collect-as-much-as-you-can score would contradict the exact verse it exists to
teach, so gathering is not scored and effort changes nothing. What the text *does* record
is three ways to get it wrong, and those are the game:

| The mistake | Verse | What the game does |
|---|---|---|
| Keeping it overnight | 16:19-20 | It breeds worms, and you went without supper to hoard it |
| Missing the morning | 16:21 | The sun grew hot and it melted; nothing to gather |
| Going out on the seventh | 16:26-27 | The button stays enabled and you find none |

That last one matters: **the gather button is never hidden or disabled on the Sabbath**.
Being allowed to make the mistake is the lesson, and a greyed-out button teaches nothing.

Laying food aside costs tonight's meal — `eat` draws from `fresh` only and cannot touch
what was set aside. Without that, hoarding is a free hedge and the sixth-day command
becomes bookkeeping rather than an act of trust. This was got wrong first time round: the
original `eat` drew from the laid-aside portion first, which quietly ate the Sabbath
portion on the sixth night. The tests caught it.

`gatheredToday` is tracked separately from what is in the basket. Reading `fresh` to decide
whether the household had already been out let a player gather, lay the lot aside, gather
again, and farm unlimited manna — found by playing it, not by reading it.

The panel lives at camp and renders nothing while `mannaDay` is 0, which it is for the
whole playable slice. Verified by temporarily starting manna at day 1, playing the gather
and hoard paths in the browser, and reverting. **No Codex entry yet and Exodus 16 is not
bundled** — an entry has to be unlockable, and the event that would unlock it is Leg 8's,
which F14 authors. That is the honest stopping point for this feature.

Hunger numbers are tuned by feel, like the water and frailty numbers.

**F11 · Failure states** — ✅ built and verified
Household fracture, falling behind the column, weaker endings. No random death.
*Done when:* a household can fail in ways that hurt, and none of them kill anyone or write
a single person out of Israel.

The constraint that shapes all three: **nobody dies and nobody leaves the Exodus.** Killing
a family member at random is what the doc rules out; writing one out of Israel would be
putting words in Scripture's mouth. So every failure here is survivable and reversible, and
a test asserts the summaries never say anyone died or left.

**Falling behind** (`sim/systems/column.ts`) has a sharp text anchor. Deuteronomy 25:18
remembers that Amalek "struck the rearmost of you, all who were feeble behind you, when you
were faint and weary" — the danger in the text lands specifically at the back of the column,
so the game tracks a position rather than a score, and Rephidim (F12) collects on it.

The balance decision is that **the column moves at exactly a steady walk.** A household in
good order holds its place without ever being pushed, so falling behind is never a tax on
choosing the sustainable pace — it is caused by wearing your family down. Speed is scaled by
the *worst* member's condition, so a spent household cannot hold the column at any pace,
including a driving one. Pushing hard is not merely cruel; below about a third condition it
is slower. Walking Leg 1 four ways:

| | no camp | one camp |
|---|---|---|
| **steady** | 2.7 km back, worst body 75 | 1.1 km back, body 89 |
| **quick** | with the column, body 54 | with the column, body 78 |
| **driving** | with the column, body 18 | with the column, body 52 |

That is the trade the system exists to create: steady keeps your family whole and lets the
column pull away; driving holds your place and destroys them. Neither is the right answer.

**Fracture** (`sim/systems/fracture.ts`) — at trust 8 a member goes to walk with another
household; they come back at 30. The gap is deliberate hysteresis, so somebody on the edge
does not flicker in and out over one hard kilometre. They are never removed from the array.

**The reckoning** (`sim/systems/reckoning.ts`) — read at every arrival, as a rehearsal of
the episode ending. Not a pass or a fail: Israel reaches Sinai either way, and what varies
is what you arrive with. The summary is generated from the actual counts, because
`scattered` has two different causes and one sentence could not honestly cover both — the
first version told a player that "most" of their household had left when one person had.
Caught by looking at the screen, and now pinned by a test.

Codex: "The back of the column", unlocked on Leg 1 since the column is there from the start.
Deuteronomy 25:17-18 and Exodus 17:8-9 are bundled; `BookId` widened for Deuteronomy.

**F12 · Set pieces** — ✅ built and verified, **dormant until legs 4, 5, 11 and 12**
Four sequences, four different verbs. All four authored in full; the legs that reach them
land in F14.
*Done when:* each of the four plays end to end, and no choice in any of them can change what
Scripture records happening.

| | Verb | What the player actually does |
|---|---|---|
| **The crossing** | Go forward | Decides when to walk in, and who they carry |
| **Marah** | Endure | Decides how to meet three days without water |
| **Rephidim** | Watch | Decides where the family stands, and where to look |
| **Jethro** | Be placed | Waits, or settles it themselves — then is assigned |

**The invariant, made structural rather than remembered.** A set piece's outcome is a
property of the set piece, not of any choice, and `SetPieceChoice` has **no `provisions`
field at all**. So the water at Marah cannot be authored as a reward for choosing well —
relief arrives because the text says it did. §5.3's rule enforced by the shape of the type
rather than by an author's memory. Three tests hold the line: every path through a set piece
yields the same outcome, no authored choice anywhere carries provisions, and the reducer
ends Marah identically whichever option was taken while the *households* differ.

Two of the four needed engine rules beyond phases, flagged by `mechanic` on the content:

- **`amalek-at-the-rear`** — Deuteronomy 25:18 says Amalek "struck the rearmost of you, all
  who were feeble behind you". Both halves are modelled and **averaged, not multiplied**:
  multiplying would let a fit household at the very back come out nearly safe, which is the
  opposite of the verse. This is what F11's lag was built for. Trust rises regardless of
  exposure, because 17:13 is a deliverance every household watched.
- **`appointed-to-a-judge`** — Exodus 18:25. Seeded, not chosen, because "assigned" is what
  the text describes. Persists in `GameState.judgeId` for the rest of the run. The ranks are
  recorded and cited; the man is invented, and the validator now *rejects* any judge tagged
  otherwise, since Exodus 18 names none of them.

The crossing and Marah needed no code at all — phases plus a recorded outcome expressed both,
which is the content model working as intended.

Validator additions: a set piece and its outcome must both be `recorded` and cite; a choice
tagged `recorded` is an error, because the text says nothing about this invented household;
phases and choices are checked for name tokens and duplicate ids like everything else.

Verified by opening Marah with the skins empty and playing it through: both phases left the
water at zero, and it filled only at the recorded outcome. Rephidim was opened at 18 km of
lag and the view of the hill degraded to match, agreeing with the HUD's "Among the
stragglers".

**F13 · Save and progression** — ✅ built and verified
localStorage, schema-versioned. Multiple household profiles, since this is played by
families.
*Done when:* a reload no longer costs the player their household, several families can keep
separate journeys on one browser, and no save file — however mangled — can crash the game.

The governing assumption is that **a save file is untrusted input.** It lives in
localStorage where any curious ten-year-old with dev tools can edit it, and it may have been
written by an older build. So `restore` works by laying *validated* values over a freshly
initialised state: a truncated, corrupted, or hand-edited save degrades into a playable game
rather than a crash or a household with NaN for its condition. Specifically it cannot add a
person to the family, change somebody's role, put an axis outside 0–100, strand the player
past the end of a leg, carry more water than the skins hold, or forge a perfect quiz record
with a string.

The leg's **schedule, distance and terrain are deliberately not saved** and are rebuilt from
content, so a run saved before a content fix picks the fix up.

`src/sim/save.ts` is pure — no browser, no content imports — and `src/state/storage.ts` is
the only module in the game that touches localStorage. It has to survive three things that
are all normal and none of which are the player's fault: server rendering during the
prerender, storage being unavailable (private browsing, full quota), and a file from another
build.

Two things worth not undoing:

- **A file this build cannot read is moved aside, never destroyed.** The Continue screen
  tells a player with a newer save to update and their journeys will open — and the first
  version of this then overwrote that file the moment they started a new game, which made
  the message a lie. Found by planting a newer-version file in the browser and starting a
  journey. Backups go to `SAVE_KEY/unreadable-backup` and the earliest one is never
  overwritten.
- **Autosave is throttled to two seconds.** `TRAVEL` fires every animation frame, so saving
  per dispatch would serialise the whole run sixty times a second.

A slot is claimed only once the household has names, so the Continue list never fills with
anonymous runs from someone who opened creation and backed out. Deleting takes two taps —
a child clicking around the menu should not be able to wipe a sibling's journey.

Character creation now seeds its form from the roster rather than from live state; reading
the store meant starting a new journey straight after loading an old one pre-filled the form
with the previous household's names.

### Phase C — Content and ship

**F14 · The remaining eleven legs** — 🔨 in progress: **legs 2, 3 and 4 built and verified**
The itinerary is Numbers 33:5-15, which maps cleanly onto the twelve legs and lands manna at
Leg 8, Rephidim at 11 and Jethro at 12 exactly as the plan assumed.

**Two things had to be built before any leg could be reached at all**, and neither was in the
brief:

- **`BEGIN_LEG`.** The game had never advanced a leg, because it had only ever had one. The
  whole feature is in what it does *not* reset: the household walks onto a new road in
  exactly the condition it walked off the last one, still carrying the same water, still as
  far behind the column as it had fallen, still estranged from whoever stopped following.
  That accumulation is the game — it is why pushing hard on Leg 3 is felt at Rephidim on
  Leg 11. `fired` is kept for the same reason: an event that has happened to this household
  has happened.
- **`Leg.setPiece`.** A leg had no way to point at one of the four, so F12's set pieces were
  unreachable by construction. It fires from `TRAVEL` and outranks every other event — if
  the household has just reached the sea, that is what is happening to them.

The legs themselves:

| | Stage | The leg is about |
|---|---|---|
| **2** | Succoth → Etham | Not taking the short road (13:17-18), Joseph's bones, the pillar |
| **3** | Etham → Pi-hahiroth | Being told to turn *back*, and finding out why at the shore |
| **4** | Pi-hahiroth → the far shore | The wind all night, and the crossing |

Leg 3 is the one worth not softening. Every option on it is a way of being wrong in good
faith, because the camp is bait (14:3-4) and the people camped in it are not told. No amount
of sensible reasoning gets you to the right conclusion from inside it.

**Numbers 33:8 is one stage and the game makes it two.** The crossing, three days in the
wilderness and the arrival at Marah are a single verse; legs 4 and 5 split it, because one
leg cannot hold two set pieces. The Codex entry "The far shore" tells the player that the
line between them is ours and not the text's.

**The household arrives at the far shore nearly dry** — 23L, 14L, 6L, 1L across the four
legs — and there is deliberately no water source on legs 2 to 4, because the text records
none between Etham and the sea. Inventing one would break §5.3. The relief is Marah, which
is Leg 5 and next.

Validator additions: a leg's set piece must exist and fire inside 0 to 1, and a set piece no
leg reaches now warns. Three of those warnings are live and expected (Marah, Rephidim,
Jethro); the test allows exactly those by name so any *new* warning still fails the build.

One test quietly rotted and was caught: "catches a Codex entry linking to nothing" used
`etham` as its example of a non-existent entry, and Leg 2 made Etham real.

**Legs 5 to 8 — built and verified.** Two dormant systems are now live in play: Marah's
relief is reachable, and manna begins.

| | Stage | The leg is about |
|---|---|---|
| **5** | the far shore → Marah | The song, then three dry days, then bitter water |
| **6** | Marah → Elim | The statute, and twelve springs after all that |
| **7** | Elim → the Red Sea | Nothing. One line in Numbers 33 and nothing else |
| **8** | the Red Sea → the wilderness of Sin | The meat pots, and bread from the sky |

Leg 5 is the shape of the episode in miniature: Exodus 15 puts the Song of the Sea and
Miriam's dancing immediately after the crossing, and then three verses later, three days
without water. Nothing on that leg gives the household a drink, because the text gives them
none until the tree goes into the pool.

Leg 7 is the first leg whose honest subject is **how little the text says**. Numbers 33:10 is
one line — travelled from Elim, camped by the Red Sea — and its Codex entry says outright
that almost everything the household does there is invented, because there is nothing
recorded to build it from. Not every day of the Exodus was a crisis.

`beginsManna` is set on exactly one leg and fires on *arrival*, so the first camp in the
wilderness of Sin is a manna morning. Like the water refills, there is no button.

**A real balance flaw surfaced by walking the whole itinerary, not by reading the code.**
Lag compounded without limit: a household at 34 condition finished the 54 km leg 5 *forty
kilometres* adrift, and at steady pace could never regain a metre — the break-even was
condition 100. So the household hit "stragglers" on leg 5 and stayed there for the rest of
the episode.

The fix is truer to the text than what it replaced. **Numbers 33 is a list of camps**: the
column stops at the same place every night, so a household walking in two hours late still
walks in. Camping now closes three quarters of the gap. What arriving late costs is the
night itself — `restShare` scales recovery by how far behind you were, floored at 45% so a
bad night is never a lost one. That turns an unbounded runaway into a real, escapable loop:
behind → less rest → slower → further behind, broken by pushing the pace, which has its own
price.

Walked with a household resting the way one actually would (every ~20 km), the eight legs
now read: full condition and with the column through leg 4; body 40 at Marah; 15 to 25
across the back half, recovering rather than pinned.

**One inconsistency is now stated rather than hidden.** Exodus 16:1 dates the wilderness of
Sin to a month out of Egypt; the game's counter gets there around day 16, because it walks
the stages back to back and the real journey plainly did not. The Codex entry "How long was
a day's march?" says so in as many words — the date in the text is right, the number on
screen is the game's, and it is short.

**Legs 9 to 12 — built and verified. The itinerary is complete.** Twelve legs, Rameses to
the mountain, and **nothing in the episode is dormant any more** — all four set pieces are
reachable, all 34 Codex entries open in a single playthrough, and the validator is back to
zero warnings.

| | Stage | The leg is about |
|---|---|---|
| **9** | the wilderness of Sin → Dophkah | The sixth day, and the first Sabbath |
| **10** | Dophkah → Alush | A place that is only a name |
| **11** | Alush → Rephidim | No water, the rock, and then Amalek |
| **12** | Rephidim → the wilderness of Sinai | Jethro, and the mountain |

**Dophkah and Alush answer a question leg 7 raised.** Numbers 33 gives each a name and not
one other word, and neither appears anywhere else in Scripture. Leg 7 met that silence by
being quiet; these two meet it better — **the place is silent but the calendar is not.**
Manna began in the wilderness of Sin, so the first sixth day and the first Sabbath land on
exactly these stages. There is plenty recorded happening; it simply is not happening to the
ground.

**Rephidim needed a structural answer.** Two recorded crises land on one stage — no water
(Numbers 33:14 says so outright) and Amalek — and a leg may hold only one set piece. Amalek
is the set piece; the rock at Horeb is scripted with **exactly one choice**. That is how the
same guarantee is kept with the ordinary event system: there is nothing to choose, so the
water cannot be a reward for choosing well. If a second option is ever added there, the
provisions must move onto both.

**Two real problems surfaced by playing the finished episode, not by reading it.**

*Trust had no systemic drain.* Playing adversarially — worst choice every time, driving pace,
never resting — trust bottomed out at **46**. Fracture triggers at 8. So F11's fracture, and
the `divided` and `scattered` endings built in F11, were **unreachable in any real
playthrough**: a whole feature nobody could ever see. Trust only moved on authored choices
and on driving an already-suffering household, while the recorded outcomes handed back large
positive amounts.

The fix is straight out of the text. Exodus 17:3 — "the people were thirsty for water there;
and the people murmured against Moses". Exodus 16:2 — "the whole congregation murmured
against Moses and against Aaron". Thirst and hunger now cost trust in proportion to the
shortfall. After it, the spread is real:

| | lowest trust | final standing |
|---|---|---|
| careful play | 78 | whole (5/5) |
| adversarial | 0 | scattered (0/5) |

*Condition pins at zero* across the dry stretch from Elim to the rock — four legs on one
fill, because the text records no water between them. That is designed pressure and the
player's levers are real (fill everything at Elim for +10 capacity, walk steady, camp often),
but the axis does saturate in the back half. Left as is: nobody dies, every path finishes,
and inventing a spring would break §5.3.

**F14 is complete.** Walked end to end: the four set pieces fire on legs 4, 5, 11 and 12, the
household is placed under a named judge, and the run ends camped in front of the mountain —
which is exactly where Exodus 19:2 leaves them.

**F14 · Legs 2–12** — the content pour. Each leg written, tier-tagged, and signed off by the
reviewer per leg, not per project. Legs 9 and 10 (Dophkah, Alush) are the proof of concept:
named in the itinerary, no narrative recorded, and the game says so out loud.

**F15 · Art and audio pass** — five environment sets × three parallax layers × day/dusk/night.
The pillar of cloud gets the real animation budget. Reed flute, frame drum, lyre, voice —
no orchestra. Full vocal arrangement for the Song of the Sea only.

**F16 · Accounts, licences, launch** — Supabase auth and cloud saves, Stripe purchase, free
through the crossing (Legs 1–4), family and classroom licences, the leader's guide export,
a public errata page from day one, accessibility and localisation hooks.

---

## Supplied art

Source sheets live in `assets/` (not served). Everything the game uses is cut from
them into `public/art/`, scaled for the 640×360 canvas, and committed there.

| Sheet | Status |
|---|---|
| `background_rameses_succoth` | **In use** — Leg 1 panorama |
| `player_family_male/female`, `children`, `elders` | **In use** — the five household sprites |
| `text_boxes`, `home_screen_logo`, `background_main`, `font_style` | **In use** — frames, title screen |
| `dialog_potrait_examples`, `pop_up` | F5 camp screen, F6 events |
| `moses_npc`, `aaron_npc`, `mixed_multitude_npcs` | F6 — recorded figures and the mixed multitude |
| `ui_hud_elements`, `buttons`, `event_icons` | F5–F7 as each screen lands |
| `items_inventory_icons`, `game_objects_interactables` | F9/F10 — water and manna |
| `enemies_hazards` | F12 — Rephidim |
| `map_overworld` | F7 — the Codex map ribbon |
| `effects`, `animation_examples`, `tileset` | F12/F15 — set pieces and the art pass |

The character sheets are drawn **front-facing**, not in side profile. The design doc
calls the side profile the load-bearing view for a side-scroller (§9.5), so the party
currently walks facing the player. It reads fine and is a large improvement on the
generated placeholders, but a profile or three-quarter set is what the travel scene
really wants — worth raising before more character art is commissioned.

Each sheet holds three variants and only one is used per role. The spare two are an
obvious basis for letting the player choose their household's appearance during
character creation; that is a design decision, not a technical one, so it is unbuilt.

## Writing the household

Two rules, both enforced by the content validator:

1. **Never write a household name into prose.** Use the id token — `{tirzah}` — so a
   line follows what the player actually called them. Writing the name directly means
   the game keeps saying "Tirzah" after she has been renamed Shiphrah, which tells the
   player it is not really listening.
2. **Roster descriptions stay sex-neutral.** The player chooses each member's face from
   three looks, and a description that says "she" can contradict what is on screen. The
   member's own speech at camp can say whatever it likes — that is their voice, not the
   game describing them.

## Non-negotiables

1. **No depiction of God.** The pillar of cloud and fire is the visual language. Sinai is
   smoke, fire, sound, and the reaction of the crowd — show what the people saw.
2. **Recorded figures never say anything the text doesn't record them saying.** Their lines
   are quotations or plainly framed restatements. Nothing else.
3. **Opposition is drawn as human.** Never monstrous, never demonised. The text treats them
   as people.
4. **Disputed questions are named, not settled.** Where faithful readers differ, the Codex
   says so. Interpretive choices forced by the art get stated in the credits.
5. **If a mechanic requires the story to bend, the mechanic changes.**

## Still open

- Scripture reviewer — longest lead time on the project, needed before Feature 14. Start now.
- Exodus date (early vs late) — blocks Egyptian art direction at Feature 15, not before.
- Working title clearance.
- Tribe selection — deliberately out of Episode 1 unless the slice feels thin.

---

Next: **Feature 1 — scaffold and game shell.**
