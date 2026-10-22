"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, UserX } from "lucide-react";

/* Change what kind of staff an account is, or take it off the roster.

   Only an owner ever sees this: the roster is the one write the console does not
   let an Administrator make, because who is staff cannot be a permission somebody
   else can hand out. The API re-checks it anyway — this control is a courtesy,
   not the gate.

   The role select is drawn from the list the API published rather than a copy
   kept here, so a role added in code appears in the picker on the next render
   instead of being silently unassignable. */

export type RoleChoice = { key: string; label: string };

export function StaffRolePicker({
  userId,
  currentRole,
  assigned,
  roles,
}: {
  userId: string;
  currentRole: string | null;
  assigned: boolean;
  roles: RoleChoice[];
}) {
  const router = useRouter();
  /* The API lists roles most-powerful first, so the last one is the least that
     exists. A fresh picker starts there: an accidental Save cannot hand out
     more than the operator meant to. */
  const fallback = roles[roles.length - 1]?.key ?? "";
  const [role, setRole] = useState(
    currentRole && roles.some((r) => r.key === currentRole) ? currentRole : fallback,
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"save" | "remove" | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  // An unassigned legacy account has no row to compare against: writing its
  // role is the first decision about it, so Save is always offered there.
  const unchanged = assigned && role === currentRole && !note.trim();

  async function run(kind: "save" | "remove") {
    setBusy(kind);
    setNotice(null);
    try {
      const res = await fetch("/api/staff", {
        method: kind === "remove" ? "DELETE" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(kind === "remove" ? { userId } : { userId, role, note: note.trim() || undefined }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setNotice({ tone: "bad", text: json?.error ?? `The console answered ${res.status}.` });
        return;
      }
      setNotice({
        tone: "ok",
        text: kind === "remove" ? "Removed from the roster." : `Now ${labelFor(roles, role)}.`,
      });
      setNote("");
      router.refresh();
    } catch {
      setNotice({ tone: "bad", text: "The console never answered. Nothing was changed." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <label className="sr-only" htmlFor={`role-${userId}`}>
          Staff role for this account
        </label>
        <select
          id={`role-${userId}`}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-8 rounded-[8px] border border-[var(--border)] bg-[var(--field)] px-2 text-[12px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
        >
          {roles.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => run("save")}
          disabled={busy !== null || unchanged}
        >
          {busy === "save" ? <Loader2 size={12} aria-hidden className="animate-spin" /> : null}
          {assigned ? "Change" : "Assign"}
        </button>
        <button
          type="button"
          className="btn btn-quiet btn-sm btn-danger-hover"
          onClick={() => run("remove")}
          disabled={busy !== null}
          title="Take this account off the roster. It stops being staff entirely."
        >
          <UserX size={12} aria-hidden />
          Remove
        </button>
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Why — recorded on the row"
        aria-label="Note recorded beside the role"
        maxLength={500}
        className="h-7 w-[15rem] max-w-full rounded-[8px] border border-[var(--border)] bg-[var(--field)] px-2 text-[12px] text-[var(--fg)] placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:outline-none"
      />
      {notice ? (
        <p className={`text-[11px] ${notice.tone === "ok" ? "text-[var(--success-text)]" : "text-[var(--danger-text)]"}`}>
          {notice.text}
        </p>
      ) : null}
    </div>
  );
}

function labelFor(roles: RoleChoice[], key: string): string {
  return roles.find((r) => r.key === key)?.label ?? key;
}
