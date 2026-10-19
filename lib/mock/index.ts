/* The only seam between the UI and the world.

   A page never imports an array — it imports one async function per read.
   That is the whole reason this file exists: when the API is wired up, every
   body below moves to lib/api.ts and turns into a fetch, and not one page
   file changes. The functions resolve immediately today; they are async from
   the start so the call sites already await.

   Filters and paging are done here rather than in a page, because a page
   that filters its own fixture array is a page that will silently stop
   filtering correctly the moment the array becomes a network response. */

import type {
  ActivityEvent,
  AnalyticsOverview,
  AppConfigRow,
  AppealDecision,
  DataExportRequest,
  AuditEvent,
  BroadcastInput,
  BroadcastPreview,
  DashSnapshot,
  EmailConfigRow,
  EmailDelivery,
  EmailJob,
  EmailTemplate,
  FeatureFlag,
  FeedbackRow,
  HealthSnapshot,
  IncidentBanner,
  InboundEmail,
  MaintenanceState,
  Notification,
  OnlineUser,
  OperatorAccount,
  Page,
  PushSubscription,
  ReservedAddress,
  SecurityEventRow,
  SecurityScore,
  SecretsPresence,
  Severity,
  Ticket,
  Subscriber,
  TirbeoIdentity,
  User,
  UserDetail,
  UserAppeal,
  UserRestriction,
  VerificationLimit,
  WaitlistEntry,
} from "./types";
import { NOW } from "./world";
import * as usersFixtures from "./users";
import * as safety from "./safety";
import * as support from "./support";
import * as email from "./email";
import * as ops from "./ops";
import * as config from "./config";

const HOUR = 3_600_000;

function sorted<T>(rows: T[], by: (r: T) => string): T[] {
  return [...rows].sort((a, b) => (by(a) < by(b) ? 1 : by(a) > by(b) ? -1 : 0));
}

function paginate<T>(rows: T[], page = 1, perPage = 25): Page<T> {
  const size = Math.max(1, perPage);
  const at = Math.max(1, page);
  return {
    items: rows.slice((at - 1) * size, at * size),
    total: rows.length,
    page: at,
    perPage: size,
  };
}

/** case-insensitive substring, the way a console's search box behaves. */
function matches(haystack: Array<string | null | undefined>, needle: string) {
  const q = needle.trim().toLowerCase();
  if (!q) return true;
  return haystack.some((v) => (v ?? "").toLowerCase().includes(q));
}

// ── overview ───────────────────────────────────────────────────────────────

export async function dash(): Promise<DashSnapshot> {
  return ops.dash;
}

export async function analytics(): Promise<AnalyticsOverview> {
  return ops.analytics;
}

export async function health(): Promise<HealthSnapshot> {
  return ops.health;
}

export async function slowQueries() {
  return ops.slowQueries;
}

// ── people ─────────────────────────────────────────────────────────────────

export async function listRecentPeople(days = 7): Promise<User[]> {
  return usersFixtures.users
    .filter((u) => NOW - Date.parse(u.createdAt) < days * 24 * HOUR)
    .slice(0, 8);
}

function profileName(userId: string): string | null {
  return usersFixtures.profiles.find((p) => p.userId === userId)?.name ?? null;
}

export async function getUser(id: string): Promise<UserDetail | null> {
  const user = usersFixtures.users.find((u) => u.id === id);
  if (!user) return null;

  const byUser = <T extends { userId: string | null }>(rows: T[]) =>
    rows.filter((r) => r.userId === id);

  return {
    user,
    profile: usersFixtures.profiles.find((p) => p.userId === id) ?? null,
    emails: byUser(usersFixtures.userEmails),
    phone: usersFixtures.userPhones.find((p) => p.userId === id) ?? null,
    security: usersFixtures.security.find((s) => s.userId === id) ?? null,
    sessions: byUser(usersFixtures.sessions),
    devices: byUser(usersFixtures.devices),
    logins: sorted(byUser(usersFixtures.logins), (r) => r.createdAt),
    restrictions: sorted(byUser(safety.restrictions), (r) => r.startedAt),
    appeals: sorted(byUser(safety.appeals), (r) => r.createdAt),
    statusEvents: sorted(byUser(ops.activityEvents), (r) => r.createdAt),
    deletion: usersFixtures.deletionRequests.find((d) => d.userId === id) ?? null,
    identity: usersFixtures.identities.find((i) => i.userId === id) ?? null,
    notifications: sorted(byUser(usersFixtures.notifications), (r) => r.createdAt),
    push: byUser(usersFixtures.pushSubscriptions),
    exports: sorted(byUser(usersFixtures.exportRequests), (r) => r.requestedAt),
    /* A person's tickets, which is why the ticket fixture carries a
       requesterId at all. */
    tickets: sorted(
      support.tickets.filter((t) => t.requesterId === id),
      (t) => t.updatedAt,
    ),
    emailsSent: sorted(
      email.emailDeliveries.filter((d) => d.userId === id),
      (d) => d.createdAt,
    ),
    audit: sorted(ops.auditEvents.filter((a) => a.targetType === "user" && a.targetId === id), (a) => a.createdAt),
  };
}

export async function listIdentities(): Promise<TirbeoIdentity[]> {
  return sorted(usersFixtures.identities, (i) => i.createdAt);
}

export async function listReservedAddresses(): Promise<ReservedAddress[]> {
  return usersFixtures.reservedAddresses;
}

export async function listExportRequests(
  filter: { status?: string; q?: string } = {},
): Promise<Page<DataExportRequest>> {
  let rows = usersFixtures.exportRequests;
  if (filter.status) rows = rows.filter((r) => r.status === filter.status);
  if (filter.q) rows = rows.filter((r) => matches([r.id, r.userId, r.fileName, r.format], filter.q!));
  return paginate(sorted(rows, (r) => r.requestedAt));
}

export async function listSubscribers(): Promise<Subscriber[]> {
  return support.subscribers;
}

export async function listFeedback(filter: { status?: string; kind?: string } = {}): Promise<FeedbackRow[]> {
  let rows = support.feedback;
  if (filter.status) rows = rows.filter((f) => f.status === filter.status);
  if (filter.kind) rows = rows.filter((f) => f.kind === filter.kind);
  return sorted(rows, (f) => f.createdAt);
}

export async function listWaitlist(): Promise<WaitlistEntry[]> {
  return [...support.waitlist].sort((a, b) => a.position - b.position);
}

export async function waitlistStats() {
  return support.waitlistStats;
}

// ── safety ─────────────────────────────────────────────────────────────────

export async function listRestrictions(filter: { severity?: string } = {}): Promise<UserRestriction[]> {
  const rows = filter.severity
    ? safety.restrictions.filter((r) => r.severity === filter.severity)
    : safety.restrictions;
  return sorted(rows, (r) => r.startedAt);
}

/** Is the restriction still biting, or has it expired and nobody filed?
    A derived label, not a read — so it is a plain function. */
export function restrictionState(r: UserRestriction): "active" | "expired" | "permanent" {
  if (!r.endsAt) return "permanent";
  return Date.parse(r.endsAt) > NOW ? "active" : "expired";
}

export async function listAppeals(filter: { decision?: AppealDecision | "" } = {}): Promise<UserAppeal[]> {
  const rows = filter.decision ? safety.appeals.filter((a) => a.decision === filter.decision) : safety.appeals;
  return sorted(rows, (a) => a.createdAt);
}

export async function listBlocklist(filter: { targetType?: string; active?: "yes" | "no" } = {}) {
  let rows = safety.blocklist;
  if (filter.targetType) rows = rows.filter((b) => b.targetType === filter.targetType);
  if (filter.active === "yes") rows = rows.filter((b) => b.isActive);
  if (filter.active === "no") rows = rows.filter((b) => !b.isActive);
  return sorted(rows, (b) => b.createdAt);
}

export async function verificationLimits(): Promise<VerificationLimit[]> {
  return safety.verificationLimits;
}

export async function rateLimitMetrics() {
  return safety.rateLimitMetrics;
}

export async function listSecurityEvents(
  filter: { severity?: Severity | ""; type?: string; q?: string; page?: number } = {},
): Promise<Page<SecurityEventRow>> {
  let rows = securityEventsSource();
  if (filter.severity) rows = rows.filter((e) => e.severity === filter.severity);
  if (filter.type) rows = rows.filter((e) => e.eventType === filter.type);
  if (filter.q) rows = rows.filter((e) => matches([e.id, e.ipAddress, e.eventType, e.userId], filter.q!));
  return paginate(sorted(rows, (e) => e.createdAt), filter.page);
}

function securityEventsSource(): SecurityEventRow[] {
  return safety.securityEvents;
}

export async function securityScore(): Promise<SecurityScore> {
  return safety.securityScore;
}

// ── support ────────────────────────────────────────────────────────────────

export async function listTickets(
  filter: { status?: string; priority?: string; assignee?: "me" | "unassigned" | ""; q?: string } = {},
): Promise<Ticket[]> {
  let rows = support.tickets;
  if (filter.status) rows = rows.filter((t) => t.status === filter.status);
  if (filter.priority) rows = rows.filter((t) => t.priority === filter.priority);
  if (filter.assignee === "unassigned") rows = rows.filter((t) => t.assigneeId === null);
  if (filter.assignee === "me") rows = rows.filter((t) => t.assigneeId === OPERATOR.id);
  if (filter.q) rows = rows.filter((t) => matches([t.id, t.subject, t.category], filter.q!));
  return sorted(rows, (t) => t.updatedAt);
}

export async function getTicket(id: string) {
  const ticket = support.tickets.find((t) => t.id === id);
  if (!ticket) return null;
  return {
    ticket,
    requester: usersFixtures.users.find((u) => u.id === ticket.requesterId) ?? null,
    assignee: usersFixtures.users.find((u) => u.id === ticket.assigneeId) ?? null,
    messages: support.ticketMessages
      .filter((m) => m.ticketId === id)
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
    attachments: support.ticketAttachments.filter((a) => a.ticketId === id),
  };
}

/** The helpdesk's own SLA clock, so a list can mark the overdue rows. */
export async function ticketIsOverdue(id: string): Promise<boolean> {
  const t = support.tickets.find((x) => x.id === id);
  if (!t || t.status === "resolved" || t.status === "closed") return false;
  return Date.parse(t.dueAt) < NOW;
}

// ── messaging ──────────────────────────────────────────────────────────────

export async function listEmailJobs(
  filter: { status?: string; kind?: string; category?: string } = {},
): Promise<EmailJob[]> {
  let rows = email.emailJobs;
  if (filter.status) rows = rows.filter((j) => j.status === filter.status);
  if (filter.kind) rows = rows.filter((j) => j.kind === filter.kind);
  if (filter.category) rows = rows.filter((j) => j.category === filter.category);
  return sorted(rows, (j) => j.createdAt);
}

export async function listDeliveries(filter: { status?: string; q?: string } = {}): Promise<EmailDelivery[]> {
  let rows = email.emailDeliveries;
  if (filter.status) rows = rows.filter((d) => d.status === filter.status);
  if (filter.q) rows = rows.filter((d) => matches([d.id, d.toEmail, d.subject, d.eventKey], filter.q!));
  return sorted(rows, (d) => d.createdAt);
}

export async function listTemplates(): Promise<EmailTemplate[]> {
  return [...email.emailTemplates].sort((a, b) => a.slug.localeCompare(b.slug));
}

export async function getTemplate(slug: string): Promise<EmailTemplate | null> {
  return email.emailTemplates.find((t) => t.slug === slug) ?? null;
}

export async function emailConfig(): Promise<{ config: EmailConfigRow; secrets: SecretsPresence }> {
  return { config: email.emailConfig, secrets: email.emailSecrets };
}

export async function previewBroadcast(input: BroadcastInput): Promise<BroadcastPreview> {
  return email.previewBroadcast(input);
}

/** A finished render, so the compose screen can show what a template send
    looks like without a provider in the loop. */
export async function sampleRender(): Promise<string> {
  return support.SAMPLE_PREVIEW_HTML;
}

/** Where abuse mail is routed — the one address the console tells a person. */
export async function abuseMailbox(): Promise<string> {
  return support.ABUSE_INBOX;
}

export async function listInbox(filter: { kind?: string } = {}): Promise<InboundEmail[]> {
  const rows = filter.kind ? email.inboundEmails.filter((m) => m.kind === filter.kind) : email.inboundEmails;
  return sorted(rows, (m) => m.receivedAt);
}

export async function listPushSubscriptions(): Promise<PushSubscription[]> {
  return sorted(usersFixtures.pushSubscriptions, (p) => p.lastUsedAt);
}

export async function listNotifications(filter: { type?: string } = {}): Promise<Notification[]> {
  const rows = filter.type
    ? usersFixtures.notifications.filter((n) => n.type === filter.type)
    : usersFixtures.notifications;
  return sorted(rows, (n) => n.createdAt);
}

export async function notificationRules() {
  return config.notificationRules;
}

// ── platform ───────────────────────────────────────────────────────────────

export async function appSettings(): Promise<AppConfigRow[]> {
  return config.appConfig;
}

export async function featureFlags(): Promise<FeatureFlag[]> {
  return config.featureFlags;
}

export async function maintenanceState(): Promise<{
  state: MaintenanceState;
  incidents: IncidentBanner[];
}> {
  return { state: ops.maintenance, incidents: ops.incidentBanners };
}

export async function listJobs(filter: { status?: string; name?: string } = {}) {
  let rows = ops.jobRuns;
  if (filter.status) rows = rows.filter((j) => j.status === filter.status);
  if (filter.name) rows = rows.filter((j) => j.name === filter.name);
  return sorted(rows, (j) => j.startedAt);
}

export async function cronSchedules() {
  return ops.cronSchedules;
}

export async function heartbeat() {
  return config.heartbeat;
}

// ── audit ──────────────────────────────────────────────────────────────────

export async function activityFeed(filter: { severity?: Severity | ""; limit?: number } = {}): Promise<ActivityEvent[]> {
  const rows = filter.severity
    ? ops.activityEvents.filter((a) => a.severity === filter.severity)
    : ops.activityEvents;
  return sorted(rows, (a) => a.createdAt).slice(0, filter.limit ?? 60);
}

export async function onlineNow(): Promise<OnlineUser[]> {
  return ops.onlineUsers;
}

export async function listAudit(
  filter: { action?: string; severity?: Severity | ""; targetType?: string; q?: string; page?: number } = {},
): Promise<Page<AuditEvent>> {
  let rows = ops.auditEvents;
  if (filter.severity) rows = rows.filter((a) => a.severity === filter.severity);
  if (filter.action) rows = rows.filter((a) => a.action === filter.action);
  if (filter.targetType) rows = rows.filter((a) => a.targetType === filter.targetType);
  if (filter.q) rows = rows.filter((a) => matches([a.id, a.action, a.targetId, actorName(a.actorId)], filter.q!));
  return paginate(sorted(rows, (a) => a.createdAt), filter.page);
}

/** The filter choices a page offers, counted over the whole log rather than
    the page currently on screen — a select that only lists what is visible
    cannot express “show me the failures I paged past”. */
export async function auditActions(): Promise<Array<{ action: string; count: number }>> {
  const counts = new Map<string, number>();
  for (const a of ops.auditEvents) counts.set(a.action, (counts.get(a.action) ?? 0) + 1);
  return [...counts.entries()]
    .map(([action, count]) => ({ action, count }))
    .sort((x, y) => y.count - x.count);
}

function actorName(actorId: string): string | null {
  const u = usersFixtures.users.find((x) => x.id === actorId);
  return u ? `${u.username} · ${u.email}` : null;
}

/** The operator the console is signed in as — with no auth, it is a fixture
    too, and every "by me" filter reads this one object. */
export const OPERATOR = {
  id: usersFixtures.users[0]!.id,
  username: usersFixtures.users[0]!.username!,
  email: usersFixtures.users[0]!.email,
  name: profileName(usersFixtures.users[0]!.id),
};

export async function operatorAccount(): Promise<OperatorAccount> {
  const user = usersFixtures.users[0]!;
  const byUser = <T extends { userId: string }>(rows: T[]) =>
    rows.filter((r) => r.userId === user.id);

  return {
    user,
    profile: usersFixtures.profiles.find((p) => p.userId === user.id) ?? null,
    security: usersFixtures.security.find((s) => s.userId === user.id) ?? null,
    emails: byUser(usersFixtures.userEmails),
    phone: usersFixtures.userPhones.find((p) => p.userId === user.id) ?? null,
    sessions: sorted(
      byUser(usersFixtures.sessions),
      (s) => s.lastUsedAt ?? s.createdAt,
    ),
    devices: sorted(byUser(usersFixtures.devices), (d) => d.lastUsedAt ?? d.createdAt),
    logins: sorted(byUser(usersFixtures.logins), (l) => l.createdAt),
    actions: sorted(
      ops.auditEvents.filter((a) => a.actorId === user.id),
      (a) => a.createdAt,
    ),
    level: user.isAdmin ? "admin" : "none",
  };
}

// ── the world's own integrity ──────────────────────────────────────────────

/* assertWorld() walks every fixture and throws on a reference that goes
   nowhere. Without it, a typo in a userId is a blank row on one screen and
   nobody notices until the day it is wired to a real database and the
   foreign key complains. Dev-only: a production build has no fixtures to
   check and no reason to spend a millisecond believing that. */

export function assertWorld(): void {
  const user = new Set(usersFixtures.users.map((u) => u.id));
  const restrictionIds = new Set(safety.restrictions.map((r) => r.id));
  const templateSlugs = new Set(email.emailTemplates.map((t) => t.slug));
  const ticketIds = new Set(support.tickets.map((t) => t.id));
  const jobIds = new Set(email.emailJobs.map((j) => j.id));
  const problems: string[] = [];

  const check = (where: string, id: string | null | undefined, exists: Set<string>) => {
    if (id && !exists.has(id)) problems.push(`${where} → ${id}`);
  };

  for (const p of usersFixtures.profiles) check("profile", p.userId, user);
  for (const e of usersFixtures.userEmails) check("userEmail", e.userId, user);
  for (const p of usersFixtures.userPhones) check("userPhone", p.userId, user);
  for (const s of usersFixtures.security) check("security", s.userId, user);
  for (const s of usersFixtures.sessions) check("session", s.userId, user);
  for (const d of usersFixtures.devices) check("device", d.userId, user);
  for (const l of usersFixtures.logins) check("login", l.userId, user);
  for (const i of usersFixtures.identities) check("identity", i.userId, user);
  for (const n of usersFixtures.notifications) check("notification", n.userId, user);
  for (const p of usersFixtures.pushSubscriptions) check("push", p.userId, user);
  for (const x of usersFixtures.exportRequests) check("export", x.userId, user);
  for (const d of usersFixtures.deletionRequests) check("deletion", d.userId, user);
  for (const r of safety.restrictions) check("restriction", r.userId, user);
  for (const a of safety.appeals) {
    check("appeal.user", a.userId, user);
    check("appeal.restriction", a.restrictionId, restrictionIds);
  }
  for (const b of safety.blocklist) check("blocklist.by", b.blockedBy, user);
  for (const e of safety.securityEvents) check("securityEvent", e.userId, user);
  for (const t of support.tickets) {
    check("ticket.requester", t.requesterId, user);
    check("ticket.assignee", t.assigneeId, user);
  }
  for (const m of support.ticketMessages) check("ticketMessage", m.ticketId, ticketIds);
  for (const a of support.ticketAttachments) check("attachment", a.ticketId, ticketIds);
  for (const f of support.feedback) check("feedback", f.userId, user);
  for (const s of support.subscribers) check("subscriber", s.userId, user);
  for (const j of email.emailJobs) {
    check("emailJob.user", j.userId, user);
    check("emailJob.template", j.templateSlug, templateSlugs);
  }
  for (const d of email.emailDeliveries) {
    check("delivery.user", d.userId, user);
    check("delivery.job", d.jobId, jobIds);
  }
  for (const m of email.inboundEmails) {
    check("inbound.user", m.userId, user);
    check("inbound.ticket", m.ticketId, ticketIds);
  }
  for (const a of ops.activityEvents) check("activity", a.userId, user);
  for (const a of ops.auditEvents) {
    check("audit.actor", a.actorId, user);
    if (a.targetType === "user") check("audit.target", a.targetId, user);
    if (a.targetType === "restriction") check("audit.target", a.targetId, restrictionIds);
  }
  for (const f of config.featureFlags) check("flag.updatedBy", f.updatedBy, user);

  /* An id that repeats would make a link resolve to the wrong row. */
  const seen = new Map<string, string>();
  for (const group of [
    ["user", usersFixtures.users],
    ["ticket", support.tickets],
    ["job", email.emailJobs],
    ["delivery", email.emailDeliveries],
    ["restriction", safety.restrictions],
    ["appeal", safety.appeals],
    ["block", safety.blocklist],
    ["securityEvent", safety.securityEvents],
    ["activity", ops.activityEvents],
    ["audit", ops.auditEvents],
    ["notification", usersFixtures.notifications],
    ["session", usersFixtures.sessions],
  ] as const) {
    for (const row of group[1] as Array<{ id: string }>) {
      const first = seen.get(row.id);
      if (first) problems.push(`duplicate id ${row.id} in ${first} and ${group[0]}`);
      seen.set(row.id, group[0]);
    }
  }

  if (problems.length > 0) {
    throw new Error(`mock world is inconsistent:\n  ${problems.join("\n  ")}`);
  }
}

/* Checked when the fixtures are loaded rather than per screen: one broken
   reference then fails every page at once, which is far easier to see than a
   blank cell on the one screen that used it. */
if (process.env.NODE_ENV !== "production") assertWorld();
