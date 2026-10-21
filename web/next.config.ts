import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the starter on ordinary static/dynamic routing until data caching is designed.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
