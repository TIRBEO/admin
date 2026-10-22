"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import type { PermissionEntry, RolePower } from "@/lib/staff";

/* What a role means here, as opposed to what it means in code.

   Every permission gets three settings and no checkbox, because a checkbox
   cannot say "leave this to the role". Default keeps the base behaviour the
   registry ships with; Allow and Deny are this installation's edit on top of it,
   and they are stored as a list that can be diffed against the code at review
   time. Nothing here can invent a permission — the keys come from the catalogue
   the API published, and the API refuses a name it does not recognise.

   Owner is editable too, and deliberately so: revoking `staff.manage` from the
   owners would lock every owner out of the roster, which is exactly the kind of
   change worth having a confirm-before-write screen for rather than a value
   nobody thinks about. The guard against losing the platform is that at least
   one owner always exists and only an owner can change the roster; if that
   owner's powers have been edited away, the seed path in Health still works. */

type Setting = "default" | "allow" | "deny";

const CHOICES: Array<{ value: Setting; label: string; hint: string }> = [
  { value: "default", label: "Role", hint: "Whatever the role ships with" },
  { value: "allow", label: "Allow", hint: "Granted on top of the role" },
  { value: "deny", label: "Deny", hint: "Taken away from the role" },
];

export function RolePowerEditor({
  role,
  permissions,
  canEdit,
}: {
  role: RolePower;
  permissions: PermissionEntry[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const initial = useMemo<Record<string, Setting>>(
    () =>
      Object.fromEntries(
        permissions.map((p) => [
          p.key,
          role.grant.includes(p.key) ? "allow" : role.revoke.includes(p.key) ? "deny" : "default",
        ]),
      ) as Record<string, Setting>,
    [permissions, role.grant, role.revoke],
  );

  const [settings, setSettings] = useState<Record<string, Setting>>(initial);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  const dirty = permissions.some((p) => settings[p.key] !== initial[p.key]);
  const effective = permissions.filter((p) => resolves(p.key, settings, role.base.includes(p.key))).length;

  async function save() {
    setBusy(true);
    setNotice(null);
    try {
      const payload = {
        role: role.key,
        grant: permissions
          .filter((p) => settings[p.key] === "allow" && !role.base.includes(p.key))
          .map((p) => p.key),
        revoke: permissions
          .filter((p) => settings[p.key] === "deny" && role.base.includes(p.key))
          .map((p) => p.key),
      };
      const res = await fetch("/api/staff/roles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setNotice({ tone: "bad", text: json?.error ?? `The console answered ${res.status}.` });
        return;
      }
      setNotice({ tone: "ok", text: "Saved. Every account holding this role changes with it." });
      router.refresh();
    } catch {
      setNotice({ tone: "bad", text: "The console never answered. The role was not changed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-plate)]">
      <summary className="flex cursor-pointer list-none flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
        <span className="text-[13px] font-semibold tracking-[-0.01em] text-[var(--fg)]">{role.label}</span>
        <span className="text-[12px] text-[var(--muted)]">{role.purpose}</span>
        <span className="ml-auto shrink-0 rounded-full bg-[var(--fill)] px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-[var(--text-2)]">
          {effective}/{permissions.length} powers
        </span>
      </summary>

      <div className="border-t border-[var(--divider)] px-4 pb-4">
        {role.changedAt ? (
          <p className="pt-3 text-[11px] text-[var(--muted)]">
            Edited {new Date(role.changedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            {role.changedBy ? ` by ${role.changedBy}` : ""} · base role ships with {role.base.length}
          </p>
        ) : (
          <p className="pt-3 text-[11px] text-[var(--muted)]">
            No edits yet — this role is exactly what the code says it is ({role.base.length} powers).
          </p>
        )}

        <ul className="mt-2">
          {permissions.map((p) => {
            const inBase = role.base.includes(p.key);
            const setting = settings[p.key] ?? "default";
            const granted = resolves(p.key, settings, inBase);
            return (
              <li
                key={p.key}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[var(--divider)] py-2 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-[13px] leading-snug text-[var(--fg)]">
                    {p.label}
                    <span
                      className={`ml-2 inline-flex items-center gap-1 text-[11px] ${
                        granted ? "text-[var(--success-text)]" : "text-[var(--text-4)]"
                      }`}
                      title={
                        setting === "default"
                          ? inBase
                            ? "From the role itself"
                            : "Not part of the role"
                          : setting === "allow"
                            ? "Granted here, on top of the role"
                            : "Revoked here, whatever the role says"
                      }
                    >
                      {granted ? "●" : "○"}
                      {setting !== "default" ? (setting === "allow" ? " added" : " removed") : inBase ? " in role" : ""}
                    </span>
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">
                    <code className="text-[var(--text-3)]">{p.key}</code>
                    <span className="hidden sm:inline"> · {p.screen}</span>
                  </p>
                </div>

                <fieldset className="flex shrink-0 items-center gap-0.5 rounded-full bg-[var(--fill)] p-0.5">
                  <legend className="sr-only">{p.label}</legend>
                  {CHOICES.map((c) => (
                    <label key={c.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name={`${role.key}:${p.key}`}
                        value={c.value}
                        checked={setting === c.value}
                        disabled={!canEdit || busy}
                        title={c.hint}
                        onChange={() => setSettings((s) => ({ ...s, [p.key]: c.value }))}
                        className="peer sr-only"
                      />
                      <span className="block rounded-full px-2.5 py-1 text-[11px] font-medium text-[var(--text-3)] transition-colors hover:text-[var(--fg)] peer-disabled:cursor-not-allowed peer-checked:bg-[var(--accent-solid)] peer-checked:text-[var(--accent-fg)]">
                        {c.label}
                      </span>
                    </label>
                  ))}
                </fieldset>
              </li>
            );
          })}
        </ul>

        {canEdit ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={!dirty || busy}>
              {busy ? <Loader2 size={12} aria-hidden className="animate-spin" /> : null}
              Save changes
            </button>
            <button
              type="button"
              className="btn btn-quiet btn-sm"
              onClick={() => setSettings(initial)}
              disabled={!dirty || busy}
            >
              Discard
            </button>
            {notice ? (
              <span className={`text-[12px] ${notice.tone === "ok" ? "text-[var(--success-text)]" : "text-[var(--danger-text)]"}`}>
                {notice.text}
              </span>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-[12px] text-[var(--muted)]">
            Reading only — writing a role needs the “Grant and revoke staff roles” permission, and this account does
            not have it.
          </p>
        )}
      </div>
    </details>
  );
}

/** The answer the guards would enforce for this draft, before it is saved: the
    role's own list, plus the ticks, minus the crosses. "Role" is not a value
    that grants anything on its own — it defers to whatever the code ships. */
function resolves(key: string, settings: Record<string, Setting>, inBase: boolean): boolean {
  const choice = settings[key] ?? "default";
  if (choice === "allow") return true;
  if (choice === "deny") return false;
  return inBase;
}
