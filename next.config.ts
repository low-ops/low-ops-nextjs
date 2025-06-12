import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '39000' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 's3-gateway-apps.ci.cinaq.com' },
      { protocol: 'https', hostname: 's3-gateway-apps.trial.low-ops.com' },
    ],
  },
};

export default nextConfig;
