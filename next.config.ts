import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@tirbeo/theme', '@tirbeo/icons'],
  experimental: {
    // Disable static generation for all pages
  },
  // Force all pages to be dynamically rendered
  output: undefined,
};

export default nextConfig;
