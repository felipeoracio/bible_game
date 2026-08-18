import type * as PhaserNS from "phaser";
import type { Terrain } from "@/content/types";
import { createRng, seedFrom } from "@/sim/rng";
import { GROUND_Y, VIEW_HEIGHT } from "./config";

/**
 * Procedurally generated parallax scenery, one theme per terrain type.
 *
 * This is placeholder art with a purpose: it makes the five environment sets from
 * the art direction (§10) real enough to play against, and it fixes the *structure*
 * an artist will later drop hand-drawn layers into. Every layer here is generated
 * into a tiling texture at boot, seeded off the leg id, so a given leg always looks
 * the same and no two legs look identical.
 *
 * The sky is deliberately banded rather than smoothly graded — a smooth gradient
 * reads as a render, not as pixel art.
 */

export interface TerrainTheme {
  /** Sky, top of frame to horizon. */
  skyTop: number;
  skyHorizon: number;
  /** Far silhouette — hills, dunes, or the mountain wall. */
  far: number;
  /** Middle band — reeds, scrub, boulders. */
  mid: number;
  midAccent: number;
  ground: number;
  groundShade: number;
  groundDetail: number;
  /** What the middle layer is made of. */
  midStyle: "reeds" | "dunes" | "scrub" | "boulders" | "crags";
  /**
   * How much the far horizon rises, 0 to 1. The delta is flat; the approach to the
   * mountain is not. This is the main thing that makes the five terrains read as
   * different places rather than recolours of each other.
   */
  farRelief: number;
}

export const THEMES: Record<Terrain, TerrainTheme> = {
  "delta-marsh": {
    // Matched to the sky at the right-hand edge of the Rameses painting, which is
    // where the artwork hands over to generated scenery. A dawn palette here left
    // a visible colour step across the dissolve.
    skyTop: 0x6daee4,
    skyHorizon: 0xc8d4c0,
    far: 0x8b9a94,
    mid: 0x4c5340,
    midAccent: 0x6b7050,
    // Sampled from the painted Rameses panorama at the row where the ground line
    // falls, so the walking surface meets the artwork without a colour seam.
    ground: 0x785a14,
    groundShade: 0x4a3a10,
    groundDetail: 0x9c7a28,
    midStyle: "reeds",
    farRelief: 0.18,
  },
  "coastal-sand": {
    skyTop: 0x7d8ab0,
    skyHorizon: 0xf0d0a0,
    far: 0x9a8a94,
    mid: 0xc0a276,
    midAccent: 0xd8b083,
    ground: 0xd8b083,
    groundShade: 0xb98d63,
    groundDetail: 0xe8c9a0,
    midStyle: "dunes",
    farRelief: 0.3,
  },
  "open-desert": {
    skyTop: 0x8a6a86,
    skyHorizon: 0xe8c9a0,
    far: 0xa87c68,
    mid: 0xa06c50,
    midAccent: 0xc08b6a,
    ground: 0xc09a6a,
    groundShade: 0x9a7548,
    groundDetail: 0xd8b083,
    midStyle: "scrub",
    farRelief: 0.45,
  },
  "rocky-wadi": {
    skyTop: 0x6a5a7a,
    skyHorizon: 0xd8a878,
    far: 0x7a6058,
    mid: 0x8a6a52,
    midAccent: 0xa88060,
    ground: 0x9a8058,
    groundShade: 0x6f5c3e,
    groundDetail: 0xb89a68,
    midStyle: "boulders",
    farRelief: 0.62,
  },
  "mountain-approach": {
    skyTop: 0x4a4468,
    skyHorizon: 0xc08a6a,
    far: 0x584a5c,
    mid: 0x6a5450,
    midAccent: 0x87695c,
    ground: 0x8a7454,
    groundShade: 0x5f4f38,
    groundDetail: 0xa88a60,
    midStyle: "crags",
    farRelief: 0.95,
  },
};

/** Layer geometry. Heights are in view pixels, measured up from the horizon. */
export const LAYER = {
  farHeight: 76,
  midHeight: 46,
  /** Tile widths. Wide enough that repetition is not obvious while scrolling. */
  farTile: 256,
  midTile: 192,
  groundTile: 128,
  /** Parallax rates. Ground moves with the camera; the rest lag behind. */
  farScroll: 0.15,
  midScroll: 0.4,
} as const;

const SKY_BANDS = 20;

/** Mix two packed RGB ints. */
function blend(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

function texture(
  scene: PhaserNS.Scene,
  key: string,
  width: number,
  height: number,
  draw: (g: PhaserNS.GameObjects.Graphics) => void,
): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, width, height);
  g.destroy();
}

/**
 * A banded sky. One column wide — the scene stretches it, and since every band is
 * a flat colour there is nothing to distort.
 */
export function buildSky(scene: PhaserNS.Scene, key: string, theme: TerrainTheme): void {
  const bandHeight = Math.ceil(GROUND_Y / SKY_BANDS);
  texture(scene, key, 1, VIEW_HEIGHT, (g) => {
    for (let band = 0; band < SKY_BANDS; band++) {
      g.fillStyle(blend(theme.skyTop, theme.skyHorizon, band / (SKY_BANDS - 1)), 1);
      g.fillRect(0, band * bandHeight, 1, bandHeight + 1);
    }
    // Below the horizon the sky is never seen, but fill it so no gap can show.
    g.fillStyle(theme.skyHorizon, 1);
    g.fillRect(0, GROUND_Y, 1, VIEW_HEIGHT - GROUND_Y);
  });
}

/**
 * A skyline height function built from sine waves at whole-number frequencies.
 *
 * Whole frequencies over the tile width make the curve exactly periodic, so the
 * tile seam matches by construction rather than by patching the edges flat. That is
 * what stops a scrolling ridge from showing a repeating notch.
 */
export function ridgeHeights(
  width: number,
  seed: number,
  minHeight: number,
  maxHeight: number,
  roughness: number,
): number[] {
  const rng = createRng(seed);
  // `roughness` scales the fine detail: flat country should read as a smooth line,
  // and only broken ground should have a jagged edge.
  const waves = [
    { frequency: 1, amplitude: rng.range(0.5, 1) as number, phase: rng.range(0, Math.PI * 2) },
    { frequency: rng.int(2, 3), amplitude: rng.range(0.25, 0.5), phase: rng.range(0, Math.PI * 2) },
    {
      frequency: rng.int(5, 8),
      amplitude: rng.range(0.04, 0.12) * roughness,
      phase: rng.range(0, Math.PI * 2),
    },
  ];
  const total = waves.reduce((sum, wave) => sum + wave.amplitude, 0);

  const heights: number[] = [];
  for (let x = 0; x < width; x++) {
    let value = 0;
    for (const wave of waves) {
      value += wave.amplitude * Math.sin((x / width) * Math.PI * 2 * wave.frequency + wave.phase);
    }
    // Normalise to 0..1, then into the height band.
    const normalised = (value / total + 1) / 2;
    heights.push(minHeight + normalised * (maxHeight - minHeight));
  }
  return heights;
}

/**
 * Far layer: the horizon.
 *
 * Colour is blended toward the sky so distance reads as haze — the flat silhouette
 * of the first pass made the delta look like a skyline. Height comes from the
 * theme's relief, which is what separates flat delta from the mountain wall.
 */
export function buildFarLayer(
  scene: PhaserNS.Scene,
  key: string,
  theme: TerrainTheme,
  seed: number,
): void {
  const w = LAYER.farTile;
  const h = LAYER.farHeight;
  // Distance is mostly a colour problem: the further off, the closer to the sky.
  const hazed = blend(theme.far, theme.skyHorizon, 0.58);
  const crest = blend(hazed, theme.skyHorizon, 0.32);

  const minHeight = h * 0.08;
  const maxHeight = h * (0.14 + theme.farRelief * 0.82);
  const heights = ridgeHeights(w, seed, minHeight, maxHeight, theme.farRelief);

  texture(scene, key, w, h, (g) => {
    for (let x = 0; x < w; x++) {
      const height = Math.round(heights[x] ?? minHeight);
      g.fillStyle(hazed, 1);
      g.fillRect(x, h - height, 1, height);
      // A lit rim along the top, catching the light from the horizon.
      g.fillStyle(crest, 1);
      g.fillRect(x, h - height, 1, 2);
    }
  });
}

/** Middle layer: what grows or lies on this ground. */
export function buildMidLayer(
  scene: PhaserNS.Scene,
  key: string,
  theme: TerrainTheme,
  seed: number,
): void {
  const rng = createRng(seed);
  const w = LAYER.midTile;
  const h = LAYER.midHeight;

  // Slight haze on the middle band too, but much less than the horizon gets.
  const body = blend(theme.mid, theme.skyHorizon, 0.1);
  const accent = blend(theme.midAccent, theme.skyHorizon, 0.1);

  texture(scene, key, w, h, (g) => {
    switch (theme.midStyle) {
      case "reeds": {
        // A low bank of vegetation, with reeds standing out of it. Kept well under
        // half the layer height — the first pass had them tall enough to read as
        // buildings.
        const bankHeight = Math.round(h * 0.18);
        g.fillStyle(body, 1);
        g.fillRect(0, h - bankHeight, w, bankHeight);

        const clumps = rng.int(9, 14);
        for (let i = 0; i < clumps; i++) {
          const centre = rng.range(4, w - 4);
          const blades = rng.int(3, 7);
          for (let b = 0; b < blades; b++) {
            const bx = Math.round(centre + rng.range(-6, 6));
            if (bx < 0 || bx >= w - 1) continue;
            const height = rng.range(h * 0.22, h * 0.5);
            const top = Math.round(h - height);
            g.fillStyle(rng.chance(0.4) ? accent : body, 1);
            g.fillRect(bx, top, 1, Math.round(height));
            // A seed head leaning off the top, so it is a reed and not a post.
            g.fillRect(bx + (rng.chance(0.5) ? 1 : -1), top, 1, 3);
          }
        }

        // The odd palm, which is what actually says "delta" rather than "field".
        for (let i = 0; i < rng.int(1, 2); i++) {
          const x = Math.round(rng.range(20, w - 20));
          const trunk = Math.round(rng.range(h * 0.6, h * 0.85));
          g.fillStyle(blend(theme.groundShade, theme.skyHorizon, 0.15), 1);
          g.fillRect(x, h - trunk, 2, trunk);
          g.fillStyle(accent, 1);
          for (const dir of [-1, 1]) {
            for (let f = 0; f < 3; f++) {
              const span = 5 + f * 3;
              const drop = f * 2;
              g.fillRect(x + (dir < 0 ? -span : 2), h - trunk + drop, span, 1);
            }
          }
          g.fillRect(x - 1, h - trunk - 2, 4, 2);
        }
        break;
      }
      case "dunes": {
        g.fillStyle(body, 1);
        for (let x = 0; x < w; x += 4) {
          const crest = h * 0.5 + Math.sin((x / w) * Math.PI * 2) * (h * 0.28);
          g.fillRect(x, Math.round(crest), 4, h);
        }
        g.fillStyle(accent, 1);
        for (let i = 0; i < 14; i++) {
          g.fillRect(Math.round(rng.range(0, w)), Math.round(rng.range(h * 0.6, h)), 5, 2);
        }
        break;
      }
      case "scrub": {
        const bushes = rng.int(5, 8);
        for (let i = 0; i < bushes; i++) {
          const x = Math.round(rng.range(8, w - 8));
          const size = rng.int(4, 8);
          g.fillStyle(body, 1);
          g.fillRect(x - size, h - size, size * 2, size);
          g.fillStyle(accent, 1);
          g.fillRect(x - Math.round(size / 2), h - size - 3, size, 4);
        }
        break;
      }
      case "boulders": {
        const rocks = rng.int(4, 7);
        for (let i = 0; i < rocks; i++) {
          const x = Math.round(rng.range(10, w - 10));
          const rw = rng.int(10, 26);
          const rh = rng.int(8, Math.round(h * 0.8));
          g.fillStyle(body, 1);
          g.fillRect(x - Math.round(rw / 2), h - rh, rw, rh);
          g.fillStyle(accent, 1);
          g.fillRect(x - Math.round(rw / 2), h - rh, rw, 3);
        }
        break;
      }
      case "crags": {
        for (let x = 0; x < w; x += 8) {
          const height = rng.range(h * 0.3, h);
          g.fillStyle(rng.chance(0.3) ? accent : body, 1);
          g.fillRect(x, Math.round(h - height), 8, Math.round(height));
        }
        break;
      }
    }
  });
}

/** Ground: the strip the household actually walks on. */
export function buildGround(
  scene: PhaserNS.Scene,
  key: string,
  theme: TerrainTheme,
  seed: number,
): void {
  const rng = createRng(seed);
  const w = LAYER.groundTile;
  const h = VIEW_HEIGHT - GROUND_Y;

  const bands = 9;

  texture(scene, key, w, h, (g) => {
    /*
     * Banded vertically from lit near the horizon to shadowed at the bottom of the
     * frame. Flat ground read as a dead slab next to painted backdrop art — the
     * gradient is what makes it sit under the picture rather than beside it.
     */
    for (let band = 0; band < bands; band++) {
      g.fillStyle(blend(theme.ground, theme.groundShade, band / (bands - 1)), 1);
      g.fillRect(0, Math.round((band * h) / bands), w, Math.ceil(h / bands) + 1);
    }

    // Contact shadow along the horizon, so the household stands *on* the ground.
    g.fillStyle(blend(theme.groundShade, 0x000000, 0.35), 1);
    g.fillRect(0, 0, w, 2);

    // Scuffed dirt and wheel ruts, denser near the top where the eye lingers.
    for (let i = 0; i < 34; i++) {
      const y = Math.round(rng.range(4, h - 3));
      const x = Math.round(rng.range(0, w - 8));
      const lit = rng.chance(0.45);
      g.fillStyle(lit ? theme.groundDetail : blend(theme.groundShade, 0x000000, 0.2), 1);
      g.fillRect(x, y, rng.int(2, 9), 1 + (rng.chance(0.3) ? 1 : 0));
    }

    // Stones.
    for (let i = 0; i < 7; i++) {
      const x = Math.round(rng.range(2, w - 6));
      const y = Math.round(rng.range(6, h - 6));
      const size = rng.int(2, 4);
      g.fillStyle(blend(theme.groundDetail, theme.groundShade, 0.35), 1);
      g.fillRect(x, y, size + 1, size);
      g.fillStyle(theme.groundDetail, 1);
      g.fillRect(x, y, size + 1, 1);
    }

    // Scrub along the top edge, tying the bare ground into whatever grows behind it.
    for (let i = 0; i < 9; i++) {
      const x = Math.round(rng.range(2, w - 4));
      const y = Math.round(rng.range(2, Math.max(4, h * 0.45)));
      const height = rng.int(3, 6);
      g.fillStyle(rng.chance(0.5) ? theme.mid : theme.midAccent, 1);
      g.fillRect(x, y, 1, height);
      g.fillRect(x + 2, y + 2, 1, height - 2);
      g.fillRect(x - 1, y + 3, 1, Math.max(1, height - 3));
    }
  });
}

export interface LayerKeys {
  sky: string;
  far: string;
  mid: string;
  ground: string;
}

/**
 * Build every layer for a leg. Keys are namespaced by leg so switching legs cannot
 * pick up the previous leg's scenery.
 */
export function buildTerrainLayers(
  scene: PhaserNS.Scene,
  terrain: Terrain,
  legId: string,
): LayerKeys {
  const theme = THEMES[terrain];
  const seed = seedFrom(legId);
  const keys: LayerKeys = {
    sky: `sky:${legId}`,
    far: `far:${legId}`,
    mid: `mid:${legId}`,
    ground: `ground:${legId}`,
  };

  buildSky(scene, keys.sky, theme);
  // Offset the seeds so the three layers are not correlated with each other.
  buildFarLayer(scene, keys.far, theme, seed);
  buildMidLayer(scene, keys.mid, theme, seed ^ 0x9e3779b9);
  buildGround(scene, keys.ground, theme, seed ^ 0x85ebca6b);

  return keys;
}
