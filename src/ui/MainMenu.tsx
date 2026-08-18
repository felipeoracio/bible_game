"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

interface MenuItem {
  label: string;
  href?: string;
}

/**
 * Entries without an `href` render greyed out — the standard convention for a
 * menu whose options are not available yet. Continue lights up with the save system.
 */
const ITEMS: MenuItem[] = [
  { label: "Begin the march", href: "/opening" },
  { label: "Continue" },
  { label: "The Codex", href: "/codex" },
];

const ITEM_BASE =
  "text-pixel block w-80 max-w-full whitespace-nowrap border-2 px-6 py-2 text-center uppercase tracking-widest";

export default function MainMenu() {
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Enabled items only — arrow keys skip what cannot be chosen.
  const enabledIndexes = ITEMS.map((item, i) => (item.href ? i : -1)).filter((i) => i >= 0);

  useEffect(() => {
    const first = enabledIndexes[0];
    if (first !== undefined) itemRefs.current[first]?.focus();
    // Run once on mount; the menu never changes shape at runtime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const move = (from: number, delta: number) => {
    const position = enabledIndexes.indexOf(from);
    if (position < 0) return;
    const next = enabledIndexes[(position + delta + enabledIndexes.length) % enabledIndexes.length];
    if (next !== undefined) itemRefs.current[next]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      move(index, 1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      move(index, -1);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/* The art sits behind everything, with a scrim so text stays readable. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/art/menu-background.webp)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/25 to-ink"
      />

      <div className="relative flex w-full max-w-3xl flex-col items-center gap-10">
        <h1 className="w-full">
          <img
            src="/art/logo.webp"
            alt="By Way of the Wilderness — a Bible-based journey game"
            width={1200}
            height={672}
            className="mx-auto w-full max-w-[34rem] drop-shadow-[0_6px_0_rgba(23,18,14,0.55)]"
          />
        </h1>

        <nav aria-label="Main menu">
          <ul className="flex flex-col items-center gap-3">
            {ITEMS.map((item, index) =>
              item.href ? (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    ref={(node) => {
                      itemRefs.current[index] = node;
                    }}
                    onKeyDown={(event) => onKeyDown(event, index)}
                    className={`${ITEM_BASE} border-ochre/60 bg-ink/80 text-linen outline-none transition-colors hover:border-terracotta hover:bg-terracotta focus-visible:border-terracotta focus-visible:bg-terracotta`}
                  >
                    {item.label}
                  </Link>
                </li>
              ) : (
                <li key={item.label}>
                  <span
                    aria-disabled="true"
                    className={`${ITEM_BASE} cursor-not-allowed border-linen/15 bg-ink/45 text-linen/30`}
                  >
                    {item.label}
                  </span>
                </li>
              ),
            )}
          </ul>
        </nav>

        <p className="text-pixel-sm max-w-md text-center text-linen/45">
          Every camp, hardship, and decision is drawn from the text — and the game always
          tells you which is which.
        </p>
      </div>
    </main>
  );
}
