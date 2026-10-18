"use client";

import { useState } from "react";

/* Click-to-copy event id. Renders the first 8 chars in monospace; clicking
   copies the full uuid via navigator.clipboard and swaps in a tiny "copied"
   state for a moment. Falls back to plain text when the id is missing or the
   clipboard API is unavailable (e.g. insecure origin). */

export function CopyId({ value }: { value?: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!value) return <span className="text-[var(--tb-text-muted)]">—</span>;

  // Short references (xxxx-xxxx-xxxx) show in full; raw uuids keep the
  // 8-char preview with the whole id one click away.
  const shown = value.length > 20 ? value.slice(0, 8) : value;

  return (
    <button
      type="button"
      title={`Copy full id: ${value}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard blocked — leave the id visible, nothing else to do */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded px-1 py-0.5 font-mono text-[11px] text-[var(--tb-text-secondary)] hover:bg-[var(--tb-surface-2)] hover:text-[var(--tb-accent)]"
    >
      {shown}
      {copied ? (
        <span className="text-[10px] font-medium text-[var(--tb-ok)]">
          copied
        </span>
      ) : null}
    </button>
  );
}
