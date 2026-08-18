"use client";

import { useEffect, useRef } from "react";

/**
 * Mounts Phaser into the page.
 *
 * Phaser touches `window` at import time, so it is loaded dynamically inside an
 * effect rather than imported at module scope — that keeps the route server-
 * renderable and keeps Phaser out of the initial bundle.
 */
export default function GameCanvas() {
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: import("phaser").Game | undefined;
    let cancelled = false;

    void (async () => {
      // Namespace import, not default — Phaser's ESM bundle has no default export.
      const [Phaser, { TravelScene }, { VIEW_HEIGHT, VIEW_WIDTH }] = await Promise.all([
        import("phaser"),
        import("@/game/scenes/TravelScene"),
        import("@/game/config"),
      ]);

      // Canvas text uses whatever the document has loaded, so the pixel font has
      // to be ready before any scene draws with it.
      await document.fonts.ready;

      // React 18+ StrictMode mounts effects twice in development; bail if the
      // cleanup already ran while these imports were in flight.
      if (cancelled || !parentRef.current) return;

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: parentRef.current,
        width: VIEW_WIDTH,
        height: VIEW_HEIGHT,
        pixelArt: true,
        roundPixels: true,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [TravelScene],
      });

      if (process.env.NODE_ENV !== "production") {
        // Debug handle: lets us inspect and step the scene from the console.
        (window as unknown as { __wilderness?: unknown }).__wilderness = game;
      }
    })();

    return () => {
      cancelled = true;
      game?.destroy(true);
      game = undefined;
    };
  }, []);

  return (
    /*
     * Two elements on purpose. Phaser's scale manager measures its parent's
     * bounding rect, which includes the frame's 30px border — so it must not be
     * mounted into the framed element itself, or the canvas is sized to the
     * border box and overflows the inside of the frame. The inner div is the
     * content box, and carries the 16:9 ratio so the canvas fits it exactly.
     */
    <div className="frame frame-dark w-full overflow-hidden">
      <div
        ref={parentRef}
        aria-label="The march out of Egypt"
        className="aspect-video w-full [&>canvas]:block"
      />
    </div>
  );
}
