/* The row shapes the console's readers are built on.

   These mirror apps/api/prisma/schema.prisma column for column, in the
   camelCase Prisma writes (userId, targetType, openedAt, maxAttempts) — not the
   snake_case the database uses — so a page's JSON needs no mapping at the call
   site. Enums are string unions taken from the schema verbatim, including the
   loose ones (`status String @default("queued")`) that Prisma types as strings
   and the API constrains in code.

   Timestamps are ISO strings rather than Dates: a Prisma row is a Date, but the
   row a page receives over HTTP is a string, and lib/format.ts parses both.

   A screen that needs something the API does not return in this shape declares
   it beside its own reader — lib/staff.ts, lib/security.ts and lib/operator.ts
   each do. What lives here is only what more than one reader shares. */

// ── accounts ────────────────────────────────────────────────────────────────

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

// ── safety ──────────────────────────────────────────────────────────────────

export type AppealDecision = "upheld" | "overturned" | "pending";

export type BlocklistTargetType = "ip" | "email" | "domain" | "user" | "device";

export type Severity = "info" | "warning" | "error" | "critical";

export type VerificationLimit = {
  id: string;
  method: string;
  max: number;
  windowMs: number;
  createdAt: string;
  updatedAt: string;
};

// ── the ledger ──────────────────────────────────────────────────────────────

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

export type OnlineUser = {
  userId: string;
  at: string;
  path: string | null;
};

// ── mail ────────────────────────────────────────────────────────────────────

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

// ── notifications ───────────────────────────────────────────────────────────

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

// ── counts ──────────────────────────────────────────────────────────────────

export type SeriesPoint = { label: string; value: number };

export type CountRow = { label: string; value: number };

export type Page<T> = { items: T[]; total: number; page: number; perPage: number };
