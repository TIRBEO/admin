"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

/* Edit one stored verification cap. The door upserts on `method`, so the method
   itself is fixed here and only the two numbers that define the cap change: how
   many attempts and over what window. The window is entered in minutes because
   that is what an operator thinks in; it is stored as the windowMs the API
   takes. */

export function VerificationLimitForm({
  method,
  max,
  windowMs,
}: {
  method: string;
  max: number;
  windowMs: number;
}) {
  const router = useRouter();
  const [attempts, setAttempts] = useState(String(max));
  const [minutes, setMinutes] = useState(String(Math.round(windowMs / 60000) || 15));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const parsedAttempts = Number(attempts);
  const parsedMinutes = Number(minutes);
  const valid =
    Number.isInteger(parsedAttempts) && parsedAttempts >= 1 &&
    Number.isFinite(parsedMinutes) && parsedMinutes >= 1;

  async function save() {
    if (!valid) return;
    setState("saving");
    setMessage(null);
    try {
      const res = await fetch("/api/verification-limits", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          method,
          max: parsedAttempts,
          windowMs: Math.round(parsedMinutes * 60000),
        }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setState("failed");
        setMessage(json?.error || `The panel answered ${res.status}.`);
        return;
      }
      setState("saved");
      router.refresh();
    } catch {
      setState("failed");
      setMessage("The panel never answered. The cap was not changed.");
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <label className="sr-only" htmlFor={`${method}-max`}>
        Attempts for {method}
      </label>
      <input
        id={`${method}-max`}
        type="number"
        min={1}
        value={attempts}
        onChange={(e) => setAttempts(e.target.value)}
        className="h-8 w-16 rounded-[8px] border border-[var(--border)] bg-[var(--field)] px-2 text-right text-[12px] tabular-nums text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
      />
      <label className="sr-only" htmlFor={`${method}-window`}>
        Window in minutes for {method}
      </label>
      <input
        id={`${method}-window`}
        type="number"
        min={1}
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
        className="h-8 w-16 rounded-[8px] border border-[var(--border)] bg-[var(--field)] px-2 text-right text-[12px] tabular-nums text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
      />
      <span className="text-[11px] text-[var(--muted)]">min</span>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={save}
        disabled={!valid || state === "saving"}
      >
        {state === "saving" ? <Loader2 size={12} aria-hidden className="animate-spin" /> : null}
        {state === "saving" ? "Saving…" : "Save"}
      </button>
      {state === "saved" ? (
        <span className="text-[11px] text-[var(--success-text)]">Saved</span>
      ) : null}
      {state === "failed" && message ? (
        <span className="text-[11px] text-[var(--danger-text)]">{message}</span>
      ) : null}
    </div>
  );
}
