import { apiFailure, apiGet, apiSend, errorMessage } from "@/lib/api";
import type { Load } from "@/lib/load-state";

import type { Notification } from "@/lib/types";

/** The Notifications screen: the operator's own inbox, plus the broadcast door.
 *
 *  `GET /api/admin/notifications` is the signed-in admin&rsquo;s inbox — the notices the
 *  platform wrote to *them* — so this screen is an inbox, not a directory of
 *  everyone&rsquo;s mail. It answers `{items, total}`; with `?count=true` it answers
 *  `{count}`, which is how the unread figure is read without paging the whole
 *  inbox to count it client-side.
 *
 *  The "notification rules" the old screen drew have no endpoint behind them
 *  and are gone. What is genuinely here is the broadcast: `GET /broadcast`
 *  previews how many people a product update would reach (those who opted in
 *  and have a verified address), and `POST /broadcast` sends it. */

type ApiRow = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  icon: string | null;
  link: string | null;
  isRead: boolean | null;
  createdAt: string;
};

type ApiList = { items?: ApiRow[]; total?: number };

export type NotificationInbox = {
  items: Notification[];
  total: number;
  unread: number;
  page: number;
  perPage: number;
};

export async function readNotifications(
  page: number,
  limit: number,
): Promise<Load<NotificationInbox>> {
  const offset = (Math.max(1, page) - 1) * limit;
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });

  const [list, count] = await Promise.all([
    apiGet<ApiList>(`/admin/notifications?${params.toString()}`),
    apiGet<{ count?: number }>(`/admin/notifications?count=true`),
  ]);

  if (!list.ok) return apiFailure(list);
  if (!Array.isArray(list.data?.items)) {
    return { status: "error", message: "The API answered with no notifications in it." };
  }

  const items = list.data.items.map(toNotification);
  const data: NotificationInbox = {
    items,
    total: list.data.total ?? items.length,
    unread: typeof count.data?.count === "number" ? count.data.count : 0,
    page: Math.floor(offset / limit) + 1,
    perPage: limit,
  };

  return data.items.length === 0 ? { status: "empty" } : { status: "ready", data };
}

function toNotification(row: ApiRow): Notification {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    title: row.title,
    body: row.body ?? null,
    icon: row.icon ?? null,
    link: row.link ?? null,
    isRead: row.isRead === true,
    createdAt: row.createdAt,
  };
}

export const PAGE_SIZES = [25, 50, 100];

export function readLimit(raw: string | undefined): number {
  const n = Number(raw);
  return PAGE_SIZES.includes(n) ? n : 50;
}

/** How many people the broadcast would reach. */
export async function readBroadcastRecipients(): Promise<Load<number>> {
  const result = await apiGet<{ recipients?: number }>("/admin/notifications/broadcast");
  if (!result.ok) return apiFailure(result);
  if (typeof result.data?.recipients !== "number") {
    return { status: "error", message: "The API answered with no recipient count." };
  }
  return { status: "ready", data: result.data.recipients };
}

/* ── write doors ───────────────────────────────────────────────────────── */

export type BroadcastResult =
  | { ok: true; sent: number; failed: number; notSent: number; total: number }
  | { ok: false; message: string };

/** Send a product-update broadcast.
 *
 *  The door bounds itself: an audience too large for one request is refused
 *  with 409 and nothing sent, and an opted-in audience of zero answers with a
 *  plain `{message}` rather than the `{sent,failed,notSent,total}` a real send
 *  returns. Both are read here and turned into a sentence the composer can
 *  show, so "0 sent because nobody opted in" never looks like a failure to
 *  reach people who did. */
export async function sendBroadcast(input: {
  title: string;
  message: string;
  ctaUrl: string;
  ctaLabel: string;
}): Promise<BroadcastResult> {
  const result = await apiSend<{
    sent?: number;
    failed?: number;
    notSent?: number;
    total?: number;
    message?: string;
    error?: string;
  }>("/admin/notifications/broadcast", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: input.title,
      message: input.message,
      ctaUrl: input.ctaUrl || undefined,
      ctaLabel: input.ctaLabel || undefined,
    }),
  });

  if (!result.ok) return { ok: false, message: errorMessage(result) };

  const sent = result.data?.sent ?? 0;
  const failed = result.data?.failed ?? 0;
  return {
    ok: true,
    sent,
    failed,
    notSent: result.data?.notSent ?? 0,
    total: result.data?.total ?? sent + failed,
  };
}

/** Mark one notice read, or the whole inbox read when no id is given. */
export async function markNotificationsRead(id?: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const path = id ? `/admin/notifications/${encodeURIComponent(id)}` : "/admin/notifications";
  const result = await apiSend<{ ok?: boolean }>(path, { method: "PUT" });
  return result.ok ? { ok: true } : { ok: false, message: errorMessage(result) };
}
