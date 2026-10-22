import { apiFailure, apiGet } from "@/lib/api";
import { readMe } from "@/lib/permissions";
import type { MeView } from "@/lib/permissions";
import type { Load } from "@/lib/load-state";
import type { Severity } from "@/lib/types";

/* The operator's own account, assembled from the reads that describe it.

   GET /admin/me is the identity and the authority — it names who is reading and
   what they may do. GET /admin/2fa is the two-factor truth the panel acts on.
   GET /admin/users/{own id} supplies the sessions, the email-verified flag and
   the row counts, and GET /admin/audit?actorId={own id} is the trail this
   operator wrote — but those two are the staff tables wearing the operator's
   own id, so each answers only to the permission its own screen needs:
   `people.read` and `activity.read`.

   A role without one of them is neither an error nor a zero. The account is
   still theirs to read, so the withheld half comes back as `null` and the screen
   says where the rest of the answer lives. Two-factor is never conditional —
   nobody should have to hold the people table in order to secure their own
   sign-in. */

type TwoFactorStatus = {
  enabled: boolean;
  remainingRecoveryCodes: number;
};

type ApiSession = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
};

type UserDetail = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  status: string;
  is2FAEnabled: boolean;
  emailVerified: boolean;
  createdAt: string;
  _count: { sessions: number; notifications: number };
  sessions: ApiSession[];
};

export type OperatorAction = {
  id: string;
  actorId: string;
  action: string;
  title: string;
  severity: Severity;
  createdAt: string;
};

export type OperatorView = {
  me: MeView;
  twoFactor: TwoFactorStatus;
  /** Null when this role does not hold `people.read`. */
  detail: UserDetail | null;
  /** Empty when this role does not hold `activity.read`. */
  actions: OperatorAction[];
  mayReadPeople: boolean;
  mayReadTrail: boolean;
};

const TRAIL_LIMIT = 12;

function toAction(row: OperatorAction): OperatorAction {
  return {
    id: row.id,
    actorId: row.actorId,
    action: row.action,
    title: row.title,
    severity: row.severity,
    createdAt: row.createdAt,
  };
}

export async function readOperator(): Promise<Load<OperatorView>> {
  const me = await readMe();
  if (!me.ok || !me.data) return apiFailure(me);

  const permissions = me.data.permissions ?? {};
  const mayReadPeople = permissions["people.read"] === true;
  const mayReadTrail = permissions["activity.read"] === true;
  const id = encodeURIComponent(me.data.id);

  const [twoFactor, people, trail] = await Promise.all([
    apiGet<TwoFactorStatus>("/admin/2fa"),
    mayReadPeople ? apiGet<UserDetail>(`/admin/users/${id}`) : Promise.resolve(null),
    mayReadTrail
      ? apiGet<{ events?: unknown[] }>(`/admin/audit?actorId=${id}&limit=${TRAIL_LIMIT}`)
      : Promise.resolve(null),
  ]);

  if (!twoFactor.ok || !twoFactor.data) return apiFailure(twoFactor);
  if (people !== null && (!people.ok || !people.data)) return apiFailure(people);
  if (trail !== null && (!trail.ok || !Array.isArray(trail.data?.events))) return apiFailure(trail);

  return {
    status: "ready",
    data: {
      me: me.data,
      twoFactor: twoFactor.data,
      detail: people?.data ?? null,
      actions: ((trail?.data?.events ?? []) as OperatorAction[]).map(toAction),
      mayReadPeople,
      mayReadTrail,
    },
  };
}
