import { apiFailure, apiGet, apiSend } from "@/lib/api";
import type { Load } from "@/lib/load-state";

import type { AppealDecision } from "@/lib/types";

/* The Appeals screen's one read: GET /api/admin/appeals.

   An appeal is the other side of a restriction — a person asking for it to be
   lifted. The door nests the account and the restriction it argues with inside
   each row, so a single read carries everything the queue draws: who filed it,
   what they said, and the strike they are contesting.

   Two quirks of this endpoint are worth writing down:
   - `decision` never comes back null. The handler coerces an undecided appeal
     to the literal string "pending", so an open appeal and a pending one are
     the same row here, not two states.
   - Only `total` (matching the filter) and `pending` (platform-wide) are
     counted server-side. The reply gives no upheld/overturned tally, so the
     screen must not imply one — see the page. */

type ApiUser = { id: string; email: string; name: string | null } | null;

type ApiRestriction = {
  id: string;
  title: string;
  guideline: string;
  severity: string;
  startedAt: string;
  endsAt: string | null;
} | null;

type ApiAppeal = {
  id: string;
  decision: string;
  note: string;
  createdAt: string;
  decidedAt: string | null;
  user: ApiUser;
  restriction: ApiRestriction;
};

type ApiAppeals = {
  appeals?: ApiAppeal[];
  total?: number;
  pending?: number;
  page?: number;
  limit?: number;
};

export type Appeal = {
  id: string;
  decision: AppealDecision;
  note: string;
  createdAt: string;
  decidedAt: string | null;
  user: NonNullable<ApiUser>;
  restriction: NonNullable<ApiRestriction>;
};

export type AppealsResult = {
  rows: Appeal[];
  total: number;
  pending: number;
  page: number;
  limit: number;
};

export type AppealFilter = {
  decision: AppealDecision | "";
  q: string;
  limit: number;
  page: number;
};

const DECISIONS = new Set<string>(["pending", "upheld", "overturned"]);

function toAppeal(row: ApiAppeal): Appeal {
  return {
    id: row.id,
    // The handler already folds a null verdict into "pending"; a stray value
    // still has to land in the union, so it is pinned rather than trusted.
    decision: DECISIONS.has(row.decision) ? (row.decision as AppealDecision) : "pending",
    note: row.note ?? "",
    createdAt: row.createdAt,
    decidedAt: row.decidedAt ?? null,
    user: row.user ?? { id: "", email: "", name: null },
    restriction: row.restriction ?? {
      id: "",
      title: "",
      guideline: "",
      severity: "",
      startedAt: "",
      endsAt: null,
    },
  };
}

export async function readAppeals(filter: AppealFilter): Promise<Load<AppealsResult>> {
  const params = new URLSearchParams({ limit: String(filter.limit), page: String(filter.page) });
  if (filter.decision) params.set("decision", filter.decision);
  if (filter.q) params.set("q", filter.q);

  const result = await apiGet<ApiAppeals>(`/admin/appeals?${params.toString()}`);
  if (!result.ok) return apiFailure(result);
  if (!Array.isArray(result.data?.appeals)) {
    return { status: "error", message: "The API answered with no appeals in it." };
  }

  const data = result.data;
  const rows = (data.appeals ?? []).map(toAppeal);
  return {
    status: "ready",
    data: {
      rows,
      total: data.total ?? rows.length,
      pending: data.pending ?? 0,
      page: data.page ?? filter.page,
      limit: data.limit ?? filter.limit,
    },
  };
}

export type WriteResult = { ok: true } | { ok: false; message: string };

/** Record a verdict on one appeal.
 *
 *  The API's PUT takes only `upheld` or `overturned` — "pending" is the state
 *  of an appeal nobody has answered yet, not a decision you can file. An
 *  overturn also lifts the restriction it argues with; whether that lift
 *  happened comes back in `restrictionLifted`, which the door hands on so the
 *  screen can tell the two outcomes apart instead of guessing from the verdict. */
export async function decideAppeal(input: {
  id: string;
  decision: "upheld" | "overturned";
}): Promise<WriteResult & { restrictionLifted?: boolean }> {
  const result = await apiSend<{ error?: string; restrictionLifted?: boolean }>("/admin/appeals", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: input.id, decision: input.decision }),
  });

  if (!result.ok) return { ok: false, message: apiFailure(result).message };
  return { ok: true, restrictionLifted: result.data?.restrictionLifted };
}
