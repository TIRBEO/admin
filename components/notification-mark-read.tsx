"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

/** A single write control: mark this notice read, or the whole inbox read when
 *  no id is given. It posts to the panel's door, which carries the operator's
 *  session; on success the inbox is pulled back so the unread pill and count
 *  agree with what was just clicked. */
export function NotificationMarkRead({
  id,
  label,
  size = "sm",
}: {
  id?: string;
  label: string;
  size?: "sm" | "base";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/notification-read", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(id ? { id } : {}),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error || `The panel answered ${res.status}.`);
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("The panel never answered.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={run}
        disabled={busy || done}
        className={`btn btn-quiet btn-danger-hover ${size === "sm" ? "btn-sm" : ""}`}
      >
        {busy ? (
          <Loader2 size={13} aria-hidden className="animate-spin" />
        ) : done ? (
          <Check size={13} aria-hidden />
        ) : null}
        {busy ? "Working…" : done ? "Read" : label}
      </button>
      {error ? <span className="text-[11px] text-[var(--danger-text)]">{error}</span> : null}
    </span>
  );
}
