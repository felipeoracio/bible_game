// Phaser 3.90's ESM build exposes named exports only — there is no default export.
import * as Phaser from "phaser";
import { episode1 } from "@/content/episode1";
import { gameStore } from "@/state/store";
import { isLegComplete } from "@/sim/reducer";
import { distanceOver, PACE_COHESION } from "@/sim/systems/travel";
import {
  GROUND_Y,
  HOURS_PER_SECOND,
  PX_PER_KM,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from "../config";
import { buildTerrainLayers, LAYER, type LayerKeys } from "../terrain";
import { gapForCohesion, lookKey, PARTY, preloadParty } from "../party";

/**
 * The travel beat: left-to-right movement across a parallax landscape, with the
 * household strung out behind the leader according to the pace being kept.
 *
 * The simulation owns where the household is. This scene reads `distanceKm` every
 * frame and derives every sprite position from it, so the picture and the state can
 * never disagree. Input dispatches into the reducer; nothing is stored here that
 * the reducer already knows.
 */
const backdropKey = (legId: string) => `backdrop:${legId}`;

/**
 * How fast a painted backdrop moves against the camera.
 *
 * A leg's backdrop is a panorama of that whole stage of the journey, so rather than
 * picking a parallax rate by feel, it is derived: the painting is consumed exactly
 * as the leg is walked. Set out from Rameses at the left-hand edge of the art and
 * you reach its right-hand edge — the tents of Succoth — as you arrive.
 *
 * Art too narrow to cover the leg falls back to a slow drift, which reads as
 * scenery passing rather than as a journey, and will leave the frame before the
 * camp. Backdrops want to be at least `legDistanceKm * PX_PER_KM` wide once scaled
 * to the canvas height.
 */
function backdropScrollFactor(displayWidth: number, legDistanceKm: number): number {
  const travel = displayWidth - VIEW_WIDTH;
  const scrollRange = legDistanceKm * PX_PER_KM;
  if (travel <= 0 || scrollRange <= 0) return 0;
  return Math.min(travel / scrollRange, 1);
}

export class TravelScene extends Phaser.Scene {
  private backdrop?: Phaser.GameObjects.Image;
  private backdropScroll = 0;
  private far?: Phaser.GameObjects.TileSprite;
  private mid?: Phaser.GameObjects.TileSprite;
  private ground?: Phaser.GameObjects.TileSprite;
  private shadows: Phaser.GameObjects.Ellipse[] = [];
  private walkers: Phaser.GameObjects.Sprite[] = [];
  private marchKeys: Phaser.Input.Keyboard.Key[] = [];
  private pointerHeld = false;
  private layers!: LayerKeys;
  /** Eased so a pace change strings the column out gradually rather than snapping. */
  private cohesion = 1;

  constructor() {
    super("travel");
  }

  preload(): void {
    preloadParty(this);
    // Legs that ship painted art load it here; the rest generate their scenery.
    const { legId } = gameStore.get();
    const backdrop = episode1.legs.find((leg) => leg.id === legId)?.backdrop;
    if (backdrop) this.load.image(backdropKey(legId), backdrop);
  }

  create(): void {
    const { terrain, legId, legDistanceKm } = gameStore.get();
    const painted = this.textures.exists(backdropKey(legId));

    this.layers = buildTerrainLayers(this, terrain, legId);

    const worldWidth = legDistanceKm * PX_PER_KM + VIEW_WIDTH;
    this.cameras.main.setBounds(0, 0, worldWidth, VIEW_HEIGHT);

    // Sky is one pixel wide and stretched; every band is flat, so nothing distorts.
    this.add
      .image(0, 0, this.layers.sky)
      .setOrigin(0, 0)
      .setDisplaySize(VIEW_WIDTH, VIEW_HEIGHT)
      .setScrollFactor(0);

    if (painted) {
      /*
       * A single image, never tiled. The lighting travels across the panorama —
       * sunset over Egypt at one end, daylight at the other — so repeating it would
       * butt dusk straight against noon and put a seam down the sky.
       */
      const source = this.textures.get(backdropKey(legId)).getSourceImage();
      const scale = VIEW_HEIGHT / source.height;
      this.backdropScroll = backdropScrollFactor(source.width * scale, legDistanceKm);
      this.backdrop = this.add
        .image(0, 0, backdropKey(legId))
        .setOrigin(0, 0)
        .setScale(scale)
        .setScrollFactor(0);
    } else {
      // Generated scenery, for legs whose art has not been painted yet.
      this.far = this.add
        .tileSprite(0, GROUND_Y - LAYER.farHeight, VIEW_WIDTH, LAYER.farHeight, this.layers.far)
        .setOrigin(0, 0)
        .setScrollFactor(0);

      this.mid = this.add
        .tileSprite(0, GROUND_Y - LAYER.midHeight, VIEW_WIDTH, LAYER.midHeight, this.layers.mid)
        .setOrigin(0, 0)
        .setScrollFactor(0);
    }

    /*
     * A painted leg supplies its own foreground, so no generated ground is laid
     * over it. A flat strip cannot follow a panorama that runs from sand at one end
     * to grass at the other, and covering the lower third of the artwork throws away
     * the part with the most work in it — the rocks, the water, the scrub.
     */
    if (!painted) {
      this.ground = this.add
        .tileSprite(0, GROUND_Y, VIEW_WIDTH, VIEW_HEIGHT - GROUND_Y, this.layers.ground)
        .setOrigin(0, 0)
        .setScrollFactor(0);
    }

    /*
     * The household head leads; the rest trail in order. Later figures draw behind.
     * Each figure's texture comes from the look the player chose during creation,
     * so the family on the road is the family they built.
     */
    const identities = gameStore.get().identities;
    this.walkers = PARTY.map((figure, index) =>
      this.add
        .sprite(0, GROUND_Y, lookKey(figure.kind, identities[figure.id]?.look ?? 0))
        .setOrigin(0.5, 1)
        .setDepth(PARTY.length - index),
    );

    // Contact shadows, sized to each figure so a child does not cast an adult's
    // shadow. Drawn under everyone, above the ground.
    this.shadows = this.walkers.map((sprite) =>
      this.add
        .ellipse(0, GROUND_Y, Math.max(10, sprite.width * 0.85), 5, 0x000000, 0.3)
        .setDepth(0.5),
    );

    const leader = this.walkers[0];
    if (leader) {
      this.cameras.main.startFollow(leader, true, 0.08, 0.08);
      this.cameras.main.setFollowOffset(-VIEW_WIDTH / 4, 0);
    }

    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.marchKeys = [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      ];
      const paceKeys: [number, "steady" | "quick" | "driving"][] = [
        [Phaser.Input.Keyboard.KeyCodes.ONE, "steady"],
        [Phaser.Input.Keyboard.KeyCodes.TWO, "quick"],
        [Phaser.Input.Keyboard.KeyCodes.THREE, "driving"],
      ];
      for (const [code, pace] of paceKeys) {
        keyboard.addKey(code).on("down", () => gameStore.dispatch({ type: "SET_PACE", pace }));
      }
    }

    // Touch and mouse, for the tablets and Chromebooks this ships on.
    this.input.on("pointerdown", () => (this.pointerHeld = true));
    this.input.on("pointerup", () => (this.pointerHeld = false));
    this.input.on("pointerupoutside", () => (this.pointerHeld = false));
    this.input.on("gameout", () => (this.pointerHeld = false));

    this.cohesion = PACE_COHESION[gameStore.get().pace];
    this.layoutParty();
  }

  update(_time: number, delta: number): void {
    const state = gameStore.get();
    const seconds = delta / 1000;
    const marching = this.isMarching() && !isLegComplete(state);

    if (marching) {
      const hours = seconds * HOURS_PER_SECOND;
      const km = distanceOver(state.pace, state.terrain, hours);
      gameStore.dispatch({ type: "TRAVEL", km });
    }

    // Ease toward the pace's cohesion, and let the column close up when halted.
    const target = marching ? PACE_COHESION[state.pace] : 1;
    this.cohesion += (target - this.cohesion) * Math.min(1, seconds * 1.6);

    this.layoutParty(marching);

    // The layers are all pinned with scrollFactor 0 and scrolled by moving their
    // tile offset, so nothing here sets an x — doing that would push a pinned
    // object off screen by the full scroll distance.
    const scroll = this.cameras.main.scrollX;
    // Pinned to the screen, so it is moved by hand rather than by a scroll factor.
    if (this.backdrop) this.backdrop.x = -scroll * this.backdropScroll;
    if (this.far) this.far.tilePositionX = scroll * LAYER.farScroll;
    if (this.mid) this.mid.tilePositionX = scroll * LAYER.midScroll;
    if (this.ground) this.ground.tilePositionX = scroll;
  }

  private isMarching(): boolean {
    return this.pointerHeld || this.marchKeys.some((key) => key.isDown);
  }

  /**
   * Position every figure from the simulation's distance. The leader's x is the
   * single source of truth; the rest hang off it by the current cohesion gap.
   */
  private layoutParty(marching = false): void {
    const { distanceKm } = gameStore.get();
    const leadX = 64 + distanceKm * PX_PER_KM;
    const gap = gapForCohesion(this.cohesion);

    this.walkers.forEach((sprite, index) => {
      const x = leadX - index * gap;
      sprite.x = x;
      // Each figure bobs on its own phase, so the column does not march in lockstep.
      const bob = marching ? Math.abs(Math.sin(this.time.now / 90 + index * 1.1)) * 2 : 0;
      sprite.y = GROUND_Y - bob;

      // The shadow stays on the ground while the walker lifts off it.
      const shadow = this.shadows[index];
      if (shadow) {
        shadow.x = x;
        shadow.y = GROUND_Y - 1;
        shadow.setScale(1 - bob * 0.06, 1);
      }
    });
  }
}
