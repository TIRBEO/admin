"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Save } from "lucide-react";

import { slotsIn } from "@/lib/email-templates";

/* ═══════════════════════════════════════════════════════════════════
   The template editor

   An operator came to read two things about a mail: which `{{slot}}` names it
   fills, and what it actually says once those slots are filled. This panel
   gives both live — the slot list is recomputed from the body as it is typed,
   and the preview renders that body through the mail's own skin, so what you
   edit is unambiguously what a person receives.

   Saving goes through the panel's door (PUT /api/email-template), which only
   forwards the subject and body; the slug and the registry's declared variable
   list stay the door's to hold. After a save the server facts above are pulled
   back, so the "updated" line and the stored body agree with what is on screen.
   ═══════════════════════════════════════════════════════════════════ */

type Status = "idle" | "saving" | "saved" | "failed";

export function EmailTemplateEditor({
  id,
  slug,
  subject,
  html,
}: {
  id: string;
  slug: string;
  subject: string;
  html: string;
}) {
  const router = useRouter();
  const [draftSubject, setDraftSubject] = useState(subject);
  const [draftHtml, setDraftHtml] = useState(html);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  // Re-key to a newly opened template so the draft never follows an operator
  // from one mail to the next.
  const [trackedId, setTrackedId] = useState(id);
  if (trackedId !== id) {
    setTrackedId(id);
    setDraftSubject(subject);
    setDraftHtml(html);
    setStatus("idle");
    setMessage(null);
  }

  const slots = useMemo(() => slotsIn(draftSubject, draftHtml), [draftSubject, draftHtml]);
  const dirty = draftSubject !== subject || draftHtml !== html;
  const canSave = dirty && draftSubject.trim().length > 0 && draftHtml.trim().length > 0;

  async function save() {
    setStatus("saving");
    setMessage(null);
    try {
      const res = await fetch("/api/email-template", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, subject: draftSubject, htmlBody: draftHtml }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setStatus("failed");
        setMessage(json?.error || `The panel answered ${res.status}.`);
        return;
      }
      setStatus("saved");
      router.refresh();
    } catch {
      setStatus("failed");
      setMessage("The panel never answered. Nothing was saved — try again.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="tpl-subject"
          className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]"
        >
          Subject
        </label>
        <input
          id="tpl-subject"
          value={draftSubject}
          onChange={(e) => {
            setDraftSubject(e.target.value);
            setStatus("idle");
          }}
          className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="tpl-html"
          className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]"
        >
          Body (HTML)
        </label>
        <textarea
          id="tpl-html"
          value={draftHtml}
          onChange={(e) => {
            setDraftHtml(e.target.value);
            setStatus("idle");
          }}
          rows={12}
          spellCheck={false}
          className="w-full resize-y rounded-[14px] border border-[var(--border)] bg-[var(--field)] px-3 py-2.5 font-mono text-[12px] leading-relaxed text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={save} disabled={!canSave || status === "saving"}>
          {status === "saving" ? (
            <Loader2 size={14} aria-hidden className="animate-spin" />
          ) : status === "saved" ? (
            <Check size={14} aria-hidden />
          ) : (
            <Save size={14} aria-hidden />
          )}
          {status === "saving" ? "Saving…" : "Save template"}
        </button>
        <span className="text-[12px] text-[var(--muted)]">
          {dirty ? "Unsaved changes" : "Matches the saved copy"} · edits {slug}
        </span>
      </div>

      {status === "saved" ? (
        <p className="rounded-[10px] bg-[var(--success-soft)] px-3 py-2 text-[12.5px] text-[var(--success-text)]">
          Saved. The next mail built from {slug} uses this body.
        </p>
      ) : null}
      {status === "failed" && message ? (
        <p className="rounded-[10px] bg-[var(--danger-soft)] px-3 py-2 text-[12.5px] text-[var(--danger-text)]">
          {message}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-[var(--divider)] pt-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]">
          Slots this mail fills ({slots.length})
        </p>
        {slots.length === 0 ? (
          <p className="text-[12px] text-[var(--muted)]">
            No <code>{"{{slot}}"}</code> in the current text — this is a fixed body.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {slots.map((s) => (
              <span
                key={s}
                className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 font-mono text-[12px] text-[var(--accent-text)]"
              >
                {`{{${s}}}`}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]">
          Preview
        </p>
        <iframe
          title={`Preview of ${slug}`}
          sandbox=""
          srcDoc={renderDoc(draftSubject, draftHtml)}
          className="h-72 w-full rounded-[10px] border border-[var(--border)] bg-[var(--card)]"
        />
      </div>
    </div>
  );
}

/** The body as a person would receive it: the mail's own ground (white sheet,
    ink text, one column). Slots left unreplaced show as their tokens, which is
    exactly what an unfilled variable looks like in a real send. */
function renderDoc(subject: string, html: string): string {
  const safe = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html><meta charset="utf-8">
<body style="margin:0;font:15px/1.55 -apple-system,system-ui,sans-serif;color:#172033;background:#ffffff">
<div style="max-width:34rem;margin:0 auto;padding:24px">
<p style="margin:0 0 16px;font-weight:700;font-size:17px;line-height:1.3;color:#172033">${safe(subject) || "—"}</p>
<div style="border-top:1px solid #E5E7EB;padding-top:16px">${html}</div>
</div></body>`;
}
