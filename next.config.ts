import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    /* This app is a git submodule, so Turbopack would otherwise set its
       filesystem root to apps/admin and fail to resolve the hoisted `next`
       package ("Could not find the Next.js package"). Point it at the
       workspace root explicitly. */
    root: path.resolve(__dirname, "../.."),
  },
  async redirects() {
    /* Two eras of bookmarks, emails and docs point at routes that no longer
       exist. Every destination below is a real screen in the current set, so
       nobody lands on a 404. Not permanent: the console is being rebuilt
       screen by screen and a 301 a browser caches forever would outlive the
       next move. */
    const map: Record<string, string> = {
      "/admin/users": "/admin/people",
      "/admin/account-status": "/admin/people",
      "/admin/security": "/admin/security-events",
      "/admin/security/blocks": "/admin/blocklist",
      "/admin/security/events": "/admin/security-events",
      "/admin/rate-limits": "/admin/limits",
      "/admin/verification-limits": "/admin/limits",
      "/admin/operations": "/admin/health",
      "/admin/operations/health": "/admin/health",
      "/admin/operations/logs": "/admin/activity",
      "/admin/operations/monitor": "/admin/security-events",
      "/admin/operations/maintenance": "/admin/maintenance",
      "/admin/email": "/admin/email/deliveries",
      "/admin/messaging": "/admin/email/deliveries",
      /* Screens that were drawn over fixture data and have been deleted.
         These point at the live screen that answers the same question; the
         rest are left to 404 rather than sent somewhere they did not ask
         for. */
      "/admin/email/queue": "/admin/email/deliveries",
      "/admin/restrictions": "/admin/appeals",
      "/admin/heartbeat": "/admin/health",
      "/admin/jobs": "/admin/health",
      "/admin/export-requests": "/admin/people",
      "/admin/identities": "/admin/people",
    };
    return Object.entries(map).map(([source, destination]) => ({
      source,
      destination,
      permanent: false,
    }));
  },
};

export default nextConfig;