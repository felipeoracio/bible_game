"use client";

import Link from "next/link";
import { useState } from "react";
import { episode1 } from "@/content/episode1";
import CampScreen from "./CampScreen";
import EventOverlay from "./EventOverlay";
import QuizScreen from "./QuizScreen";
import WaypointScreen from "./WaypointScreen";
import GameCanvas from "./GameCanvas";
import Hud from "./Hud";
import PartyPanel from "./PartyPanel";

/**
 * The journey screen. Owns whether the camp overlay is open, which is the only
 * piece of view state on this route — everything else lives in the simulation.
 *
 * Camp is an overlay rather than a separate route so the Phaser canvas stays
 * mounted underneath: leaving and re-entering would tear down the scene and reload
 * the leg's backdrop for nothing.
 */
export default function PlayScreen() {
  const [camping, setCamping] = useState(false);
  const leg = episode1.legs[0];

  return (
    /*
     * `min-w-[320px]` is a deliberate floor. Below roughly 320px the framed panels
     * have no usable interior left and the whole screen collapses into unreadable
     * brass tubes — better to let the page scroll sideways at that point than to
     * keep crushing the content.
     */
    <main className="mx-auto flex min-h-screen min-w-[320px] max-w-4xl flex-col gap-4 px-4 py-6">
      <header className="text-pixel-sm flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 uppercase tracking-widest">
        <h1 className="text-linen">
          {leg ? `Leg ${leg.index} · ${leg.from} to ${leg.to}` : "The march"}
        </h1>
        <Link href="/" className="shrink-0 text-linen/50 hover:text-linen">
          Leave the march
        </Link>
      </header>

      <GameCanvas />
      <Hud onMakeCamp={() => setCamping(true)} />
      <PartyPanel />

      {/* Road events sit above the march; arrival above those; camp is player-opened. */}
      <EventOverlay />
      <WaypointScreen />
      {/* The checkpoint follows the arrival entry, once it has been read. */}
      <QuizScreen />
      {camping && <CampScreen onClose={() => setCamping(false)} />}
    </main>
  );
}
