import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@tirbeo/theme', '@tirbeo/icons'],
  // Local monorepo only: admin's node_modules links to the repo-root pnpm store,
  // so Turbopack needs the workspace root. Unset on Vercel (standalone repo).
  ...(process.env.TURBOPACK_ROOT ? { turbopack: { root: process.env.TURBOPACK_ROOT } } : {}),
  experimental: {
    // Disable static generation for all pages
  },
  // Force all pages to be dynamically rendered
  output: undefined,
};

export default nextConfig;
