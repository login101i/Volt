import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Electron
  output: 'standalone',
  // Disable image optimization for Electron (optional, can improve build times)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

