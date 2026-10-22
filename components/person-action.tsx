"use client";

import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { PersonAction } from "@/lib/person";

/* Acting on one account.

   Ban and suspend are the two writes in this console that reach a person: both
   mint a reference code the account is mailed, and both sign the account out of
   every device it holds. So neither fires on a single click — the reason is
   typed first, because it is what lands on the restriction row and in the mail,
   and "No reason provided" is what an appeal has to work from later.

   An account with console access cannot be banned or suspended at all: the door
   refuses it outright, which is why the control is off rather than waiting to
   fail. Lifting an enforcement has no such rule, so unban and unsuspend stay
   available. */

const LABEL: Record<PersonAction, string> = {
  ban: "Ban account",
  unban: "Lift the ban",
  suspend: "Suspend account",
  unsuspend: "Lift the suspension",
};

export function PersonActionControls({
  id,
  identity,
  isBanned,
  isSuspended,
  hasConsoleAccess,
}: {
  id: string;
  /** What to name the account in the confirmation, chosen by the page: a handle
      or an address, never a bare id. */
  identity: string;
  isBanned: boolean;
  isSuspended: boolean;
  hasConsoleAccess: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<PersonAction | null>(null);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState(7);
  const [state, setState] = useState<"idle" | "sending">("idle");
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  /* One enforcement at a time: a ban is lifted before a suspension is applied.
     The door would take either, but a screen that offers both at once is
     offering a state nobody can read back. */
  const actions: PersonAction[] = isBanned
    ? ["unban"]
    : isSuspended
      ? ["unsuspend"]
      : ["ban", "suspend"];

  async function run(action: PersonAction) {
    setState("sending");
    setNotice(null);
    try {
      const res = await fetch("/api/people/action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action, reason: reason.trim() || undefined, days }),
      });
      const json = (await res.json().catch(() => null)) as
        | { error?: string; until?: string | null; message?: string }
        | null;

      if (!res.ok) {
        setNotice({ tone: "bad", text: json?.error ?? `The console answered ${res.status}.` });
        return;
      }

      const done =
        action === "suspend" && json?.until
          ? `Suspended until ${new Date(json.until).toUTCString()}.`
          : json?.message ?? `The API applied “${action}”.`;
      setNotice({ tone: "ok", text: done });
      setOpen(null);
      setReason("");
      // Pull the account back: its status, its reference code and its sessions
      // are rows again, and the page should read the rows rather than remember
      // that a button was pressed.
      router.refresh();
    } catch {
      setNotice({ tone: "bad", text: "The console never answered. Nothing was changed — try again." });
    } finally {
      setState("idle");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const blocked =
            (action === "ban" || action === "suspend") && hasConsoleAccess;
          const destructive = action === "ban" || action === "suspend";
          return (
            <button
              key={action}
              type="button"
              disabled={blocked || state === "sending"}
              title={
                blocked
                  ? "The door refuses to ban or suspend an account with console access."
                  : undefined
              }
              onClick={() => {
                if (destructive) {
                  setOpen(open === action ? null : action);
                  return;
                }
                void run(action);
              }}
              className={`btn btn-sm ${destructive ? "btn-secondary" : "btn-primary"}`}
            >
              {destructive ? (
                <ShieldAlert size={13} aria-hidden />
              ) : (
                <ShieldCheck size={13} aria-hidden />
              )}
              {LABEL[action]}
            </button>
          );
        })}
      </div>

      {open ? (
        <div className="flex flex-col gap-2.5 rounded-[14px] bg-[var(--surface-2)] px-3.5 py-3">
          <p className="text-[12.5px] leading-relaxed text-[var(--text-2)]">
            {LABEL[open]} <span className="font-medium text-[var(--fg)]">{identity}</span>. The
            person is mailed a reference code, this reason goes into the restriction and the notice,
            and every session the account holds is signed out.
          </p>

          <label className="flex flex-col gap-1.5" htmlFor="person-reason">
            <span className="text-[12px] font-medium tracking-[-0.01em] text-[var(--muted)]">
              Reason — sent to the account
            </span>
            <textarea
              id="person-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What was done, in the words the appeal will quote."
              className="w-full resize-y rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-[13px] leading-relaxed text-[var(--fg)] placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:outline-none"
            />
          </label>

          {open === "suspend" ? (
            <label className="flex flex-wrap items-center gap-2 text-[12.5px] text-[var(--muted)]">
              For
              <input
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(Math.floor(Number(e.target.value)) || 1)}
                className="h-8 w-16 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2 text-[13px] tabular-nums text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
              />
              days — the door clamps this to 1–365 and ends the suspension itself.
            </label>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={state === "sending"}
              onClick={() => void run(open)}
            >
              {state === "sending" ? (
                <Loader2 size={13} aria-hidden className="animate-spin" />
              ) : null}
              {state === "sending" ? "Sending…" : `Confirm ${LABEL[open].toLowerCase()}`}
            </button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setOpen(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {notice ? (
        <p
          className={`rounded-[10px] px-3 py-2 text-[12.5px] leading-relaxed ${
            notice.tone === "ok"
              ? "bg-[var(--success-soft)] text-[var(--success-text)]"
              : "bg-[var(--danger-soft)] text-[var(--danger-text)]"
          }`}
        >
          {notice.text}
        </p>
      ) : null}
    </div>
  );
}
