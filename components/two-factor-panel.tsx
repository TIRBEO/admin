"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   Two-factor, wired to the operator's own account

   The flow follows what the API can actually do, and nothing more:

     setup   →  { secret, uri, recoveryCodes[] }   (a QR is drawn from `uri`;
                                                    the manual key is `secret`)
     verify  →  { ok:true }                        (turns 2FA on)
     disable →  { ok:true }                        (needs a code or password)
     regen   →  { recoveryCodes[] }                (a brand-new set, old ones dead)

   The recovery codes are the one thing this panel gets to be emphatic about:
   they come back exactly once, at the moment of generation, because the store
   keeps only their hashes. So the panel prints them when they arrive and then
   drops them on the next read — the honest shape, not a list you can reopen.
   ═══════════════════════════════════════════════════════════════════ */

type Setup = { secret: string; uri: string; recoveryCodes: string[] };

export function TwoFactorPanel({
  enabled,
  remainingRecoveryCodes,
}: {
  enabled: boolean;
  remainingRecoveryCodes: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [token, setToken] = useState("");

  async function call(payload: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/2fa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      if (!res.ok) {
        setError(typeof json?.error === "string" ? json.error : `The console answered ${res.status}.`);
        return null;
      }
      return json;
    } catch {
      setError("The console never answered. Nothing was changed.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function startSetup() {
    const json = await call({ _action: "setup" });
    if (!json) return;
    setSetup({
      secret: String(json.secret ?? ""),
      uri: String(json.uri ?? ""),
      recoveryCodes: Array.isArray(json.recoveryCodes) ? (json.recoveryCodes as string[]) : [],
    });
  }

  async function verify() {
    const json = await call({ _action: "verify", token: token.trim() });
    if (!json) return;
    setSetup(null);
    setToken("");
    router.refresh();
  }

  async function regenerate() {
    const json = await call({ _action: "regenerate-codes" });
    if (!json) return;
    setCodes(Array.isArray(json.recoveryCodes) ? (json.recoveryCodes as string[]) : []);
  }

  async function disable() {
    const json = await call({ _action: "disable", token: token.trim() });
    if (!json) return;
    setCodes(null);
    setToken("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3.5">
      {error ? (
        <p className="rounded-[10px] bg-[var(--danger-soft)] px-3 py-2 text-[12.5px] text-[var(--danger-text)]">
          {error}
        </p>
      ) : null}

      {setup ? (
        <div className="flex flex-col gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
          <p className="text-[12px] leading-snug text-[var(--text-2)]">
            Add this key in your authenticator app, then confirm with the six-digit code it gives.
          </p>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]">Manual key</p>
            <code className="mt-1 block break-all text-[13px] text-[var(--fg)]">{setup.secret}</code>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]">Setup URI</p>
            <code className="mt-1 block break-all text-[12px] text-[var(--text-2)]">{setup.uri}</code>
          </div>
          <Codes codes={setup.recoveryCodes} />
          <TokenInput value={token} onChange={setToken} label="Six-digit code" />
          <div>
            <button type="button" className="btn btn-primary" onClick={verify} disabled={busy || token.trim().length < 6}>
              {busy ? <Loader2 size={14} aria-hidden className="animate-spin" /> : <ShieldCheck size={14} aria-hidden />}
              Verify &amp; turn on
            </button>
          </div>
        </div>
      ) : !enabled ? (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
            Two-factor is off for this account. Turning it on protects every console write with a
            code only this authenticator can produce.
          </p>
          <div>
            <button type="button" className="btn btn-primary" onClick={startSetup} disabled={busy}>
              {busy ? <Loader2 size={14} aria-hidden className="animate-spin" /> : <ShieldCheck size={14} aria-hidden />}
              Set up two-factor
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
            Two-factor is on.{" "}
            <strong className="font-semibold text-[var(--fg)]">
              {remainingRecoveryCodes} recovery code{remainingRecoveryCodes === 1 ? "" : "s"}
            </strong>{" "}
            left unused. Regenerating issues a new set and deadens the old ones.
          </p>

          {codes ? <Codes codes={codes} /> : null}

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-secondary" onClick={regenerate} disabled={busy}>
              {busy ? <Loader2 size={14} aria-hidden className="animate-spin" /> : null}
              Regenerate codes
            </button>
          </div>

          <div className="flex flex-col gap-2 border-t border-[var(--divider)] pt-3">
            <TokenInput value={token} onChange={setToken} label="Code or password to disable" />
            <div>
              <button type="button" className="btn btn-quiet" onClick={disable} disabled={busy || token.trim().length < 1}>
                <ShieldOff size={14} aria-hidden />
                Turn off two-factor
              </button>
            </div>
            <p className="text-[12px] leading-snug text-[var(--muted)]">
              Turning it off needs a current six-digit code, or this account&apos;s password.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Codes({ codes }: { codes: string[] }) {
  if (codes.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--warn-text)]">
        Recovery codes — shown once
      </p>
      <p className="mt-1 text-[12px] leading-snug text-[var(--muted)]">
        Save these now. The API stores only their hashes, so there is no way to read this list
        again; regenerating is the only second chance.
      </p>
      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
        {codes.map((c) => (
          <li key={c}>
            <code className="text-[12.5px] text-[var(--fg)]">{c}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TokenInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]">{label}</span>
      <input
        type="text"
        autoComplete="one-time-code"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] tracking-[0.05em] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
      />
    </label>
  );
}
