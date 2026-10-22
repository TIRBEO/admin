import { apiFailure, apiGet, apiSend } from "@/lib/api";
import type { Load } from "@/lib/load-state";

/** The helpdesk queue, read from the account ledger.
 *
 *  There is no ticket table, so there is no ticket to fetch: a request is an
 *  `activity_events` row and its answer is another row that quotes the same
 *  reference code. The API does that threading (`GET /api/admin/support`), and
 *  this module is the only place the panel learns its shape — so a second
 *  screen cannot invent a different one.
 *
 *  What is deliberately NOT here: priority, category, owner, SLA, attachments.
 *  None of those exist behind the ledger, and a column that draws a invented
 *  value is worse than no column: an operator acts on it. */

export type ThreadStatus = "open" | "answered";

export type ThreadAccount = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  /** The account's own status — an answer to a closed account is still an
      answer, but the operator should know before writing a long one. */
  status?: string;
  /** Where a reply actually lands. Not the login address on the row: the
      address the account marks primary, which for most people is another one. */
  replyTo?: string;
};

export type ThreadSummary = {
  ref: string;
  subject: string;
  message: string;
  status: ThreadStatus;
  askedAt: string;
  answeredAt: string | null;
  lastAt: string;
  replies: number;
  account: ThreadAccount | null;
  device: string | null;
  location: string | null;
  ip: string | null;
  channel: string | null;
};

export type ThreadMessage = {
  id: string;
  ref: string;
  from: "account" | "staff";
  at: string;
  subject: string;
  text: string;
};

export type ThreadMail = {
  to: string;
  event: string;
  subject: string;
  status: string;
  at: string;
  openedAt: string | null;
};

export type Thread = ThreadSummary & {
  messages: ThreadMessage[];
  emails: ThreadMail[];
};

export type Queue = {
  threads: ThreadSummary[];
  total: number;
  open: number;
  answered: number;
  /** How many ledger rows the read looked at. The queue is honest about its
      own reach rather than implying it counted everything. */
  window: number;
};

export type QueueFilter = {
  status: "" | ThreadStatus;
  q: string;
};

type ApiQueue = {
  threads?: ThreadSummary[];
  total?: number;
  open?: number;
  answered?: number;
  window?: number;
};

export async function readQueue(filter: QueueFilter): Promise<Load<Queue>> {
  const params = new URLSearchParams({ limit: "50" });
  if (filter.status) params.set("status", filter.status);
  if (filter.q) params.set("q", filter.q);

  const result = await apiGet<ApiQueue>(`/admin/support?${params.toString()}`);
  if (!result.ok) return apiFailure(result);
  if (!Array.isArray(result.data?.threads)) {
    return { status: "error", message: "The API answered with no queue in it." };
  }

  const queue: Queue = {
    threads: result.data.threads,
    total: result.data.total ?? result.data.threads.length,
    open: result.data.open ?? 0,
    answered: result.data.answered ?? 0,
    window: result.data.window ?? result.data.threads.length,
  };
  if (queue.threads.length === 0) return { status: "empty" };
  return { status: "ready", data: queue };
}

type ApiThread = { thread?: Thread };

/** One thread by the code the account was quoted. The code IS the handle, so
 *  this reads the same whether it was pasted from a mail or copied off the
 *  account's own screen. */
export async function readThread(ref: string): Promise<Load<Thread>> {
  const result = await apiGet<ApiThread>(`/admin/support/${encodeURIComponent(ref)}`);
  /* A code that matches nothing is an empty result, not a failure: the ledger
     is fine, this particular thread is not in it. The screen draws that as a
     404 rather than an error plate. */
  if (result.status === 404) return { status: "empty" };
  if (!result.ok) return apiFailure(result);
  if (!result.data?.thread) {
    return { status: "error", message: "The API answered with no thread in it." };
  }
  return { status: "ready", data: result.data.thread };
}

export type ReplyResult = { ok: true } | { ok: false; message: string };

/** Answer a request. Goes through the same endpoint every admin reply uses, so
 *  the mail, the ledger row beside the question, and the notification on the
 *  account all happen in one place — which is the entire reason this is a form
 *  in the panel and not a mailto in an inbox. */
export async function sendReply(input: {
  ref: string;
  to: string;
  subject: string;
  body: string;
  receivedAt?: string;
}): Promise<ReplyResult> {
  const result = await apiSend<{ error?: string }>("/admin/emails/reply", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      to: input.to,
      // The thread's own subject, prefixed — the reply has to read as a
      // continuation of the message the person wrote, not a new one.
      subject: `Re: ${input.subject}`,
      html: paragraphs(input.body),
      refCode: input.ref,
      threadId: input.ref,
      receivedAt: input.receivedAt,
    }),
  });

  if (!result.ok) {
    return { ok: false, message: apiFailure(result).message };
  }
  return { ok: true };
}

/** Plain text from a textarea into mail-safe HTML. Escaped first, so a reply
 *  that quotes someone's angle brackets cannot become markup in the mail. */
export function paragraphs(text: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return text
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 12px;font-size:15px;line-height:25px;color:#344054">${escape(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}
