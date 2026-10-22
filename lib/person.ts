import { apiFailure, apiGet, apiSend, type ApiResult } from "@/lib/api";
import type { LoadError } from "@/lib/load-state";

import type { UserStatus } from "@/lib/types";

/** One account, in full, as GET /api/admin/users/{id} answers it.
 *
 *  The door is honest about its own limits and this file keeps that honesty:
 *  it returns no last-seen, no last sign-in, no enforcement reason and no end
 *  date, so none of those is drawn anywhere the snapshot feeds. The ledger door
 *  takes a severity and a limit but no account filter, so an account's history
 *  cannot be read and no timeline is stood in for it.
 *
 *  Reference codes are the human-facing identifiers here. `banRefCode` and
 *  `suspendRefCode` are what an operator quotes and what the person was mailed;
 *  an account's own id is only ever a link, never a string to read out. */

const KINDS: UserStatus[] = [
  "active",
  "restricted",
  "banned",
  "suspended",
  "deactivated",
  "deletion_pending",
  "deleted",
];

function toKind(raw: unknown): UserStatus {
  return (KINDS as string[]).includes(raw as string) ? (raw as UserStatus) : "active";
}

export type PersonSession = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
};

export type EmailOptIns = {
  emailEnabled: boolean;
  paused: boolean;
  summaryEnabled: boolean;
  summaryFrequency: string;
  lastSummarySentAt: string | null;
};

export type SignupConsent = {
  acceptedAt: string | null;
  policyAccepted: boolean;
  adminDataAccess: boolean;
  signatureName: string | null;
  viaOAuth: boolean;
};

export type Person = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  photoUrl: string | null;
  adminRole: string | null;
  status: string;
  statusKind: UserStatus;
  isBanned: boolean;
  isSuspended: boolean;
  is2FAEnabled: boolean;
  emailVerified: boolean;
  banRefCode: string | null;
  suspendRefCode: string | null;
  createdAt: string;
  updatedAt: string;
  signupConsent: SignupConsent | null;
  /** Every consent switch except the signup record, in the database's own keys. */
  otherConsents: Array<{ key: string; granted: boolean }>;
  emailOptIns: EmailOptIns;
  /** Newest sessions the door returns, whatever their number. */
  sessions: PersonSession[];
  sessionCount: number;
  notificationCount: number;
};

type ApiPerson = {
  id?: string;
  email?: string;
  username?: string | null;
  name?: string | null;
  photoUrl?: string | null;
  adminRole?: string | null;
  status?: string;
  statusKind?: string;
  isBanned?: boolean;
  isSuspended?: boolean;
  is2FAEnabled?: boolean;
  emailVerified?: boolean;
  banRefCode?: string | null;
  suspendRefCode?: string | null;
  createdAt?: string;
  updatedAt?: string;
  consents?: Record<string, unknown> | null;
  signupConsent?: Record<string, unknown> | null;
  notificationPreferences?: Record<string, unknown> | null;
  emailOptIns?: Partial<EmailOptIns>;
  sessions?: Array<Partial<PersonSession>>;
  _count?: { sessions?: number; notifications?: number };
};

const bool = (v: unknown) => v === true;

function str(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

function signup(consents: ApiPerson["signupConsent"]): SignupConsent | null {
  if (!consents || typeof consents !== "object" || Array.isArray(consents)) return null;
  return {
    acceptedAt: str(consents.acceptedAt),
    policyAccepted: bool(consents.policyAccepted),
    adminDataAccess: bool(consents.adminDataAccess),
    signatureName: str(consents.signatureName),
    viaOAuth: bool(consents.oauth),
  };
}

/** The consent switches the signup record does not already cover. Only booleans
 *  are drawn — a key holding anything else is shown by its name rather than
 *  guessed at. */
function otherConsents(consents: ApiPerson["consents"]): Array<{ key: string; granted: boolean }> {
  if (!consents || typeof consents !== "object" || Array.isArray(consents)) return [];
  return Object.entries(consents)
    .filter(([key, value]) => key !== "signupConsent" && typeof value === "boolean")
    .map(([key, value]) => ({ key, granted: value === true }));
}

function toPerson(d: ApiPerson): Person {
  const opt = d.emailOptIns ?? {};
  return {
    id: d.id!,
    email: d.email!,
    username: d.username ?? null,
    name: d.name ?? null,
    photoUrl: d.photoUrl ?? null,
    adminRole: d.adminRole ?? null,
    status: d.status ?? "ACTIVE",
    statusKind: toKind(d.statusKind),
    isBanned: bool(d.isBanned),
    isSuspended: bool(d.isSuspended),
    is2FAEnabled: bool(d.is2FAEnabled),
    emailVerified: bool(d.emailVerified),
    banRefCode: d.banRefCode ?? null,
    suspendRefCode: d.suspendRefCode ?? null,
    createdAt: d.createdAt!,
    updatedAt: d.updatedAt ?? d.createdAt!,
    signupConsent: signup(d.signupConsent ?? null),
    otherConsents: otherConsents(d.consents ?? null),
    emailOptIns: {
      emailEnabled: opt.emailEnabled !== false,
      paused: bool(opt.paused),
      summaryEnabled: bool(opt.summaryEnabled),
      summaryFrequency: opt.summaryFrequency ?? "weekly",
      lastSummarySentAt: opt.lastSummarySentAt ?? null,
    },
    sessions: (Array.isArray(d.sessions) ? d.sessions : []).map((s) => ({
      id: s.id ?? "",
      userAgent: s.userAgent ?? null,
      ipAddress: s.ipAddress ?? null,
      createdAt: s.createdAt ?? "",
      expiresAt: s.expiresAt ?? "",
    })),
    sessionCount: d._count?.sessions ?? 0,
    notificationCount: d._count?.notifications ?? 0,
  };
}

/** Three answers and they must not collapse into each other: an id the API does
 *  not recognise is a 404 the operator should see as no such account, while an
 *  id the API was never able to be asked about is a failure. Reporting that as
 *  "no such person" would tell an operator an account does not exist because
 *  this console could not reach the database. */
export type PersonRead =
  | { kind: "found"; person: Person }
  | { kind: "absent" }
  | { kind: "error"; load: LoadError };

export async function readPerson(id: string): Promise<PersonRead> {
  const result = await apiGet<ApiPerson>(`/admin/users/${encodeURIComponent(id)}`);
  if (result.status === 404) return { kind: "absent" };

  const d = result.data;
  if (!result.ok || !d?.id || !d.email || !d.createdAt) {
    return { kind: "error", load: result.ok ? { status: "error", message: "The API answered with no account in it." } : apiFailure(result) };
  }

  return { kind: "found", person: toPerson(d) };
}

// ── writes ─────────────────────────────────────────────────────────────────

/** POST /api/admin/users. The door accepts an email or a Tirbeo username and
 *  refuses anything else; nothing on this shape is invented — a field the door
 *  did not return stays undefined rather than defaulted. */
export type CreateAccountBody = {
  email?: string;
  username?: string;
  name?: string;
  recoveryEmail?: string;
  adminRole?: string | null;
  sendEmail?: boolean;
};

export type CreatedAccount = {
  user: {
    id: string;
    email: string;
    username: string | null;
    name: string | null;
    adminRole: string | null;
    mustChangePassword: boolean;
  };
  /** Present only where the API chose to echo one, which it restricts to its
   *  own non-production builds. It is never recoverable after this response. */
  temporaryPassword?: string;
  temporaryPasswordRef?: string;
  supabaseProvisioned?: boolean;
  emailSent?: boolean;
  emailRecipient?: string;
  note?: string;
};

export type CreateAccount = ApiResult<CreatedAccount | { error?: string }>;

export async function createAccount(body: CreateAccountBody): Promise<CreateAccount> {
  return apiSend<CreatedAccount | { error?: string }>("/admin/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export type PersonAction = "ban" | "unban" | "suspend" | "unsuspend";

export async function runPersonAction(
  id: string,
  action: PersonAction,
  opts: { reason?: string; days?: number } = {},
): Promise<ApiResult<{ message?: string; until?: string | null; error?: string }>> {
  const payload: Record<string, unknown> = {};
  if (opts.reason) payload.reason = opts.reason;
  if (action === "suspend" && opts.days) payload.days = opts.days;

  return apiSend(`/admin/users/${encodeURIComponent(id)}/${action}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** PATCH /api/admin/users/{id}. The door takes a display name, an admin level
 *  and a status; enforcement goes through the action routes above, which is
 *  where a reference code and the person's own mail come from. */
export async function patchPerson(
  id: string,
  body: { displayName?: string; adminRole?: string | null },
): Promise<ApiResult<{ name?: string | null; adminRole?: string | null; status?: string; error?: string }>> {
  return apiSend(`/admin/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
