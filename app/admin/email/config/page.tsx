import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { EmailConfigForm } from "@/components/email-config-form";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { readEmailConfig, senderRoles } from "@/lib/email-config";
import { dateTime } from "@/lib/format";
import { signInUrl } from "@/lib/sign-in";
import { can } from "@/lib/permissions";

/* Who Tirbeo sends as.

   The console sends from more than one address on purpose: a person who added
   you through a form gets mail from a Forms alias, a password reset comes from
   a security alias, and none of them share an address with the others. That
   separation lives in this one row, and this screen is just an honest reading
   of it — every alias below is a column the door returned. */

export default async function ConfigPage() {
  const mayConfigure = await can("email.configure");
  const load = await readEmailConfig();

  const error =
    load.status === "error" && load.reason === "signed-out"
      ? {
          ...load,
          action: (
            <Link href={await signInUrl("/admin/email/config")} className="btn btn-primary btn-sm">
              Sign in
            </Link>
          ),
        }
      : load;

  const view = load.status === "ready" ? load.data : null;

  return (
    <>
      <PageHeader
        title="Email config"
        description="The provider outbound mail is handed to, and the address each kind of mail comes from. Tirbeo sends from several verified domains and gives every kind its own alias, so a reset link and a form response are never sent from the same place."
        actions={
          <Link href="/admin/email/deliveries" className="btn btn-quiet btn-sm">
            Deliveries
          </Link>
        }
      />

      <PageState
        load={error}
        rows={5}
        empty="The platform has no outbound mail configuration stored yet."
      />

      {view?.kind === "unset" ? <Unconfigured /> : null}

      {view?.kind === "set" ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Provider" value={view.config.provider} hint="where mail is handed off" />
            <Metric
              label="Status"
              value={view.config.enabled ? "enabled" : "paused"}
              hint="whether sending is switched on"
              tone={view.config.enabled ? "success" : "warn"}
            />
            <Metric
              label="DKIM"
              value={view.config.dkimEnabled ? "on" : "off"}
              hint={view.config.customDomain ? `custom domain ${view.config.customDomain}` : "no custom domain"}
              tone={view.config.dkimEnabled ? "success" : "default"}
            />
            <Metric label="Secrets" value={secretsSummary(view.secrets)} hint="never shown on screen" />
          </div>

          <Panel flush title="The address each kind of mail comes from" hint="A role with no alias falls back to the default sender when the platform builds that mail.">
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "kind", label: "Kind of mail" },
                  { key: "name", label: "Sender name" },
                  { key: "email", label: "Address" },
                  { key: "domain", label: "Sent from domain", hideBelow: "md" },
                ]}
                rows={senderRoles(view.config).map((r) => ({
                  kind: <span className="text-[var(--fg)]">{r.kind}</span>,
                  name: r.name || <span className="text-[var(--muted)]">—</span>,
                  email: r.email ? (
                    <code className="text-[12px] text-[var(--text-2)]">{r.email}</code>
                  ) : (
                    <span className="text-[12px] text-[var(--muted)]">falls back to default</span>
                  ),
                  domain: domainOf(r.email) ?? <span className="text-[var(--muted)]">—</span>,
                }))}
                empty="The row carries no sender addresses."
              />
            </div>
          </Panel>

          <Panel
            title="Transport & default sender"
            hint="Provider, SMTP settings and the default address. The aliases above are stored on this row but are not set here."
          >
            {mayConfigure ? (
            <EmailConfigForm
              provider={view.config.provider}
              smtpHost={view.config.smtpHost ?? ""}
              smtpPort={view.config.smtpPort != null ? String(view.config.smtpPort) : ""}
              smtpUser={view.config.smtpUser ?? ""}
              fromEmail={view.config.defaultFromEmail}
              fromName={view.config.defaultFromName}
              secrets={view.secrets}
            />
            ) : (
              <p className="text-[13px] leading-relaxed text-[var(--muted)]">
                Your role reads the mail ledger but does not configure it: changing a sender or a key needs
                the <code className="text-[var(--text-2)]">email.configure</code> permission. Nothing on this
                plate is a control you can use.
              </p>
            )}
            <p className="mt-3 border-t border-[var(--divider)] pt-3 text-[12px] text-[var(--muted)]">
              Last saved {view.config.updatedAt ? dateTime(view.config.updatedAt) : "—"}
            </p>
          </Panel>
        </>
      ) : null}
    </>
  );
}

/** A short read of the config row that never touches a secret: "both set",
 *  "no key", etc. */
function secretsSummary(s: { resendApiKeySet: boolean; smtpPassSet: boolean }): string {
  if (s.resendApiKeySet && s.smtpPassSet) return "both set";
  if (s.resendApiKeySet) return "key set";
  if (s.smtpPassSet) return "password set";
  return "none set";
}

function domainOf(email: string | null): string | null {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  return at >= 0 ? email.slice(at + 1) : null;
}

function Unconfigured() {
  return (
    <Panel title="Never configured" hint="There is no provider row yet.">
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-2.5 text-[13px] leading-relaxed text-[var(--text-2)]">
          <p>
            The platform has no outbound mail configuration stored. Until one exists, mail cannot
            be sent — and there are no operator-set addresses to show.
          </p>
          <p>
            The door answers a request here with the schema&rsquo;s defaults, not with anything
            anyone chose, so they are not drawn as settings on this screen. Saving a real provider,
            transport and default sender is the step that creates the row this screen reads.
          </p>
          <div className="mt-1">
            <Pill tone="warn">not configured</Pill>
          </div>
          <Link href="/admin/email/deliveries" className="self-start text-[13px] text-[var(--accent-text)] hover:underline">
            Check whether anything still went out →
          </Link>
        </div>
      </div>
    </Panel>
  );
}
