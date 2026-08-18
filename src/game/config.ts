/**
 * Rendering constants for the travel scene.
 *
 * The base resolution is a pixel-art canvas that scales by whole-ish factors to
 * common classroom displays (640×360 → 1280×720 → 1920×1080). Sprites are authored
 * at 48×64 per the art brief, which puts a character at roughly a fifth of the
 * screen height and leaves room for the party to string out behind the player.
 */
export const VIEW_WIDTH = 640;
export const VIEW_HEIGHT = 360;

/** Horizon line, in view pixels from the top. */
export const GROUND_Y = 260;

/** World pixels per travelled kilometre. */
export const PX_PER_KM = 200;

/**
 * Time compression: in-game hours per real second. At 1/30, Leg 1's 30 km of delta
 * marsh takes about six minutes at a steady walk and three at a driving pace.
 */
export const HOURS_PER_SECOND = 1 / 30;

/**
 * The UI typeface, for any text drawn on the canvas.
 *
 * next/font generates a hashed family name at build time, so it is read from the
 * CSS variable rather than hard-coded. Canvas text renders with whatever the
 * document has already loaded, which is why `GameCanvas` waits on
 * `document.fonts.ready` before booting Phaser.
 */
export function pixelFontFamily(): string {
  if (typeof window === "undefined") return "monospace";
  const family = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-pixel")
    .trim();
  return family ? `${family}, monospace` : "monospace";
}

/** Canvas text sizes. Departure Mono is crisp only at multiples of 11. */
export const FONT_SIZE = { small: 11, body: 22, title: 33 } as const;

// Scenery colours are per-terrain and live in `game/terrain.ts`.
