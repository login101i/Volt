import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dla AWS Amplify: zmieniamy distDir na 'dist' zamiast domyślnego '.next'
  // To pozwala na działanie API routes jako serverless functions
  distDir: 'dist',
  // Disable image optimization
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

