import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AWS Amplify automatycznie wykrywa Next.js i używa odpowiedniej konfiguracji
  // Nie używamy distDir: 'dist' bo Amplify potrzebuje domyślnej struktury .next
  // Disable image optimization
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

