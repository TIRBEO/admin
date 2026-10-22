import { apiFailure, apiGet, apiSend } from "@/lib/api";
import type { Load } from "@/lib/load-state";

import type { BlocklistTargetType } from "@/lib/types";

/* The Blocklist screen's one read: GET /api/admin/security/blocks.

   Each row is one refused address — an IP, an email, a user id — with the
   reason it was refused and when the refusal stops. Two things about this
   endpoint shape the screen:

   - There is no row id. A block is addressed by the pair (targetType,
     targetId); that pair is what the DELETE route takes, so it is the only
     key this screen has. `targetId` is frequently an id or an address with no
     resolvable name behind it (a banned user, a refused IP), and nothing here
     resolves it — so the page shows the raw value in a <code>, never an
     invented name. `blockedBy` is the same story: an operator id with no way
     to look up who it was.
   - `activeOnly` defaults to TRUE at the door (`!== "false"`). To see lifted
     blocks the request has to say `activeOnly=false` explicitly. */

type ApiBlock = {
  targetType: string;
  targetId: string;
  reason?: string | null;
  blockedBy?: string | null;
  isActive?: boolean;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ApiBlocks = {
  items?: ApiBlock[];
  total?: number;
  page?: number;
  limit?: number;
};

export type BlockRow = {
  /** Not a database id — the composite key the DELETE route addresses a block
      by. Carried as one string so a table row and the unblock control agree. */
  key: string;
  targetType: BlocklistTargetType;
  targetId: string;
  reason: string | null;
  blockedBy: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type BlocklistResult = {
  rows: BlockRow[];
  total: number;
  page: number;
  limit: number;
};

export type BlocklistFilter = {
  targetType: BlocklistTargetType | "";
  /** "" = the door's default (active only); "yes"/"no" make it explicit. */
  state: "" | "active" | "lifted" | "all";
  q: string;
  page: number;
  limit: number;
};

const TYPES = new Set<string>(["ip", "email", "domain", "user", "device"]);

function toRow(row: ApiBlock): BlockRow {
  return {
    key: `${row.targetType}:${row.targetId}`,
    targetType: (TYPES.has(row.targetType) ? row.targetType : "ip") as BlocklistTargetType,
    targetId: row.targetId,
    reason: row.reason ?? null,
    blockedBy: row.blockedBy ?? null,
    isActive: row.isActive !== false,
    expiresAt: row.expiresAt ?? null,
    createdAt: row.createdAt ?? null,
    updatedAt: row.updatedAt ?? null,
  };
}

export async function readBlocklist(filter: BlocklistFilter): Promise<Load<BlocklistResult>> {
  const params = new URLSearchParams({ page: String(filter.page), limit: String(filter.limit) });
  if (filter.targetType) params.set("targetType", filter.targetType);
  if (filter.q) params.set("q", filter.q);
  // The door reads an omitted activeOnly as "active only". "lifted"/"all" must
  // turn the filter off; "active" and "" leave it on.
  if (filter.state === "lifted" || filter.state === "all") params.set("activeOnly", "false");

  const result = await apiGet<ApiBlocks>(`/admin/security/blocks?${params.toString()}`);
  if (!result.ok) return apiFailure(result);
  if (!Array.isArray(result.data?.items)) {
    return { status: "error", message: "The API answered with no blocks in it." };
  }

  const data = result.data;
  const rows = (data.items ?? []).map(toRow);

  // "Lifted" is the one view the door cannot narrow to: it can turn the
  // active-only filter off, but not ask for inactive-only. Fold the mixed reply
  // down to the rows the operator actually asked for.
  const shown = filter.state === "lifted" ? rows.filter((r) => !r.isActive) : rows;

  return {
    status: "ready",
    data: {
      rows: shown,
      total: data.total ?? rows.length,
      page: data.page ?? filter.page,
      limit: data.limit ?? filter.limit,
    },
  };
}

export type WriteResult = { ok: true } | { ok: false; message: string };

/** Lift one block. DELETE /admin/security/blocks/[targetType]/[targetId].
 *  Each segment is encoded because a target id is often an email or an IP. */
export async function removeBlock(input: {
  targetType: string;
  targetId: string;
}): Promise<WriteResult> {
  const path = `/admin/security/blocks/${encodeURIComponent(input.targetType)}/${encodeURIComponent(input.targetId)}`;
  const result = await apiSend<{ error?: string }>(path, { method: "DELETE" });
  if (!result.ok) return { ok: false, message: apiFailure(result).message };
  return { ok: true };
}
