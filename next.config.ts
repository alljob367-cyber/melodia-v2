import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // FIX #17: Enable React Strict Mode to catch bugs
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // Still needed for skills/ examples which have external deps
  },
};

export default nextConfig;
