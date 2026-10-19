import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BellRing,
  Blocks,
  ChartNoAxesCombined,
  CircleGauge,
  CircleSlash,
  CircleUser,
  Clock,
  CreditCard,
  Download,
  FileClock,
  Fingerprint,
  Gauge,
  HeartPulse,
  Inbox,
  LayoutList,
  Mail,
  MailWarning,
  MessageSquareQuote,
  MessagesSquare,
  Radar,
  ScrollText,
  Send,
  ServerCog,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Ticket,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";

/* The rail is the app's only navigation, so it is also its table of
   contents: every screen the console ships appears here, and the filter
   box has to find every one of them by keyword. */

export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  keywords?: string;
  /** A screen whose data has no endpoint behind it yet. */
  unwired?: boolean;
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
        keywords: "home start kpi summary metrics totals",
      },
      {
        href: "/admin/health",
        label: "Health",
        description: "Services, dependencies and latency budgets",
        icon: HeartPulse,
        keywords: "uptime status db redis queue postgres s3 smtp ping",
      },
      {
        href: "/admin/analytics",
        label: "Analytics",
        description: "Traffic, signups and consent coverage",
        icon: ChartNoAxesCombined,
        keywords: "charts traffic pageviews visits sessions signups umami",
      },
    ],
  },
  {
    id: "people",
    title: "People",
    items: [
      {
        href: "/admin/people",
        label: "People",
        description: "Search accounts, inspect status, set levels",
        icon: Users,
        keywords: "users accounts search profile ban suspend delete level",
      },
      {
        href: "/admin/people/new",
        label: "New person",
        description: "Provision an account from the console",
        icon: UserPlus,
        keywords: "create invite onboard add operator staff signup",
      },
      {
        href: "/admin/people/u_1001",
        label: "Person 360",
        description: "One account in full: profile, devices, history",
        icon: CircleUser,
        keywords: "detail profile id devices sessions timeline moderation",
      },
      {
        href: "/admin/identities",
        label: "Identities",
        description: "Handles, reserved addresses and claim rules",
        icon: Fingerprint,
        keywords: "handle username slug reserved claim identity",
        unwired: true,
      },
      {
        href: "/admin/subscribers",
        label: "Subscribers",
        description: "Paid plans, renewals and entitlements",
        icon: CreditCard,
        keywords: "billing plan subscription renew entitlement pro",
      },
      {
        href: "/admin/export-requests",
        label: "Export requests",
        description: "GDPR data exports and their download windows",
        icon: Download,
        keywords: "gdpr dsar download privacy erase anonymise export",
      },
      {
        href: "/admin/feedback",
        label: "Feedback",
        description: "In-product reports, ratings and triage",
        icon: MessageSquareQuote,
        keywords: "reports ratings bugs suggestions nps survey triage",
      },
      {
        href: "/admin/waitlist",
        label: "Waitlist",
        description: "Pre-launch signups, sourcing and invites",
        icon: FileClock,
        keywords: "landing early access invites source referral launch",
        unwired: true,
      },
    ],
  },
  {
    id: "safety",
    title: "Safety",
    items: [
      {
        href: "/admin/restrictions",
        label: "Restrictions",
        description: "Active mutes, freezes and shadow limits",
        icon: ShieldAlert,
        keywords: "mute freeze restrict shadow ban scope expiry appeal",
      },
      {
        href: "/admin/appeals",
        label: "Appeals",
        description: "Requests to lift a restriction, and their verdicts",
        icon: Ticket,
        keywords: "appeal request review lift verdict pending resolved",
      },
      {
        href: "/admin/blocklist",
        label: "Blocklist",
        description: "Banned addresses, domains, IPs and devices",
        icon: CircleSlash,
        keywords: "block ban ip email domain device fingerprint deny",
      },
      {
        href: "/admin/limits",
        label: "Limits",
        description: "Rate limiter budgets and verification caps",
        icon: Gauge,
        keywords: "rate limit throttle quota otp sms verification budget",
      },
      {
        href: "/admin/security-events",
        label: "Security events",
        description: "Anomalies, failed logins and posture score",
        icon: ShieldCheck,
        keywords: "anomaly login failure 2fa mfa posture risk score event",
      },
    ],
  },
  {
    id: "support",
    title: "Support",
    items: [
      {
        href: "/admin/tickets",
        label: "Tickets",
        description: "The inbox: priority, owner, SLA and status",
        icon: Inbox,
        keywords: "support helpdesk conversation owner sla priority open",
      },
      {
        href: "/admin/tickets/t_2001",
        label: "Ticket thread",
        description: "One conversation, its history and its replies",
        icon: MessagesSquare,
        keywords: "thread reply message customer detail close resolve",
      },
    ],
  },
  {
    id: "messaging",
    title: "Messaging",
    items: [
      {
        href: "/admin/email/queue",
        label: "Email queue",
        description: "Outbound jobs, retries and dead letters",
        icon: Mail,
        keywords: "outbox jobs retry dead letter smtp queue pending",
      },
      {
        href: "/admin/email/deliveries",
        label: "Deliveries",
        description: "Sent mail and its provider outcome",
        icon: Send,
        keywords: "delivered bounced opened clicked sent provider smtp",
      },
      {
        href: "/admin/email/templates",
        label: "Templates",
        description: "Layouts, content and version history",
        icon: LayoutList,
        keywords: "layout subject body design version html render",
      },
      {
        href: "/admin/email/config",
        label: "Email config",
        description: "Senders, domains, keys and provider settings",
        icon: Settings,
        keywords: "sender from domain dkim spf dmarc api key resend smtp",
      },
      {
        href: "/admin/email/compose",
        label: "Compose",
        description: "Write and test a single message by hand",
        icon: MailWarning,
        keywords: "draft preview test send manual recipient subject",
      },
      {
        href: "/admin/email/inbox",
        label: "Inbox",
        description: "Replies and inbound bounces routed to us",
        icon: Inbox,
        keywords: "inbound reply autoreply bounce vacation route",
      },
      {
        href: "/admin/push",
        label: "Push",
        description: "Device tokens, campaigns and delivery rates",
        icon: Siren,
        keywords: "webpush fcm apns device token campaign notify",
      },
      {
        href: "/admin/notifications",
        label: "Notifications",
        description: "In-app notification rules and their reach",
        icon: BellRing,
        keywords: "inapp feed rules digest unread bell preference",
      },
    ],
  },
  {
    id: "platform",
    title: "Platform",
    items: [
      {
        href: "/admin/settings",
        label: "Settings",
        description: "Feature flags, signup mode and platform switches",
        icon: Blocks,
        keywords: "flags feature registration open closed rollout kill switch",
        unwired: true,
      },
      {
        href: "/admin/maintenance",
        label: "Maintenance",
        description: "Maintenance mode, notices and the status page",
        icon: Wrench,
        keywords: "downtime incident banner message schedule status page",
      },
      {
        href: "/admin/jobs",
        label: "Jobs",
        description: "Scheduled and background job runs",
        icon: Clock,
        keywords: "cron worker queue backlog scheduled task run job",
        unwired: true,
      },
      {
        href: "/admin/heartbeat",
        label: "Heartbeat",
        description: "Cron pings, deadlines and missed runs",
        icon: Activity,
        keywords: "cron ping deadman deadline missed schedule monitor",
      },
    ],
  },
  {
    id: "audit",
    title: "Audit",
    items: [
      {
        href: "/admin/activity",
        label: "Activity",
        description: "The live feed: who is on, what just happened",
        icon: Radar,
        keywords: "live feed online presence realtime now recent",
      },
      {
        href: "/admin/audit",
        label: "Audit trail",
        description: "Every console action, immutable and searchable",
        icon: ScrollText,
        keywords: "trail compliance history change operator action log",
      },
      {
        href: "/admin/account",
        label: "My account",
        description: "Your level, sessions, keys and preferences",
        icon: ServerCog,
        keywords: "operator profile password api key session mfa signout",
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

export function sectionFor(href: string): NavGroup | undefined {
  return NAV_GROUPS.find((g) => g.items.some((i) => i.href === href));
}

export function searchNav(query: string): NavGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return NAV_GROUPS;
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) =>
      [i.label, i.description, i.keywords ?? "", i.href].join(" ").toLowerCase().includes(q),
    ),
  })).filter((g) => g.items.length > 0);
}
