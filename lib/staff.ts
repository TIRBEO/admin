import { apiFailure, apiGet, apiSend, errorMessage } from "@/lib/api";
import type { Load } from "@/lib/load-state";

/* The staff roster and the roles it is drawn from.

   Two doors, because the two questions are different. `/admin/staff` is about
   *people*: who is staff, what kind, who decided, when. `/admin/staff/roles` is
   about *kinds*: what each role means, and what this installation added to or
   took away from it. A screen that read only one could not show the thing that
   matters most — that a role whose base says "cannot change limits" currently
   can, because somebody ticked a box.

   Nothing here computes a permission. The API returns the base list, this
   installation's delta and the resolved answer side by side, and the console
   draws the columns it was given. */

export type StaffRow = {
  userId: string;
  email: string | null;
  username: string | null;
  name: string | null;
  /** The role key, or null for an account that is staff with no role row. */
  role: string | null;
  /** False when the role came from `is_admin` rather than from a decision
      somebody recorded — shown, not hidden. */
  assigned: boolean;
  grantedAt: string | null;
  grantedBy: { userId: string; email: string; name: string | null } | null;
  note: string | null;
};

export type RoleSummary = {
  key: string;
  label: string;
  purpose: string;
  rank: number;
  permissions: string[];
};

export type Roster = {
  staff: StaffRow[];
  roles: RoleSummary[];
  /** Only an owner may change the roster at all, and the API says so rather
      than the console inferring it from a role name. */
  canManage: boolean;
};

type ApiRoster = {
  staff?: Array<Record<string, unknown>>;
  roles?: RoleSummary[];
  canManage?: boolean;
};

/** The API sends `grantedAt` as a Date, which arrives as an ISO string;
    anything else in that slot is not a timestamp and is drawn as none. */
function toStaffRow(raw: Record<string, unknown>): StaffRow {
  const by = raw.grantedBy as { userId?: string; email?: string; name?: string | null } | null;
  return {
    userId: String(raw.userId ?? ""),
    email: typeof raw.email === "string" ? raw.email : null,
    username: typeof raw.username === "string" ? raw.username : null,
    name: typeof raw.name === "string" ? raw.name : null,
    role: typeof raw.role === "string" ? raw.role : null,
    assigned: raw.assigned === true,
    grantedAt: typeof raw.grantedAt === "string" ? raw.grantedAt : null,
    grantedBy:
      by && by.userId
        ? { userId: by.userId, email: by.email ?? "", name: by.name ?? null }
        : null,
    note: typeof raw.note === "string" ? raw.note : null,
  };
}

export async function readRoster(): Promise<Load<Roster>> {
  const result = await apiGet<ApiRoster>("/admin/staff");
  if (!result.ok) return apiFailure(result);
  if (!Array.isArray(result.data?.staff)) {
    return { status: "error", message: "The API answered with no roster in it." };
  }
  return {
    status: "ready",
    data: {
      staff: result.data!.staff!.map(toStaffRow),
      roles: result.data!.roles ?? [],
      canManage: result.data!.canManage === true,
    },
  };
}

// ── role powers ──────────────────────────────────────────────────────────

export type PermissionEntry = { key: string; label: string; screen: string };

export type RolePower = {
  key: string;
  label: string;
  purpose: string;
  rank: number;
  /** What the role means in code. */
  base: string[];
  /** What this installation added. */
  grant: string[];
  /** What this installation took away. */
  revoke: string[];
  /** The resolved answer the guards actually enforce. */
  effective: string[];
  changedBy: string | null;
  changedAt: string | null;
};

export type Powers = {
  roles: RolePower[];
  permissions: PermissionEntry[];
  canEdit: boolean;
};

type ApiRolePower = {
  key: string;
  label: string;
  purpose: string;
  rank: number;
  base: string[];
  delta?: { grant?: string[]; revoke?: string[]; updatedBy?: string; updatedAt?: string };
  effective: string[];
};

type ApiPowers = {
  roles?: ApiRolePower[];
  permissions?: PermissionEntry[];
  canEdit?: boolean;
};

function toPower(row: ApiRolePower): RolePower {
  const known = (list?: string[]) => (Array.isArray(list) ? list : []);
  return {
    key: row.key,
    label: row.label,
    purpose: row.purpose,
    rank: row.rank,
    base: known(row.base),
    grant: known(row.delta?.grant),
    revoke: known(row.delta?.revoke),
    effective: known(row.effective),
    changedBy: row.delta?.updatedBy ?? null,
    changedAt: row.delta?.updatedAt ?? null,
  };
}

export async function readPowers(): Promise<Load<Powers>> {
  const result = await apiGet<ApiPowers>("/admin/staff/roles");
  if (!result.ok) return apiFailure(result);
  if (!Array.isArray(result.data?.roles)) {
    return { status: "error", message: "The API answered with no roles in it." };
  }
  return {
    status: "ready",
    data: {
      roles: result.data!.roles!.map(toPower),
      permissions: result.data!.permissions ?? [],
      canEdit: result.data!.canEdit === true,
    },
  };
}

// ── writes ───────────────────────────────────────────────────────────────

export type WriteResult = { ok: true } | { ok: false; message: string };

/** Make an account staff of a given kind, or change which kind it is. The API
    refuses a non-owner, an unknown role, and any write that would leave the
    platform without an owner; the refusal is the message this returns. */
export async function grantRole(input: {
  userId: string;
  role: string;
  note?: string | null;
}): Promise<WriteResult> {
  const result = await apiSend<{ error?: string }>("/admin/staff", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return result.ok ? { ok: true } : { ok: false, message: errorMessage(result) };
}

export async function revokeRole(userId: string): Promise<WriteResult> {
  const result = await apiSend<{ error?: string }>("/admin/staff", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  return result.ok ? { ok: true } : { ok: false, message: errorMessage(result) };
}

/** Replace one role's delta. The whole list goes each time, so a permission
    unticked here is genuinely revoked rather than left behind in a merge. */
export async function saveDelta(input: {
  role: string;
  grant: string[];
  revoke: string[];
}): Promise<WriteResult> {
  const result = await apiSend<{ error?: string }>("/admin/staff/roles", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return result.ok ? { ok: true } : { ok: false, message: errorMessage(result) };
}
