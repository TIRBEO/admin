import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgeCheck,
  BellRing,
  Boxes,
  ChartNoAxesCombined,
  CircleGauge,
  ClipboardList,
  FileClock,
  LifeBuoy,
  Mail,
  ScrollText,
  ServerCog,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  UserRoundCog,
  Users,
} from "lucide-react";

/* ── Navigation model ────────────────────────────────────────────
   Single source of truth for the shell: the sidebar, the mobile
   drawer, the command palette and the breadcrumbs all read from
   here, so a page is registered in exactly one place.

   Section ids mirror the account apps (myprofile / accounts) so an
   operator who knows "Security" in their own account knows exactly
   where the equivalent admin surface lives.                        */

export type NavItem = {
  href: string;
  label: string;
  /** One-line explanation — shown under the page title and in search. */
  description: string;
  icon: LucideIcon;
  /** Extra search terms so "2fa" or "abuse" still find the page. */
  keywords?: string;
};

export type NavGroup = {
  id: string;
  title: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    title: "Overview",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        description: "Live counts, errors and what needs attention",
        icon: CircleGauge,
        keywords: "home overview stats kpi start",
      },
      {
        href: "/admin/analytics",
        label: "Analytics",
        description: "Traffic, signups and consent coverage",
        icon: ChartNoAxesCombined,
        keywords: "charts umami traffic pageviews visits",
      },
      {
        href: "/admin/activity",
        label: "Activity",
        description: "Every write the platform recorded",
        icon: Activity,
        keywords: "events feed timeline recent changes",
      },
    ],
  },
  {
    id: "people",
    title: "People",
    items: [
      {
        href: "/admin/users",
        label: "Users",
        description: "Search, inspect, suspend or ban an account",
        icon: Users,
        keywords: "accounts members search ban suspend delete",
      },
      {
        href: "/admin/account-status",
        label: "Account status",
        description: "The levels an account can sit at, and who set them",
        icon: UserRoundCog,
        keywords: "levels trust restricted deactivated verify",
      },
      {
        href: "/admin/appeals",
        label: "Appeals",
        description: "Bans and suspensions somebody has contested",
        icon: LifeBuoy,
        keywords: "appeal contest revoke reinstatement",
      },
    ],
  },
  {
    id: "security",
    title: "Security",
    items: [
      {
        href: "/admin/security",
        label: "Security overview",
        description: "Posture score and the signals behind it",
        icon: ShieldCheck,
        keywords: "score posture risk posture",
      },
      {
        href: "/admin/security/blocks",
        label: "Blocks",
        description: "IPs, emails and devices currently refused",
        icon: ShieldAlert,
        keywords: "blocklist ban ip email device deny",
      },
      {
        href: "/admin/security/events",
        label: "Security events",
        description: "Sign-in anomalies, 2FA changes and recovery",
        icon: FileClock,
        keywords: "suspicious login alerts 2fa recovery events",
      },
      {
        href: "/admin/verification-limits",
        label: "Verification limits",
        description: "Caps on OTP, email verification and resets",
        icon: BadgeCheck,
        keywords: "otp rate limit verification quota",
      },
      {
        href: "/admin/rate-limits",
        label: "Rate limits",
        description: "Request budgets per route and per account",
        icon: ClipboardList,
        keywords: "throttle quota abuse budget",
      },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    items: [
      {
        href: "/admin/operations/health",
        label: "Health",
        description: "API, database, cache and queue status",
        icon: ServerCog,
        keywords: "uptime status db redis queue pool",
      },
      {
        href: "/admin/operations/logs",
        label: "Logs",
        description: "Server output and client-reported crashes",
        icon: ScrollText,
        keywords: "console errors stack traces crash",
      },
      {
        href: "/admin/operations/monitor",
        label: "Monitor",
        description: "Deploy, restart and inspect the running worker",
        icon: Boxes,
        keywords: "worker deploy restart process",
      },
      {
        href: "/admin/operations/maintenance",
        label: "Maintenance",
        description: "Scheduled maintenance windows",
        icon: Settings2,
        keywords: "downtime window schedule",
      },
    ],
  },
  {
    id: "communication",
    title: "Communication",
    items: [
      {
        href: "/admin/email",
        label: "Email",
        description: "Templates, sender identity and the send log",
        icon: Mail,
        keywords: "templates smtp sender deliverability",
      },
      {
        href: "/admin/notifications",
        label: "Notifications",
        description: "Broadcasts and per-category defaults",
        icon: BellRing,
        keywords: "broadcast push in-app alerts",
      },
      {
        href: "/admin/audit",
        label: "Audit",
        description: "Who changed what, and whether it was allowed",
        icon: ClipboardList,
        keywords: "trail compliance immutable history",
      },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export function titleFor(pathname: string): NavItem | undefined {
  // Longest href wins so /admin/security/blocks beats /admin/security.
  return ALL_NAV_ITEMS.filter(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
  ).sort((a, b) => b.href.length - a.href.length)[0];
}

/** Command-palette search across labels, descriptions and keywords. */
export function searchNav(query: string): NavGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return NAV_GROUPS;
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) =>
      [i.label, i.description, i.keywords ?? "", i.href]
        .join(" ")
        .toLowerCase()
        .includes(q),
    ),
  })).filter((g) => g.items.length > 0);
}