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
  async redirects() {
    /* The 18-page era left bookmarks, emails and docs pointing at routes
       that were consolidated. Send every old path to its new home instead
       of a 404 — the query string rides along untouched. */
    const map: Record<string, string> = {
      "/admin/users": "/admin/people",
      "/admin/account-status": "/admin/people",
      "/admin/appeals": "/admin/security",
      "/admin/security/blocks": "/admin/security",
      "/admin/security/events": "/admin/security",
      "/admin/rate-limits": "/admin/limits",
      "/admin/verification-limits": "/admin/limits",
      "/admin/operations/health": "/admin/operations",
      "/admin/operations/logs": "/admin/operations",
      "/admin/operations/monitor": "/admin/operations",
      "/admin/operations/maintenance": "/admin/operations",
      "/admin/email": "/admin/messaging",
      "/admin/notifications": "/admin/messaging",
      "/admin/activity": "/admin/audit",
    };
    return Object.entries(map).map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }));
  },
};

export default nextConfig;