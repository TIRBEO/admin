import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  ChartNoAxesCombined,
  CircleGauge,
  CircleSlash,
  Gauge,
  HeartPulse,
  LayoutList,
  Mail,
  MessageSquareQuote,
  Radar,
  ScrollText,
  ServerCog,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";

/* The rail is the console's table of contents, so it lists exactly the
   screens that read from the API — nothing else.

   It used to list thirty-three, and most of them were drawn over fixture
   data: a Subscribers screen with invented plans, a Push screen with invented
   delivery rates, a Jobs screen whose cron table does not exist. An operator
   who acts on this console is acting on faith, and a screen full of plausible
   fake numbers is the quickest way to lose it. The `unwired` flag that marked
   some of them went the same way — it was wrong more often than it was right,
   which is worse than no marker at all.

   Each entry now names the permission its screen asks the API for, which is
   the same key the read itself is guarded by. The list is only honest if it can
   be checked against the code that enforces it, so `permission` is that
   check: an entry with no key is a screen every role can open. */

export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  keywords?: string;
  permission?: string;
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
        description: "Live counts, series and what needs attention",
        icon: CircleGauge,
        keywords: "home start kpi summary metrics totals overview",
        permission: "dashboard.read",
      },
      {
        href: "/admin/health",
        label: "Health",
        description: "Database, session store and what the platform says about itself",
        icon: HeartPulse,
        keywords: "uptime status db redis queue postgres smtp ping setup",
      },
      {
        href: "/admin/analytics",
        label: "Analytics",
        description: "Signups, ledger volume and what the console is used for",
        icon: ChartNoAxesCombined,
        keywords: "charts growth signups users by day top actions",
        permission: "analytics.read",
      },
      {
        href: "/admin/activity",
        label: "Activity",
        description: "The live ledger: who is on, what just happened",
        icon: Radar,
        keywords: "live feed online presence realtime now recent events",
        permission: "activity.read",
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
        description: "Search accounts, read status, ban, suspend, export",
        icon: Users,
        keywords: "users accounts search profile ban suspend delete level consent",
        permission: "people.read",
      },
      {
        href: "/admin/people/new",
        label: "New person",
        description: "Provision an account from the console",
        icon: UserPlus,
        keywords: "create invite onboard add operator staff signup provision",
        permission: "people.manage",
      },
    ],
  },
  {
    id: "safety",
    title: "Safety",
    items: [
      {
        href: "/admin/appeals",
        label: "Appeals",
        description: "Restrictions an owner has answered, and what was decided",
        icon: MessageSquareQuote,
        keywords: "restriction appeal ban suspend uphold overturn verdict pending",
        permission: "appeals.read",
      },
      {
        href: "/admin/blocklist",
        label: "Blocklist",
        description: "Addresses and accounts blocked, by whom and until when",
        icon: CircleSlash,
        keywords: "block blocked ip address email domain deny unblock entry",
        permission: "blocklist.read",
      },
      {
        href: "/admin/security-events",
        label: "Security events",
        description: "Failed sign-ins, alerts and the score they add up to",
        icon: ShieldAlert,
        keywords: "login failure 2fa mfa anomaly threat risk posture score",
        permission: "security.read",
      },
      {
        href: "/admin/limits",
        label: "Limits",
        description: "Rate limits, the traffic they stopped, the per-method caps",
        icon: Gauge,
        keywords: "rate limit throttle quota otp sms verification budget 429 bypass",
        permission: "limits.read",
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
        description: "Every request that came in, on its reference code",
        icon: Ticket,
        keywords: "support helpdesk conversation reply answered reference open",
        permission: "tickets.read",
      },
    ],
  },
  {
    id: "messaging",
    title: "Messaging",
    items: [
      {
        href: "/admin/email/deliveries",
        label: "Deliveries",
        description: "Every mail the platform sent and what the provider said",
        icon: Mail,
        keywords: "email sent delivered bounced complained opened clicked queue smtp",
        permission: "email.read",
      },
      {
        href: "/admin/email/templates",
        label: "Templates",
        description: "The mail bodies, and the slots each one fills",
        icon: LayoutList,
        keywords: "email template subject body html variables slug edit version",
        permission: "email.read",
      },
      {
        href: "/admin/email/config",
        label: "Email config",
        description: "Provider, domains and the address each kind of mail comes from",
        icon: ServerCog,
        keywords: "smtp resend api key domain dkim sender from alias",
        permission: "email.read",
      },
      {
        href: "/admin/notifications",
        label: "Notifications",
        description: "In-app notices, and the broadcast that reaches everyone",
        icon: BellRing,
        keywords: "inbox broadcast announcement bell unread digest preference send",
        permission: "notifications.read",
      },
    ],
  },
  {
    id: "platform",
    title: "Platform",
    items: [
      {
        href: "/admin/audit",
        label: "Audit trail",
        description: "Every console action, immutable and searchable",
        icon: ScrollText,
        keywords: "trail compliance history change operator action log",
        permission: "activity.read",
      },
      {
        href: "/admin/staff",
        label: "Staff",
        description: "Who is staff, what kind, and what each kind may do",
        icon: ShieldCheck,
        keywords: "admins administrators roles owner moderator support analyst grant revoke powers permissions roster",
        permission: "staff.read",
      },
      {
        href: "/admin/maintenance",
        label: "Maintenance",
        description: "The gate the platform puts up, and who it still lets through",
        icon: Wrench,
        keywords: "downtime banner message allowlist schedule outage status",
      },
      {
        href: "/admin/account",
        label: "My account",
        description: "Who you are to this console, and what your hands have changed",
        icon: ShieldCheck,
        keywords: "operator profile password two factor session signout level permission",
      },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** A permission set as delivered by `/admin/me`. Anything not named true is
    not allowed, including a key the API has since added — the set arrives
    complete, so an absent key means the operator was not given it. */
export type Permissions = Record<string, boolean>;

function visible(item: NavItem, permissions: Permissions | null): boolean {
  // null means the console has not asked yet (or could not); the rail then
  // lists everything it always listed rather than silently losing sections.
  if (!permissions || !item.permission) return true;
  return permissions[item.permission] === true;
}

/** The longest matching entry wins, so a detail route under /admin/people
    still reads as People rather than as whatever shorter path it also sits
    under. */
export function titleFor(pathname: string, permissions: Permissions | null = null): NavItem | undefined {
  return ALL_NAV_ITEMS.filter((i) => visible(i, permissions))
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

/** Sections, filtered by what the operator may open and then by the query.
    A group whose items were all refused disappears rather than rendering an
    orphan heading. */
export function searchNav(query: string, permissions: Permissions | null = null): NavGroup[] {
  const q = query.trim().toLowerCase();
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items
      .filter((i) => visible(i, permissions))
      .filter((i) =>
        !q ||
        [i.label, i.description, i.keywords ?? "", i.href].join(" ").toLowerCase().includes(q),
      ),
  })).filter((g) => g.items.length > 0);
}

/** Every screen this operator can reach — the ground the console checks a
    direct URL against before it renders a table and a refusal. */
export function allowedHrefs(permissions: Permissions | null): string[] {
  return ALL_NAV_ITEMS.filter((i) => visible(i, permissions)).map((i) => i.href);
}
