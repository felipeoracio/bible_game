import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

/**
 * Departure Mono by Helena Zhang — SIL Open Font License 1.1.
 * Licence text lives beside the font in `app/fonts/`; keep it there, and credit
 * the typeface in the game credits before release.
 *
 * Self-hosted through next/font so it is preloaded and there is no flash of
 * fallback text — which matters more than usual here, because a pixel face and
 * its fallback have wildly different metrics.
 */
const departureMono = localFont({
  src: "./fonts/DepartureMono-Regular.woff2",
  variable: "--font-pixel",
  display: "block",
  weight: "400",
  style: "normal",
  fallback: ["ui-monospace", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  title: "By Way of the Wilderness",
  description:
    "Episode 1: Egypt to Sinai. A side-scrolling journey through the Exodus, where every camp, hardship, and decision comes from the text.",
};

export const viewport: Viewport = {
  themeColor: "#17120e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={departureMono.variable}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
