import { KeyRound } from "lucide-react";

import { Field, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { emailConfig } from "@/lib/mock";
import { MOCK_ERROR, present, readState } from "@/lib/load-state";
import { ago } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

type Params = Record<string, string | string[] | undefined>;

/* A console never echoes a secret back, not even the last four characters:
   this screen is public until auth returns, and presence is all a screenshot
   can safely carry. */
const SENDERS: Array<[string, string, string]> = [
  ["Default", "defaultFromEmail", "defaultFromName"],
  ["Welcome", "welcomeFromEmail", "welcomeFromName"],
  ["One-time codes", "otpFromEmail", "otpFromName"],
  ["Password reset", "resetFromEmail", "resetFromName"],
  ["Notifications", "notifyFromEmail", "notifyFromName"],
  ["Alerts", "alertFromEmail", "alertFromName"],
  ["Forms", "formsFromEmail", "formsFromName"],
];

export default async function EmailConfigPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const state = readState(params);
  const { config, secrets } = await emailConfig();
  const load = present(state, { config, secrets });

  return (
    <>
      <PageHeader
        title="Email config"
        description="Which provider sends, which address it signs as, and whether the keys are present. Nothing here prints a secret."
        state={state}
        params={params}
        actions={
          <button type="button" className="btn btn-primary btn-sm" disabled title={MOCK_ERROR}>
            Save changes
          </button>
        }
      />

      <PageState load={load} rows={5} empty="No email configuration row exists, so nothing can be sent." />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Provider">
              <dl className="-my-1">
                <Field label="Enabled">
                  <Pill tone={config.enabled ? "success" : "danger"}>
                    {config.enabled ? "sending" : "disabled"}
                  </Pill>
                </Field>
                <Field label="Driver">{config.provider}</Field>
                <Field label="API region">{config.resendDomain ?? "—"}</Field>
                <Field label="SMTP host">
                  {config.smtpHost ? `${config.smtpHost}:${config.smtpPort ?? ""}` : "not configured"}
                </Field>
                <Field label="SMTP user">{config.smtpUser ?? "—"}</Field>
                <Field label="Last changed">{ago(config.updatedAt, NOW_ISO)}</Field>
              </dl>
            </Panel>

            <Panel title="Authentication" hint="The domain a recipient's provider actually checks.">
              <dl className="-my-1">
                <Field label="Custom domain">{config.customDomain ?? "provider default"}</Field>
                <Field label="DKIM signing">
                  <Pill tone={config.dkimEnabled ? "success" : "warn"}>
                    {config.dkimEnabled ? "on" : "off"}
                  </Pill>
                </Field>
                <Field label="SPF">inherits the verified domain</Field>
                <Field label="DMARC">
                  <span className="text-[var(--muted)]">published by the domain owner</span>
                </Field>
              </dl>
            </Panel>
          </div>

          <Panel title="Secrets" hint="Presence only. A value that can be read out is a value that can be leaked.">
            <ul className="flex flex-col gap-2.5">
              {[
                ["Resend API key", secrets.resendApiKeySet],
                ["SMTP password", secrets.smtpPassSet],
              ].map(([label, set]) => (
                <li key={label as string} className="flex items-center gap-2.5">
                  <KeyRound
                    size={13}
                    aria-hidden
                    className={set ? "text-[var(--success-text)]" : "text-[var(--muted)]"}
                  />
                  <span className="flex-1 text-[13px] text-[var(--text-2)]">{label as string}</span>
                  <span
                    className={`text-[12px] font-medium ${
                      set ? "text-[var(--success-text)]" : "text-[var(--warn-text)]"
                    }`}
                  >
                    {set ? "present" : "not set"}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Senders by purpose" hint="A category falls back to the default when its own pair is empty.">
            <div className="grid gap-x-6 gap-y-1 md:grid-cols-2">
              {SENDERS.map(([label, emailKey, nameKey]) => {
                const email = String(config[emailKey as keyof typeof config] ?? "");
                const name = String(config[nameKey as keyof typeof config] ?? "");
                return (
                  <div
                    key={label}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-[var(--divider)] py-2 last:border-0"
                  >
                    <span className="text-[13px] text-[var(--muted)]">{label}</span>
                    <span className="text-right text-[13px] text-[var(--fg)]">
                      {email ? (
                        <>
                          {name || "—"} <code className="text-[12px] text-[var(--text-2)]">&lt;{email}&gt;</code>
                        </>
                      ) : (
                        <span className="text-[var(--muted)]">falls back to default</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
