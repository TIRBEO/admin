import { apiFailure, apiGet } from "@/lib/api";
import type { Load } from "@/lib/load-state";

/* The Dashboard's read of the helpdesk queue.
 *
 *   GET /api/admin/support is real — it threads `activity_events` by the
 *   reference code each filing carries, so "how many requests are waiting on us"
 *   is a fact about the ledger, not a column somebody has to remember to set.
 *   The queue itself lives on /admin/tickets (see lib/support.ts); this file
 *   only pulls the handful of open threads the Overview needs to say what is
 *   waiting right now, and nothing that endpoint does not actually answer. */

export type OpenThread = {
  ref: string;
  subject: string;
  status: "open" | "answered";
  askedAt: string;
  lastAt: string;
  account: { id: string; email: string; username: string | null; name: string | null } | null;
};

export type OpenRequests = {
  /** Threads with no `support.reply` yet — the number that means work. */
  open: number;
  /** How many ledger rows the queue scanned; it reads the newest window only,
   *  so this is the reach of `open`, not a claim about all time. */
  window: number;
  threads: OpenThread[];
};

type ApiThread = {
  ref?: string;
  subject?: string;
  status?: string;
  askedAt?: string;
  lastAt?: string;
  account?: OpenThread["account"];
};

type ApiQueue = {
  threads?: ApiThread[];
  open?: number;
  window?: number;
};

export async function readOpenRequests(limit = 6): Promise<Load<OpenRequests>> {
  const params = new URLSearchParams({ status: "open", limit: String(limit) });
  const result = await apiGet<ApiQueue>(`/admin/support?${params.toString()}`);

  if (!result.ok) return apiFailure(result);
  if (!Array.isArray(result.data?.threads)) {
    return { status: "error", message: "The API answered with no queue in it." };
  }

  const threads: OpenThread[] = result.data.threads
    .filter((t): t is ApiThread & { ref: string; askedAt: string } => Boolean(t.ref && t.askedAt))
    .map((t) => ({
      ref: t.ref,
      subject: t.subject ?? "(no subject)",
      status: "open",
      askedAt: t.askedAt,
      lastAt: t.lastAt ?? t.askedAt,
      account: t.account ?? null,
    }));

  return {
    status: "ready",
    data: {
      // `open` counts every thread in the window, so it can exceed the handful
      // of rows drawn here — the panel says so rather than implying it listed all.
      open: typeof result.data.open === "number" ? result.data.open : threads.length,
      window: typeof result.data.window === "number" ? result.data.window : 0,
      threads,
    },
  };
}
