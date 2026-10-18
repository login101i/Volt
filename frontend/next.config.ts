import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // Stary URL hubu `/app` psuje Docker standalone → przeniesiony na `/panel`
  async redirects() {
    return [
      {
        source: '/app',
        destination: '/panel',
        permanent: false,
      },
      {
        source: '/app/:path*',
        destination: '/panel',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
