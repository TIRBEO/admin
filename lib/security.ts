import { apiFailure, apiGet } from "@/lib/api";
import type { Load } from "@/lib/load-state";

import type { Severity } from "@/lib/types";

/* The security ledger, read from the platform.
 *
 * Two doors, and they answer different questions:
 *
 *   GET /admin/security/events — the rows. Filters, paging and the volume
 *     counts for today / week / month come back with them, so the header
 *     numbers and the table underneath can never disagree.
 *   GET /admin/security/score — the posture. It reports what it measured and,
 *     just as loudly, what it cannot measure. The console draws both halves,
 *     because an operator who is only shown a score has no way to know how
 *     much of it was counted and how much was assumed.
 *
 * A row's human handle is its reference code (`metadata.refCode`), which is
 * what a security mail quotes and what the door's `id` filter also accepts —
 * paste a code here and it finds the row. */

export type { Severity };

export type SecurityEvent = {
  id: string;
  ref: string | null;
  kind: string;
  title: string | null;
  detail: string | null;
  severity: Severity;
  ip: string | null;
  device: string | null;
  at: string;
  account: {
    id: string;
    email: string;
    username: string | null;
    name: string | null;
    staff: boolean;
  } | null;
};

export type LedgerWindow = { total: number; serious: number };

export type LedgerStats = {
  today: LedgerWindow;
  week: LedgerWindow;
  month: LedgerWindow;
  lifetime: number;
  activeBlocks: number;
};

export type LedgerPage = {
  rows: SecurityEvent[];
  total: number;
  page: number;
  perPage: number;
  stats: LedgerStats | null;
};

export type MeasuredFactor = {
  name: string;
  score: number;
  maxScore: number;
  status: "good" | "warning" | "critical";
  observed: number;
  detail: string;
};

export type Posture = {
  windowDays: number;
  score: number;
  scoreMax: number;
  posture: number;
  measured: MeasuredFactor[];
  unmeasured: Array<{ name: string; why: string }>;
  counts: {
    totalUsers: number;
    usersWith2FA: number;
    activeSessions: number;
    revokedSessions: number;
    blockedIPs: number;
    blockedUsers: number;
    criticalLastWindow: number;
  };
  busiestIPs: Array<{ ip: string; count: number; lastSeen: string | null }>;
  eventKinds: Array<{ type: string; count: number }>;
};

export type SecurityFilter = {
  severity: Severity | "";
  kind: string;
  q: string;
  from: string;
  page: number;
};

const PER_PAGE = 50;

type ApiUser = {
  email?: string | null;
  username?: string | null;
  isAdmin?: boolean;
  profile?: { name?: string | null } | null;
};

type ApiEvent = {
  id: string;
  userId?: string | null;
  kind?: string;
  eventType?: string;
  title?: string | null;
  detail?: string | null;
  severity?: Severity;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  user?: ApiUser | null;
};

type ApiLedger = {
  events?: ApiEvent[];
  total?: number;
  page?: number;
  limit?: number;
  stats?: {
    today?: { total?: number; critical?: number };
    week?: { total?: number; critical?: number };
    month?: { total?: number; critical?: number };
    total?: number;
    activeBlocks?: number;
  };
};

/** The reference code a staff member or an account would quote. */
function refOf(metadata: Record<string, unknown> | null | undefined): string | null {
  const raw = metadata?.refCode;
  return typeof raw === "string" && raw ? raw : null;
}

function toEvent(row: ApiEvent): SecurityEvent {
  const account = row.user?.email
    ? {
        id: row.userId ?? "",
        email: row.user.email,
        username: row.user.username ?? null,
        name: row.user.profile?.name ?? null,
        staff: row.user.isAdmin === true,
      }
    : null;

  return {
    id: row.id,
    ref: refOf(row.metadata),
    kind: row.eventType ?? row.kind ?? "event",
    title: row.title ?? null,
    detail: row.detail ?? null,
    severity: (row.severity ?? "info") as Severity,
    ip: row.ipAddress ?? null,
    device: row.userAgent ?? null,
    at: row.createdAt,
    account,
  };
}

export async function readLedger(filter: SecurityFilter): Promise<Load<LedgerPage>> {
  const params = new URLSearchParams({ page: String(filter.page), limit: String(PER_PAGE) });
  if (filter.severity) params.set("severity", filter.severity);
  if (filter.kind) params.set("eventType", filter.kind);
  if (filter.q) params.set("q", filter.q);
  if (filter.from) params.set("from", filter.from);

  const result = await apiGet<ApiLedger>(`/admin/security/events?${params.toString()}`);
  if (!result.ok) return apiFailure(result);
  if (!Array.isArray(result.data?.events)) {
    return { status: "error", message: "The API answered with no events in it." };
  }

  const data = result.data;
  const s = data.stats;
  const stats: LedgerStats | null = s
    ? {
        today: { total: s.today?.total ?? 0, serious: s.today?.critical ?? 0 },
        week: { total: s.week?.total ?? 0, serious: s.week?.critical ?? 0 },
        month: { total: s.month?.total ?? 0, serious: s.month?.critical ?? 0 },
        lifetime: s.total ?? 0,
        activeBlocks: s.activeBlocks ?? 0,
      }
    : null;

  return {
    status: "ready",
    data: {
      rows: (data.events ?? []).map(toEvent),
      total: data.total ?? (data.events ?? []).length,
      page: data.page ?? filter.page,
      perPage: data.limit ?? PER_PAGE,
      stats,
    },
  };
}

/** The posture. `null` when the door did not answer — a screen must then say
 *  "not read", which is a fact, rather than draw zeroes, which is a lie. */
type ApiPosture = Omit<Posture, "busiestIPs" | "eventKinds"> & {
  /* The score door names its two breakdowns after the columns they are counted
     from; the screen speaks in what an operator reads. */
  topIPs?: Array<{ ip: string; count: number; lastSeen: string | null }>;
  topEventTypes?: Array<{ type: string; count: number }>;
};

export async function readPosture(): Promise<Load<Posture>> {
  const result = await apiGet<ApiPosture>("/admin/security/score");
  if (!result.ok) return apiFailure(result);
  const data = result.data;
  if (!data || !Array.isArray(data.measured)) {
    return { status: "error", message: "The posture door answered with no factors in it." };
  }
  return {
    status: "ready",
    data: {
      ...data,
      measured: data.measured,
      unmeasured: data.unmeasured ?? [],
      busiestIPs: data.topIPs ?? [],
      eventKinds: data.topEventTypes ?? [],
    },
  };
}

/** The kinds worth offering as a filter: the ones the ledger actually holds. */
export function kindOptions(posture: Load<Posture>): Array<{ type: string; count: number }> {
  return posture.status === "ready" ? posture.data.eventKinds : [];
}
