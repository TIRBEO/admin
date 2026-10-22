import type { ReactNode } from "react";
import { emailConfig } from "@/lib/mock";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[13px] text-[var(--text-3)]">{label}</span>
      <span className="text-[13px] text-[var(--fg)]">{value}</span>
    </div>
  );
}

export default async function ConfigPage() {
  const { config: cfg, secrets } = await emailConfig();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--fg)]">Config</h1>
        <p className="mt-1 text-[13px] text-[var(--text-3)]">Provider</p>
      </div>

      <div className="divide-y divide-[var(--divider)]">
        <Row label="Provider" value={cfg.provider} />
        <Row label="Status" value={cfg.enabled ? "enabled" : "disabled"} />
        <Row label="Default from" value={`${cfg.defaultFromName} <${cfg.defaultFromEmail}>`} />
        <Row label="SMTP host" value={cfg.smtpHost ? `${cfg.smtpHost}:${cfg.smtpPort ?? ""}` : "—"} />
        <Row label="Resend domain" value={cfg.resendDomain ?? "—"} />
        <Row label="Custom domain" value={cfg.customDomain ?? "—"} />
        <Row label="DKIM" value={cfg.dkimEnabled ? "on" : "off"} />
        <Row label="API key" value={secrets.resendApiKeySet ? "set" : "not set"} />
        <Row label="SMTP password" value={secrets.smtpPassSet ? "set" : "not set"} />
        <Row label="Updated" value={new Date(cfg.updatedAt).toLocaleString()} />
      </div>
    </div>
  );
}
