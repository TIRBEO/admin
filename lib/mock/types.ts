/* The shape of every read in the console.

   These mirror apps/api/prisma/schema.prisma column for column, in the
   camelCase Prisma writes (userId, targetType, openedAt, maxAttempts) —
   not the snake_case the database uses — so a future endpoint's JSON needs
   no mapping at a call site. Enums are string unions taken from the schema
   verbatim, including the loose ones (`status String @default("queued")`)
   that Prisma types as strings and the API constrains in code.

   Timestamps are ISO strings rather than Dates. A Prisma row is a Date, but
   the row a page receives over HTTP is a string, and this scaffold is
   written against what a page will actually get. lib/format.ts parses both.
   Anything endpoint-shaped rather than row-shaped carries a domain suffix:
   DashSnapshot, UserDetail, SecurityScore, BroadcastPreview. */

// ── user ───────────────────────────────────────────────────────────────────

export type UserStatus =
  | "active"
  | "restricted"
  | "banned"
  | "suspended"
  | "deactivated"
  | "deletion_pending"
  | "deleted";

export type User = {
  id: string;
  username: string | null;
  email: string;
  status: UserStatus;
  isAdmin: boolean;
  lastActiveAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserProfile = {
  userId: string;
  name: string | null;
  bio: string | null;
  gender: string | null;
  birthday: string | null;
  photoUrl: string | null;
  bannerUrl: string | null;
  pronouns: string | null;
  location: string | null;
  website: string | null;
  jobRole: string | null;
  jobCompany: string | null;
  jobPlace: string | null;
  jobStarted: string | null;
  followers: number;
  following: number;
  createdAt: string;
  updatedAt: string;
};

/** user_email — a person can hold several; one is primary. */
export type UserEmailRow = {
  id: string;
  userId: string;
  address: string;
  /** primary | secondary | recovery */
  kind: string;
  verifiedAt: string | null;
  isDefault: boolean;
  createdAt: string;
};

export type UserPhone = {
  userId: string;
  number: string | null;
  verifiedAt: string | null;
};

export type UserSecurity = {
  userId: string;
  totpEnabled: boolean;
  backupCodes: string[];
  mustChangePw: boolean;
  saveLoginInfo: boolean;
  require2FA: boolean;
  passkeys: number;
  updatedAt: string;
};

export type SessionStatus = "active" | "expired" | "revoked";

export type UserSession = {
  id: string;
  userId: string;
  status: SessionStatus;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  location: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
  revokedAt: string | null;
};

export type UserDevice = {
  id: string;
  userId: string;
  deviceName: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  location: string | null;
  /** active | revoked */
  status: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export type LoginMethod = "password" | "google" | "github" | "magic" | "passkey" | "otp";

export type UserLogin = {
  id: string;
  userId: string;
  method: LoginMethod;
  success: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  location: string | null;
  createdAt: string;
};

/** identities — TirbeoIdentity. The handle namespace, not the account. */
export type TirbeoIdentity = {
  id: string;
  userId: string | null;
  username: string;
  email: string | null;
  verifiedSource: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** admin/reserved-addresses — a handle nobody may claim. */
export type ReservedAddress = {
  id: string;
  username: string;
  reason: string;
  heldBy: string | null;
  createdAt: string;
};

export type UserDeletionRequest = {
  id: string;
  userId: string;
  reason: string | null;
  requestedAt: string;
  finalAt: string;
  cancelledAt: string | null;
  executedAt: string | null;
};

// ── safety ─────────────────────────────────────────────────────────────────

export type RestrictionSeverity = "notice" | "warning" | "strike";

export type UserRestriction = {
  id: string;
  userId: string;
  guideline: string;
  title: string;
  detail: string | null;
  severity: RestrictionSeverity;
  startedAt: string;
  endsAt: string | null;
  readAt: string | null;
};

export type AppealDecision = "upheld" | "overturned" | "pending";

export type UserAppeal = {
  id: string;
  restrictionId: string;
  userId: string;
  note: string;
  decision: AppealDecision | null;
  decidedAt: string | null;
  createdAt: string;
};

export type BlocklistTargetType = "ip" | "email" | "domain" | "user" | "device";

export type BlocklistRow = {
  id: string;
  targetType: BlocklistTargetType;
  targetId: string;
  reason: string | null;
  blockedBy: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Severity = "info" | "warning" | "error" | "critical";

/** security_events. Read today through the unified activity ledger, with
    `kind` surfaced as `eventType` so the panel's shape never changed. */
export type SecurityEventRow = {
  id: string;
  userId: string | null;
  eventType: string;
  severity: Severity;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type VerificationLimit = {
  id: string;
  method: string;
  max: number;
  windowMs: number;
  createdAt: string;
  updatedAt: string;
};

/** A live limiter as the screen sees it: the budget plus what it has spent. */
export type RateLimitBucket = {
  key: string;
  window: string;
  limit: number;
  used: number;
  resetAt: string;
  blocked: number;
};

export type RateLimitMetrics = {
  totalHits: number;
  totalBlocked: number;
  totalBypassed: number;
  blockRate: number;
  trackedQueries: number;
  buckets: RateLimitBucket[];
};

// ── activity, audit ────────────────────────────────────────────────────────

export type ActivityEvent = {
  id: string;
  userId: string | null;
  kind: string;
  title: string;
  detail: string | null;
  severity: Severity;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  /** The short code an operator quotes when reporting a row. */
  ref: string;
};

export type AuditEvent = {
  id: string;
  actorId: string;
  action: string;
  title: string;
  targetType: string;
  targetId: string;
  severity: Severity;
  ipAddress: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

// ── support ────────────────────────────────────────────────────────────────

/** support/tickets answered 410 when the helpdesk was removed; the screen is
    a rebuild brief, so this shape is ours to choose. */
export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type Ticket = {
  id: string;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  requesterId: string;
  assigneeId: string | null;
  unreadForAdmin: boolean;
  firstResponseAt: string | null;
  dueAt: string;
  createdAt: string;
  updatedAt: string;
};

export type TicketMessage = {
  id: string;
  ticketId: string;
  authorId: string | null;
  fromAdmin: boolean;
  body: string;
  createdAt: string;
};

export type TicketAttachment = {
  id: string;
  ticketId: string;
  name: string;
  bytes: number;
  mimeType: string;
  createdAt: string;
};

/** feedback lands in activity_events as `feedback.*` rows. */
export type FeedbackRow = {
  id: string;
  userId: string | null;
  kind: string;
  source: string | null;
  page: string | null;
  articleId: string | null;
  vote: "up" | "down" | null;
  rating: number | null;
  comment: string | null;
  /** open | triaged | fixed | wont_fix */
  status: string;
  createdAt: string;
};

export type DataExportRequest = {
  id: string;
  userId: string;
  /** 'json' | 'html' */
  format: string;
  /** pending | ready | failed */
  status: string;
  fileName: string;
  bytes: number | null;
  counts: Record<string, number> | null;
  error: string | null;
  requestedAt: string;
  builtAt: string | null;
};

/** admin/subscribers answers { subscribers: [] } today — the row shape is
    what a billing provider would hand back. */
export type Subscriber = {
  id: string;
  userId: string;
  plan: string;
  /** trialing | active | past_due | cancelled */
  status: string;
  provider: string;
  amountCents: number;
  currency: string;
  interval: "month" | "year";
  seats: number;
  currentPeriodEnd: string;
  startedAt: string;
};

/** apps/landing/app/api/waitlist — the store is not in the API at all. */
export type WaitlistEntry = {
  id: string;
  email: string;
  source: string | null;
  /** pending | invited | joined | blocked — the landing store's own words */
  status: string;
  position: number;
  invitedAt: string | null;
  createdAt: string;
};

// ── email ──────────────────────────────────────────────────────────────────

export type EmailJobKind = "otp" | "verify" | "reset" | "digest" | "notice" | "test";

export type EmailJob = {
  id: string;
  userId: string | null;
  dedupeKey: string | null;
  eventKey: string;
  toEmail: string;
  toAddress: string;
  category: string;
  /** low | normal | high */
  priority: string;
  kind: EmailJobKind;
  templateSlug: string | null;
  subject: string | null;
  /** queued | running | sent | failed | dropped */
  status: string;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  availableAt: string;
  processedAt: string | null;
  sentAt: string | null;
  createdAt: string;
};

export type EmailDelivery = {
  id: string;
  jobId: string | null;
  userId: string | null;
  toEmail: string;
  eventKey: string;
  event: string;
  category: string;
  subject: string;
  /** sent | delivered | bounced | failed | opened */
  status: string;
  provider: string | null;
  providerId: string | null;
  messageId: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  createdAt: string;
};

export type EmailTemplate = {
  id: string;
  slug: string;
  label: string | null;
  subject: string;
  html: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
};

/** email_configs. Secrets are never in the payload — a screen shows whether
    a key is set and its last four characters at most. */
export type EmailConfigRow = {
  id: string;
  provider: string;
  resendDomain: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  defaultFromEmail: string;
  defaultFromName: string;
  welcomeFromEmail: string | null;
  welcomeFromName: string | null;
  otpFromEmail: string | null;
  otpFromName: string | null;
  resetFromEmail: string | null;
  resetFromName: string | null;
  notifyFromEmail: string | null;
  notifyFromName: string | null;
  alertFromEmail: string | null;
  alertFromName: string | null;
  formsFromEmail: string | null;
  formsFromName: string | null;
  customDomain: string | null;
  dkimEnabled: boolean;
  enabled: boolean;
  updatedAt: string;
};

export type SecretsPresence = {
  resendApiKeySet: boolean;
  smtpPassSet: boolean;
};

/** An inbound reply or auto-responder, routed to us. */
export type InboundEmail = {
  id: string;
  from: string;
  to: string;
  subject: string;
  excerpt: string;
  /** message | bounce | autoreply | spam */
  kind: string;
  /** new | read | linked */
  status: string;
  ticketId: string | null;
  userId: string | null;
  receivedAt: string;
};

export type BroadcastInput = {
  subject: string;
  body: string;
  segment: string;
  audience: number;
};

export type BroadcastPreview = {
  audience: number;
  segments: Array<{ label: string; count: number }>;
  optOuts: number;
  suppressed: number;
  /** Hour buckets the send would spread over, so a burst is visible. */
  throttle: Array<{ label: string; count: number }>;
};

// ── notifications & push ───────────────────────────────────────────────────

export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  icon: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export type PushSubscription = {
  id: string;
  userId: string;
  endpoint: string;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string;
};

export type NotificationRule = {
  key: string;
  label: string;
  description: string;
  channels: Array<"inapp" | "email" | "push">;
  enabled: boolean;
  audience: number;
};

// ── platform & operations ──────────────────────────────────────────────────

export type AppConfigRow = {
  key: string;
  value: unknown;
  description: string | null;
  updatedAt: string;
};

export type FeatureFlag = {
  key: string;
  label: string;
  /** on | off | rollout */
  state: string;
  rollout: number;
  /** Who can flip it; a console that lets anyone change a flag is a bad day. */
  scope: "platform" | "beta" | "internal";
  updatedAt: string;
  updatedBy: string;
};

export type MaintenanceState = {
  enabled: boolean;
  message: string;
  startedAt: string | null;
  endsAt: string | null;
  /** Everyone is signed out of the app but not the console. */
  blockSignIn: boolean;
  allowAdmins: boolean;
  updatedAt: string;
  updatedBy: string;
};

export type IncidentBanner = {
  id: string;
  severity: Severity;
  title: string;
  message: string;
  startedAt: string;
  resolvedAt: string | null;
};

export type JobRun = {
  id: string;
  name: string;
  /** queued | running | succeeded | failed | skipped */
  status: string;
  durationMs: number;
  attempt: number;
  /** What it was told to do, as an operator reads it. */
  detail: string | null;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
};

export type CronSchedule = {
  name: string;
  pattern: string;
  /** The schedule's own deadline, not the platform's guess at one. */
  every: string;
  lastRunAt: string | null;
  lastStatus: string | null;
  nextRunAt: string;
  /** Missed pings in the last day — the number that means something. */
  misses24h: number;
  timeoutSecs: number;
};

export type HealthCheck = {
  name: string;
  /** ok | degraded | down | unknown */
  status: string;
  latencyMs: number | null;
  detail: string;
};

export type HealthSnapshot = {
  status: "ok" | "degraded" | "down" | "unknown";
  fetchedAt: string;
  uptimeSeconds: number;
  version: string;
  checks: HealthCheck[];
  redis: { configured: boolean; keys: number; memoryBytes: number | null; latencyMs: number | null };
  pool: { total: number; idle: number; inUse: number; waiting: number };
};

export type SlowQuery = {
  name: string;
  count: number;
  avgMs: number;
  p95Ms: number;
  maxMs: number;
};

export type OnlineUser = {
  userId: string;
  at: string;
  path: string | null;
};

// ── growth & analytics ─────────────────────────────────────────────────────

export type SeriesPoint = { label: string; value: number };

export type CountRow = { label: string; value: number };

export type DashSnapshot = {
  fetchedAt: string;
  uptimeSeconds: number;
  overview: {
    users: { total: number; active: number; activeToday: number; newToday: number; newThisWeek: number; newThisMonth: number };
    emails: { total: number; today: number; lastHour: number; failures: number; opened: number; clicked: number; openRate: number; clickRate: number };
    logins: { total: number; today: number; successToday: number; failedToday: number; successRateToday: number };
    sessions: { total: number; active: number };
    securityEventsToday: number;
    notifications: { total: number; unread: number };
    tickets: { total: number; open: number };
    push: { total: number };
    twoFA: number;
    mustChangePw: number;
    banned: number;
    suspended: number;
    deletionPending: number;
    requests: { hits: number; blocked: number; bypassed: number; blockRate: number };
  };
  tables: Array<{ name: string; rows: number }>;
  series: {
    users: SeriesPoint[];
    activity: SeriesPoint[];
    emails: SeriesPoint[];
    logins: SeriesPoint[];
    security: SeriesPoint[];
    signups: SeriesPoint[];
  };
  breakdowns: {
    usersByStatus: CountRow[];
    loginsByMethod: CountRow[];
    emailsByStatus: CountRow[];
    notificationsByType: CountRow[];
    activityTopKinds: CountRow[];
    oauth: CountRow[];
  };
  recents: {
    audit: AuditEvent[];
    logins: UserLogin[];
    security: SecurityEventRow[];
    emails: EmailDelivery[];
    tickets: Ticket[];
    notifications: Notification[];
  };
  alerts: Array<{ id: string; severity: Severity; title: string; detail: string; at: string }>;
  health: HealthSnapshot;
  slowest: SlowQuery[];
};

export type SecurityScore = {
  score: number;
  threatLevel: "low" | "medium" | "high" | "critical";
  factors: Array<{
    name: string;
    score: number;
    maxScore: number;
    status: "good" | "warning" | "critical";
    description: string;
  }>;
  stats: {
    totalUsers: number;
    usersWith2FA: number;
    activeSessions: number;
    revokedSessions: number;
    blockedIPs: number;
    blockedUsers: number;
  };
  topIPs: Array<{ ip: string; count: number; lastSeen: string }>;
  topEventTypes: Array<{ type: string; count: number }>;
  recentCritical: SecurityEventRow[];
};

export type AnalyticsOverview = {
  fetchedAt: string;
  rangeDays: number;
  traffic: SeriesPoint[];
  visits: SeriesPoint[];
  signups: SeriesPoint[];
  topPages: Array<{ path: string; views: number }>;
  referrers: CountRow[];
  devices: CountRow[];
  countries: CountRow[];
  consent: { total: number; consented: number; rate: number; byPurpose: CountRow[] };
  funnel: Array<{ label: string; count: number; rate: number }>;
};

/** Everything a person's 360° screen needs, as one read. */
export type UserDetail = {
  user: User;
  profile: UserProfile | null;
  emails: UserEmailRow[];
  phone: UserPhone | null;
  security: UserSecurity | null;
  sessions: UserSession[];
  devices: UserDevice[];
  logins: UserLogin[];
  restrictions: UserRestriction[];
  appeals: UserAppeal[];
  statusEvents: ActivityEvent[];
  deletion: UserDeletionRequest | null;
  identity: TirbeoIdentity | null;
  notifications: Notification[];
  push: PushSubscription[];
  exports: DataExportRequest[];
  tickets: Ticket[];
  emailsSent: EmailDelivery[];
  audit: AuditEvent[];
};

export type PeopleFilter = {
  q?: string;
  status?: UserStatus | "";
  admin?: "yes" | "no" | "";
  sort?: "newest" | "oldest" | "active" | "name";
  page?: number;
  perPage?: number;
};

export type Page<T> = { items: T[]; total: number; page: number; perPage: number };
