import { apiFailure, apiGet } from "@/lib/api";
import type { Load } from "@/lib/load-state";

import type { EmailDelivery, Page } from "@/lib/types";

/** The Deliveries screen's one read: GET /api/emails.
 *
 *  This is `email_deliveries` — one row per mail the platform handed to the
 *  provider, and the only place that records what the provider said back. For
 *  an admin the door's filter is empty, so an operator sees every mail sent to
 *  every person; for everyone else the door hides all but their own.
 *
 *  The door takes `limit`/`offset` rather than a page number, so the page
 *  number a screen puts in its "next" link is computed here from the offset
 *  the door reports — not guessed, because guessing it would let a screen show
 *  the same rows twice under two different labels.
 *
 *  What is deliberately absent: a status or recipient filter. The door exposes
 *  none, so a filter here would only ever trim the page already loaded and
 *  tell an operator the whole ledger looks that way. */

const PER_PAGE = [25, 50, 100];

type ApiRow = {
  id: string;
  jobId: string | null;
  userId: string | null;
  toEmail: string;
  eventKey: string;
  event: string;
  category: string;
  subject: string;
  status: string;
  provider: string | null;
  providerId: string | null;
  messageId: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  createdAt: string;
};

type ApiList = { items?: ApiRow[]; total?: number; limit?: number; offset?: number };

/** The page size the URL asked for, or the default. Only the sizes the door
 *  is willing to serve are offered, so the select can never request a page
 *  that gets silently clamped to something else. */
export function readLimit(raw: string | undefined): number {
  const n = Number(raw);
  return PER_PAGE.includes(n) ? n : 50;
}

export const PAGE_SIZES = PER_PAGE;

export async function readDeliveries(
  page: number,
  limit: number,
): Promise<Load<Page<EmailDelivery>>> {
  const offset = (Math.max(1, page) - 1) * limit;
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const result = await apiGet<ApiList>(`/emails?${params.toString()}`);

  if (!result.ok) return apiFailure(result);
  if (!Array.isArray(result.data?.items)) {
    return { status: "error", message: "The API answered with no deliveries in it." };
  }

  const rows = result.data.items;
  const served = result.data.limit ?? limit;
  const data: Page<EmailDelivery> = {
    items: rows.map(toDelivery),
    total: result.data.total ?? rows.length,
    // The door reports an offset, the console thinks in pages. Derive the page
    // from the offset the door actually served so a "next" link can never
    // relabel the same rows as a different page.
    page: Math.floor((result.data.offset ?? offset) / served) + 1,
    perPage: served,
  };

  return data.items.length === 0 ? { status: "empty" } : { status: "ready", data };
}

function toDelivery(row: ApiRow): EmailDelivery {
  return {
    id: row.id,
    jobId: row.jobId ?? null,
    userId: row.userId ?? null,
    toEmail: row.toEmail,
    eventKey: row.eventKey ?? "",
    event: row.event ?? "",
    category: row.category ?? "other",
    subject: row.subject ?? "",
    status: row.status ?? "unknown",
    provider: row.provider ?? null,
    providerId: row.providerId ?? null,
    messageId: row.messageId ?? null,
    openedAt: row.openedAt ?? null,
    clickedAt: row.clickedAt ?? null,
    createdAt: row.createdAt,
  };
}
