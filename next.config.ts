import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      // Real Haven logo assets (will be self-hosted in /public later)
      { protocol: "https", hostname: "havenvacationrentals.com" },
    ],
  },
};

export default nextConfig;
