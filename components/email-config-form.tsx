"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Save, ShieldOff } from "lucide-react";

import type { SecretsPresence } from "@/lib/types";

/* ═══════════════════════════════════════════════════════════════════
   The provider settings

   These are the only columns the config door actually writes: provider, the
   SMTP transport, and the default sender. The per-kind aliases you see above
   this form come from the same row but are not editable here, because the PUT
   leaves them alone — an operator changing the transport must not be able to
   quietly re-point the welcome mail.

   The two secret fields (Resend API key, SMTP password) are never shown. The
   server tells us only whether each is set, a blank means "keep what is
   stored", and the door refuses to send an empty one over a working value.
   ═══════════════════════════════════════════════════════════════════ */

type Status = "idle" | "saving" | "saved" | "failed";

export function EmailConfigForm({
  provider,
  smtpHost,
  smtpPort,
  smtpUser,
  fromEmail,
  fromName,
  secrets,
}: {
  provider: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  fromEmail: string;
  fromName: string;
  secrets: SecretsPresence;
}) {
  const router = useRouter();
  const [values, setValues] = useState({
    provider,
    apiKey: "",
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass: "",
    fromEmail,
    fromName,
  });
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (status !== "idle") setStatus("idle");
  };

  async function save() {
    setStatus("saving");
    setMessage(null);
    try {
      const res = await fetch("/api/email-config", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setStatus("failed");
        setMessage(json?.error || `The panel answered ${res.status}.`);
        return;
      }
      setStatus("saved");
      setValues((v) => ({ ...v, apiKey: "", smtpPass: "" }));
      router.refresh();
    } catch {
      setStatus("failed");
      setMessage("The panel never answered. Nothing was saved — try again.");
    }
  }

  const input =
    "h-9 min-w-0 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:outline-none";

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]">Provider</span>
          <input value={values.provider} onChange={set("provider")} className={input} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]">Default from name</span>
          <input value={values.fromName} onChange={set("fromName")} className={input} />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]">Default from email</span>
          <input value={values.fromEmail} onChange={set("fromEmail")} className={input} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]">SMTP host</span>
          <input value={values.smtpHost} onChange={set("smtpHost")} className={input} placeholder="— not set" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]">SMTP port</span>
          <input value={values.smtpPort} onChange={set("smtpPort")} inputMode="numeric" className={input} />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]">SMTP user</span>
          <input value={values.smtpUser} onChange={set("smtpUser")} className={input} placeholder="— not set" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SecretField
          label="Resend API key"
          set={secrets.resendApiKeySet}
          value={values.apiKey}
          onChange={set("apiKey")}
        />
        <SecretField
          label="SMTP password"
          set={secrets.smtpPassSet}
          value={values.smtpPass}
          onChange={set("smtpPass")}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className="btn btn-primary" disabled={status === "saving"}>
          {status === "saving" ? (
            <Loader2 size={14} aria-hidden className="animate-spin" />
          ) : status === "saved" ? (
            <Check size={14} aria-hidden />
          ) : (
            <Save size={14} aria-hidden />
          )}
          {status === "saving" ? "Saving…" : "Save settings"}
        </button>
        <span className="text-[12px] text-[var(--muted)]">
          A blank key keeps the one already stored.
        </span>
      </div>

      {status === "saved" ? (
        <p className="rounded-[10px] bg-[var(--success-soft)] px-3 py-2 text-[12.5px] text-[var(--success-text)]">
          Saved. Outbound mail now leaves through these settings.
        </p>
      ) : null}
      {status === "failed" && message ? (
        <p className="rounded-[10px] bg-[var(--danger-soft)] px-3 py-2 text-[12.5px] text-[var(--danger-text)]">
          {message}
        </p>
      ) : null}
    </form>
  );
}

function SecretField({
  label,
  set,
  value,
  onChange,
}: {
  label: string;
  set: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)]">
        {label}
        <span
          className={
            set
              ? "inline-flex items-center gap-1 rounded-full bg-[var(--success-soft)] px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-[var(--success-text)]"
              : "inline-flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-[var(--muted)]"
          }
        >
          {set ? null : <ShieldOff size={10} aria-hidden />}
          {set ? "set" : "not set"}
        </span>
      </span>
      <input
        type="password"
        value={value}
        onChange={onChange}
        autoComplete="off"
        className="h-9 min-w-0 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:outline-none"
        placeholder={set ? "••••••••  (blank keeps it)" : "enter a key"}
      />
    </label>
  );
}
