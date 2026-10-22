"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   The reply box

   This is the whole reason the staff mail no longer offers a mailto. An
   answer typed into a mail client reaches the person and stops there: no row
   beside the request, nothing on the account's own record, no trace in this
   panel that anything was said at all. Sending from here does all three,
   because the API writes them as it sends.

   What the operator sees after pressing send is the fact that the ledger
   recorded an answer — the queue row flips to answered on its own, because
   "answered" is a question about the ledger rather than a flag to remember.
   ═══════════════════════════════════════════════════════════════════ */

export function ReplyForm({
  code,
  to,
  subject,
  receivedAt,
}: {
  /** The thread's reference code. Named `code`, not `ref`, because React owns
      that attribute name. */
  code: string;
  to: string;
  subject: string;
  receivedAt?: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const ready = body.trim().length >= 2;

  async function send() {
    setState("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/tickets/reply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ref: code, to, subject, body, receivedAt }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setState("failed");
        setMessage(json?.error || `The panel answered ${res.status}.`);
        return;
      }
      setState("sent");
      setBody("");
      // Pull the thread back: the answer is a row now, and the page should
      // show the row rather than the operator's memory of pressing a button.
      router.refresh();
    } catch {
      setState("failed");
      setMessage("The panel never answered. Nothing was sent — try again.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="sr-only" htmlFor="reply">
        Reply to {to}
      </label>
      <textarea
        id="reply"
        rows={5}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write what happens next…"
        className="w-full resize-y rounded-[12px] border border-[var(--border)] bg-[var(--field)] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--fg)] placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-primary"
          onClick={send}
          disabled={!ready || state === "sending"}
        >
          {state === "sending" ? (
            <Loader2 size={14} aria-hidden className="animate-spin" />
          ) : (
            <Send size={14} aria-hidden />
          )}
          {state === "sending" ? "Sending…" : "Send reply"}
        </button>
        <span className="text-[12px] text-[var(--muted)]">
          Goes to {to} · quotes {code}
        </span>
      </div>
      {state === "sent" ? (
        <p className="rounded-[10px] bg-[var(--success-soft)] px-3 py-2 text-[12.5px] text-[var(--success-text)]">
          Sent, and written down: the account is told, and this row reads
          answered wherever either of you looks next.
        </p>
      ) : null}
      {state === "failed" && message ? (
        <p className="rounded-[10px] bg-[var(--danger-soft)] px-3 py-2 text-[12.5px] text-[var(--danger-text)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
