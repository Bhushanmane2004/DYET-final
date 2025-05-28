import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore ESLint errors during production build
    ignoreDuringBuilds: true,
  },
  // You can add other Next.js config options here
};

export default nextConfig;
