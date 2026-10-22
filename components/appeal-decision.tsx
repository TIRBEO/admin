"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

/* One verdict on one appeal. The account API takes only upheld or overturned —
   an unanswered appeal is "pending" until somebody chooses here — so the whole
   control is the two buttons that end the wait. On success the queue refreshes
   and the row flips out from under the operator's own click. */

type Verdict = "upheld" | "overturned";

export function AppealDecision({ appealId }: { appealId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Verdict | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function decide(verdict: Verdict) {
    setBusy(verdict);
    setMessage(null);
    try {
      const res = await fetch("/api/appeals/decide", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: appealId, decision: verdict }),
      });
      const json = (await res.json().catch(() => null)) as
        | { error?: string; restrictionLifted?: boolean }
        | null;
      if (!res.ok) {
        setMessage(json?.error || `The panel answered ${res.status}.`);
        setBusy(null);
        return;
      }
      setMessage(
        json?.restrictionLifted
          ? "Overturned — the restriction was lifted."
          : verdict === "upheld"
            ? "Upheld — the restriction stands."
            : "Overturned.",
      );
      router.refresh();
    } catch {
      setMessage("The panel never answered. Nothing was recorded — try again.");
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-1.5">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => decide("overturned")}
          disabled={busy !== null}
        >
          {busy === "overturned" ? <Loader2 size={12} aria-hidden className="animate-spin" /> : null}
          Overturn
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => decide("upheld")}
          disabled={busy !== null}
        >
          {busy === "upheld" ? <Loader2 size={12} aria-hidden className="animate-spin" /> : null}
          Uphold
        </button>
      </div>
      {message ? (
        <p className="text-right text-[11px] leading-snug text-[var(--muted)]">{message}</p>
      ) : null}
    </div>
  );
}
