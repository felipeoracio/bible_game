import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The dev overlay floats over the bottom-left of the viewport, which is exactly
  // where a full-screen game menu lives. Off, so what we see is what ships.
  devIndicators: false,
};

export default nextConfig;
