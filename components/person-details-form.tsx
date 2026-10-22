"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { RoleChoice } from "@/components/staff-role-picker";

/* The two fields this account door will change: what the person is called and,
   for an owner, what kind of staff they are. Nothing else on the account row is
   writable here — an email address is the identity and moves through its own
   verified-address flow, and a lifecycle change is a ban or a suspension, which
   carries a reference code and a mail and therefore lives in the action panel.

   `maySetRole` is the owner's half. A role write from this form goes through the
   same roster service the Staff screen does, so the console draws the field only
   for somebody the API would take an answer from; everybody else reads where it
   is decided instead of being offered a select that refuses them. */

export function PersonDetailsForm({
  id,
  identity,
  name,
  adminRole,
  maySetRole,
  roles,
}: {
  id: string;
  /** What to call the account back to the operator after a write: a handle or an
      address, chosen by the page. */
  identity: string;
  name: string | null;
  adminRole: string | null;
  /** Only an owner changes who is staff, and the API says so. */
  maySetRole: boolean;
  /** The role list the API published, so the picker cannot offer a name the
      roster would refuse. */
  roles: RoleChoice[];
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "sending" | "saved" | "failed">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [currentLevel, setCurrentLevel] = useState(adminRole ?? "");

  // The roster's own vocabulary, published by the API rather than copied here.
  const knownRole = roles.some((r) => r.key === adminRole);
  const canWriteRole = maySetRole && roles.length > 0;

  async function submit(form: HTMLFormElement) {
    const data = new FormData(form);
    const displayName = String(data.get("displayName") ?? "").trim();

    const body: { displayName?: string; adminRole?: string | null } = {};
    if (displayName && displayName !== (name ?? "")) body.displayName = displayName;
    /* Only ever sent when the select is on the screen. Reading a missing field as
       "revoke the role" would take a name edit and quietly demote the account,
       which is the one mistake this form cannot afford. */
    if (canWriteRole) {
      const picked = String(data.get("adminRole") ?? "");
      if (picked !== currentLevel) body.adminRole = picked || null;
    }

    if (Object.keys(body).length === 0) {
      setState("failed");
      setMessage("Nothing was changed, so nothing was sent.");
      return;
    }

    setState("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/people/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      const json = (await res.json().catch(() => null)) as
        | { error?: string; name?: string | null }
        | null;

      if (!res.ok) {
        setState("failed");
        setMessage(json?.error ?? `The console answered ${res.status}.`);
        return;
      }

      setCurrentLevel(body.adminRole ?? "");
      setState("saved");
      setMessage(`${identity} updated.`);
      router.refresh();
    } catch {
      setState("failed");
      setMessage("The console never answered. Nothing was changed — try again.");
    }
  }

  const input =
    "h-9 w-full min-w-0 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:outline-none";

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit(e.currentTarget);
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium tracking-[-0.01em] text-[var(--muted)]" htmlFor="displayName">
          Display name
        </label>
        <input id="displayName" name="displayName" type="text" defaultValue={name ?? ""} className={input} />
      </div>

      {canWriteRole ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium tracking-[-0.01em] text-[var(--muted)]" htmlFor="adminRole">
            Staff role
          </label>
          <select
            id="adminRole"
            name="adminRole"
            value={currentLevel}
            onChange={(e) => setCurrentLevel(e.target.value)}
            className={input}
          >
            <option value="">Not staff</option>
            {roles.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] leading-snug text-[var(--muted)]">
            What the account may do in the console is decided by the role and by the ticks on the Staff
            screen, not by this one field.
          </p>
        </div>
      ) : (
        <p className="rounded-[10px] bg-[var(--fill)] px-3 py-2 text-[12px] leading-relaxed text-[var(--text-2)]">
          {adminRole
            ? <>Staff role: <span className="font-semibold text-[var(--fg)]">{knownRole ? adminRole : `${adminRole} (a role no longer in code)`}</span>. Only an owner changes this, and it is decided on the{" "}<Link href="/admin/staff" className="text-[var(--accent-text)] hover:underline">Staff screen</Link>.</>
            : "This account is not staff. Only an owner can put it on the roster, on the Staff screen."}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={state === "sending"}>
          {state === "sending" ? <Loader2 size={13} aria-hidden className="animate-spin" /> : null}
          {state === "sending" ? "Saving…" : "Save changes"}
        </button>
        <span className="text-[12px] leading-snug text-[var(--muted)]">
          Only the fields that differ are sent.
        </span>
      </div>

      {message ? (
        <p
          className={`rounded-[10px] px-3 py-2 text-[12.5px] leading-relaxed ${
            state === "saved"
              ? "bg-[var(--success-soft)] text-[var(--success-text)]"
              : "bg-[var(--danger-soft)] text-[var(--danger-text)]"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
