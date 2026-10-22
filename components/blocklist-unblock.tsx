"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

/* Lift a block. The account API removes it by (targetType, targetId) — there is
   no row id to point at — so the button carries both. After it succeeds the
   list refreshes and the row is gone; the reason reads as the operator's own,
   because the session forwarded is theirs. */

export function BlocklistUnblock({
  targetType,
  targetId,
}: {
  targetType: string;
  targetId: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "removing" | "done" | "failed">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function unblock() {
    setState("removing");
    setMessage(null);
    try {
      const res = await fetch("/api/blocklist/unblock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setState("failed");
        setMessage(json?.error || `The panel answered ${res.status}.`);
        return;
      }
      setState("done");
      router.refresh();
    } catch {
      setState("failed");
      setMessage("The panel never answered. Nothing was removed — try again.");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        className="btn btn-quiet btn-sm"
        onClick={unblock}
        disabled={state === "removing" || state === "done"}
      >
        {state === "removing" ? <Loader2 size={12} aria-hidden className="animate-spin" /> : null}
        {state === "done" ? "Lifted" : "Lift block"}
      </button>
      {message ? (
        <p className="max-w-[16ch] text-right text-[11px] leading-snug text-[var(--danger-text)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
