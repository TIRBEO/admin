import { apiFailure, apiGet } from "@/lib/api";
import type { Load } from "@/lib/load-state";

import type { Severity } from "@/lib/types";

/* The console's audit trail: GET /admin/audit.

   The door pages with limit/offset and answers {total, limit, offset, events}.
   Each event carries both the machine key (`action`, `kind`) and the sentence a
   person reads (`title`), the short `ref` an operator quotes, and the `actorId`
   who did it. Where the change landed is inside `metadata` as targetType /
   targetId — there is no top-level target column and the row never carries an
   IP, so the old screen's IP column has no source and is gone.

   One quirk worth naming: the route reads a `targetType` search param and hands
   it to the query builder, but the builder never applies it — a targetType
   filter returns everything. It is deliberately not offered here; a filter that
   silently does nothing is the exact lie this trail exists to prevent. */

type ApiEvent = {
  id: string;
  userId: string | null;
  kind: string;
  title: string;
  detail: string | null;
  metadata: Record<string, unknown> | null;
  severity: Severity;
  createdAt: string;
  ref: string;
  action: string;
  actorId: string | null;
  /** The actor resolved to a person, or null when the account is gone. */
  actor?: Actor | null;
};

export type Actor = { email: string; username: string | null; name: string | null };

export type AuditRow = {
  id: string;
  actorId: string | null;
  actor: Actor | null;
  action: string;
  title: string;
  detail: string | null;
  targetType: string | null;
  targetId: string | null;
  severity: Severity;
  ref: string;
  createdAt: string;
};

export type AuditView = {
  rows: AuditRow[];
  total: number;
  limit: number;
  offset: number;
};

export type AuditFilter = {
  id: string;
  action: string;
  actorId: string;
  severity: Severity | "";
  from: string;
  to: string;
  limit: number;
  offset: number;
};

function toRow(e: ApiEvent): AuditRow {
  const meta = e.metadata ?? {};
  return {
    id: e.id,
    actorId: e.actorId ?? e.userId ?? null,
    actor: e.actor ?? null,
    action: e.action ?? e.kind,
    title: e.title,
    detail: e.detail ?? null,
    // Target is a metadata field, not a column; it may be null on rows that
    // wrote none.
    targetType: typeof meta.targetType === "string" ? meta.targetType : null,
    targetId: typeof meta.targetId === "string" ? meta.targetId : null,
    severity: e.severity,
    ref: e.ref,
    createdAt: e.createdAt,
  };
}

export async function readAudit(filter: AuditFilter): Promise<Load<AuditView>> {
  const params = new URLSearchParams({
    limit: String(filter.limit),
    offset: String(filter.offset),
  });
  if (filter.id) params.set("id", filter.id);
  if (filter.action) params.set("action", filter.action);
  if (filter.actorId) params.set("actorId", filter.actorId);
  if (filter.severity) params.set("severity", filter.severity);
  if (filter.from) params.set("from", filter.from);
  if (filter.to) params.set("to", filter.to);

  const result = await apiGet<{
    total?: number;
    limit?: number;
    offset?: number;
    events?: ApiEvent[];
  }>(`/admin/audit?${params.toString()}`);

  if (!result.ok) return apiFailure(result);
  const body = result.data;
  if (!body || !Array.isArray(body.events)) {
    return { status: "error", message: "The API answered with no events in it." };
  }

  const rows = body.events.map(toRow);

  if (rows.length === 0 && filter.offset === 0) return { status: "empty" };

  return {
    status: "ready",
    data: {
      rows,
      total: body.total ?? rows.length,
      limit: body.limit ?? filter.limit,
      offset: body.offset ?? filter.offset,
    },
  };
}
