# By Way of the Wilderness

A Bible-based side-scrolling journey game. **Episode 1: Egypt to Sinai** — you lead one
ordinary household out of Egypt and across the wilderness, and every camp, hardship and
decision is drawn from the text.

You do not play as Moses. You play as an invented family travelling inside a recorded
event, which is what lets the game give you real choices without ever rewriting what
Scripture says happened.

## The idea that shapes everything

Every piece of content carries one of three labels, and the player can always see it:

| Tier | Meaning |
|---|---|
| **Recorded** | Stated in the text. Cited to chapter and verse. |
| **Reasoned** | Not stated, but supported by the setting. The reasoning is shown. |
| **Invented** | Created for gameplay. Never claimed as Scripture. |

This is enforced, not merely intended. `recorded` requires a non-empty tuple of
citations, so a Scripture claim without a reference **fails to compile**. The content
validator catches the rest: a verse that is not in the bundled translation, reasoning
too thin to weigh, an entry no leg can unlock, a leg claiming a distance Numbers 33
never gave.

## Running it

```bash
npm install
npm run dev
```

| Command | Does |
|---|---|
| `npm run dev` | Development server |
| `npm test` | Unit tests |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run validate:content` | Content gate — run before any reviewer handoff |
| `npm run build` | Production build |

## How it is put together

The rule that makes later episodes cheap: **the simulation is pure TypeScript with no
Phaser and no React imports.** Phaser draws the travel scene, React draws every other
screen, and both read the same store. Content is data.

```
src/sim/       the rules — pure, framework-free, unit-tested
src/content/   episode data: legs, events, Codex, quiz, cast, scripture
src/game/      Phaser — the travel scene only
src/ui/        React screens
app/           Next.js routes
assets/        source art sheets (cut down into public/art)
```

Swap `src/content/episode1` and the engine plays a different journey.

[PLAN.md](PLAN.md) is the build plan: what is done, what is next, and the standing
briefs for backdrop art and for writing the household.

## Credits and licensing

- Scripture: **World English Bible**, public domain. Only the cited passages are bundled.
- Typeface: **Departure Mono** by Helena Zhang, SIL Open Font License 1.1 — licence in
  `app/fonts/`.
- Stack: Next.js, Phaser 3, TypeScript, Tailwind, Zustand, Vitest.
