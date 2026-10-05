import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    /* A stale loopback NEXT_PUBLIC_API_URL (dev .env.local copied into the
       build environment) must never be baked into a production bundle. */
    NEXT_PUBLIC_API_URL:
      process.env.NODE_ENV === "production" &&
      /localhost|127\.0\.0\.1/.test(process.env.NEXT_PUBLIC_API_URL ?? "")
        ? "https://api.tirbeo.com"
        : process.env.NEXT_PUBLIC_API_URL ??
          (process.env.NODE_ENV === "development"
            ? "http://localhost:3000"
            : "https://api.tirbeo.com"),
  },
  turbopack: {
    /* This app is a git submodule, so Turbopack would otherwise set its
       filesystem root to apps/admin and fail to resolve the hoisted `next`
       package ("Could not find the Next.js package"). Point it at the
       workspace root explicitly. */
    root: path.resolve(__dirname, "../.."),
  },
};

export default nextConfig;