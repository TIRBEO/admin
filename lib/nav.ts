import type { LucideIcon } from "lucide-react";
import {
  ChartNoAxesCombined,
  CircleGauge,
  Gauge,
  Mail,
  ScrollText,
  ServerCog,
  ShieldCheck,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
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
        keywords: "charts umami traffic pageviews visits signups",
      },
    ],
  },
  {
    id: "platform",
    title: "Platform",
    items: [
      {
        href: "/admin/people",
        label: "People",
        description: "Search accounts, inspect status, set levels",
        icon: Users,
        keywords: "users accounts search ban suspend delete level status",
      },
      {
        href: "/admin/security",
        label: "Security",
        description: "Posture score, blocks and security events",
        icon: ShieldCheck,
        keywords: "score posture risk blocklist ban ip 2fa events anomalies",
      },
      {
        href: "/admin/limits",
        label: "Limits",
        description: "Rate limiter budgets and verification caps",
        icon: Gauge,
        keywords: "rate limit throttle quota otp verification budget",
      },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    items: [
      {
        href: "/admin/operations",
        label: "Operations",
        description: "Health, runtime, activity log and maintenance",
        icon: ServerCog,
        keywords: "uptime status db redis queue monitor logs maintenance",
      },
      {
        href: "/admin/messaging",
        label: "Messaging",
        description: "Email delivery, templates, broadcasts and inbox",
        icon: Mail,
        keywords: "email templates smtp sender broadcast push notifications",
      },
      {
        href: "/admin/audit",
        label: "Audit",
        description: "Who changed what, and the live activity feed",
        icon: ScrollText,
        keywords: "trail compliance history activity online feed",
      },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export function titleFor(pathname: string): NavItem | undefined {
  return ALL_NAV_ITEMS.filter(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
  ).sort((a, b) => b.href.length - a.href.length)[0];
}

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
