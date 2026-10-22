"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   The broadcast door

   This is the one write on the screen that reaches other people. The recipient
   count beside the send button is the account API's own answer — who has both
   a verified address and the product-email switch open — so an operator sees
   the real audience before committing, not a guess.

   A send is bounded on purpose: an audience too big for one request is refused
   by the API with nothing sent, and the number that came back (or the refusal)
   is what this panel reports. It never claims a partial send succeeded.
   ═══════════════════════════════════════════════════════════════════ */

type Status = "idle" | "sending" | "done" | "failed";

type Receipt = { sent: number; failed: number; notSent: number; total: number };

export function NotificationBroadcast({ recipients }: { recipients: number }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ready = title.trim().length > 0 && message.trim().length > 0 && recipients > 0;

  async function send() {
    setStatus("sending");
    setError(null);
    setReceipt(null);
    try {
      const res = await fetch("/api/notification-broadcast", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, message, ctaUrl, ctaLabel }),
      });
      const json = (await res.json().catch(() => null)) as
        | { error?: string; sent?: number; failed?: number; notSent?: number; total?: number }
        | null;
      if (!res.ok) {
        setStatus("failed");
        setError(json?.error || `The panel answered ${res.status}.`);
        return;
      }
      setReceipt({
        sent: json?.sent ?? 0,
        failed: json?.failed ?? 0,
        notSent: json?.notSent ?? 0,
        total: json?.total ?? 0,
      });
      setStatus("done");
      setTitle("");
      setMessage("");
      router.refresh();
    } catch {
      setStatus("failed");
      setError("The panel never answered. Nothing may have been sent — check before repeating.");
    }
  }

  const input =
    "h-9 min-w-0 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:outline-none";

  return (
    <div className="flex flex-col gap-3.5">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]">Title</span>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          maxLength={120}
          placeholder="What changed"
          className={input}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]">Message</span>
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          rows={4}
          maxLength={5000}
          placeholder="The update, in the person&rsquo;s own words."
          className="w-full resize-y rounded-[14px] border border-[var(--border)] bg-[var(--field)] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--fg)] placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:outline-none"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]">Button link (optional)</span>
          <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="/dashboard" className={input} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]">Button label (optional)</span>
          <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="See What&rsquo;s New" className={input} />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-primary" onClick={send} disabled={!ready || status === "sending"}>
          {status === "sending" ? (
            <Loader2 size={14} aria-hidden className="animate-spin" />
          ) : (
            <Megaphone size={14} aria-hidden />
          )}
          {status === "sending" ? "Sending…" : `Broadcast to ${recipients.toLocaleString()}`}
        </button>
        <span className="text-[12px] text-[var(--muted)]">
          {recipients === 0
            ? "Nobody is opted in — this would send nothing."
            : "Reaches opted-in accounts with a verified address."}
        </span>
      </div>

      {status === "done" && receipt ? (
        <p className="rounded-[10px] bg-[var(--success-soft)] px-3 py-2 text-[12.5px] text-[var(--success-text)]">
          {receipt.sent.toLocaleString()} sent
          {receipt.failed ? `, ${receipt.failed.toLocaleString()} failed` : ""}
          {receipt.notSent ? `, ${receipt.notSent.toLocaleString()} not reached in time` : ""}
          {receipt.total === 0 ? " — there were no opted-in recipients." : "."}
        </p>
      ) : null}
      {status === "failed" && error ? (
        <p className="rounded-[10px] bg-[var(--danger-soft)] px-3 py-2 text-[12.5px] text-[var(--danger-text)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
