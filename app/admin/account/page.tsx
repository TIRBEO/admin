import Link from "next/link";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Field, Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { operatorAccount } from "@/lib/mock";
import { MOCK_ERROR, present, readState } from "@/lib/load-state";
import { ago, dateOnly, dateTime } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

type Params = Record<string, string | string[] | undefined>;

const SESSION_TONE = {
  active: "success",
  expired: "muted",
  revoked: "danger",
} as const;

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const state = readState(params);
  const me = await operatorAccount();
  const load = present(state, me, {
    message: "The operator is whoever the console believes is reading it. With no session cookie, nothing behind this screen can answer.",
  });

  const name = me.profile?.name ?? me.user.username ?? me.user.email;
  const active = me.sessions.filter((s) => s.status === "active");
  const security = me.security;

  return (
    <>
      <PageHeader
        title="My account"
        description="Who this console believes is reading it: the level, the devices, and what those hands have changed."
        state={state}
        params={params}
        actions={
          <>
            {/* Every one of these is a POST endpoint the scaffold cannot call,
                so they are drawn as the brief rather than as dead links. */}
            <button type="button" className="btn btn-secondary btn-sm" disabled title={MOCK_ERROR}>
              <LogOut size={13} aria-hidden />
              Sign out everywhere
            </button>
            <button type="button" className="btn btn-primary btn-sm" disabled title={MOCK_ERROR}>
              Change password
            </button>
          </>
        }
      />

      <PageState load={load} rows={6} />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric
              label="Level"
              value={me.level === "admin" ? "Administrator" : "Operator"}
              hint={
                me.level === "admin"
                  ? "one boolean in the schema today"
                  : "no console writes allowed"
              }
              tone={me.level === "admin" ? "accent" : "default"}
            />
            <Metric
              label="Two-factor"
              value={security?.totpEnabled ? "on" : "off"}
              hint={`${security?.backupCodes.length ?? 0} backup codes left`}
              tone={security?.totpEnabled ? "success" : "danger"}
            />
            <Metric
              label="Active sessions"
              value={String(active.length)}
              hint={`${me.sessions.length} ever on this account`}
            />
            <Metric
              label="Last sign-in"
              value={me.user.lastLoginAt ? ago(me.user.lastLoginAt, NOW_ISO) : "—"}
              hint={me.user.lastLoginAt ? dateTime(me.user.lastLoginAt) : "never recorded"}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Panel title="Identity" hint="The operator is a person account with isAdmin set.">
              <dl className="-my-1">
                <Field label="Name">{name}</Field>
                <Field label="Handle">
                  {me.user.username ? (
                    <Link
                      href={`/admin/people/${me.user.id}`}
                      className="text-[var(--accent-text)] hover:underline"
                    >
                      @{me.user.username}
                    </Link>
                  ) : (
                    "no handle"
                  )}
                </Field>
                <Field label="Email">
                  <code className="text-[12px]">{me.user.email}</code>
                </Field>
                <Field label="Addresses">
                  {me.emails.filter((e) => e.verifiedAt).length} of {me.emails.length} verified
                </Field>
                <Field label="Phone">
                  {me.phone?.number ? (
                    <code className="text-[12px]">{me.phone.number}</code>
                  ) : (
                    "not on file"
                  )}
                </Field>
                <Field label="Account id">
                  <code className="text-[12px]">{me.user.id}</code>
                </Field>
                <Field label="Joined the platform">{dateOnly(me.user.createdAt)}</Field>
                <Field label="Status">
                  <Pill tone={me.user.status === "active" ? "success" : "warn"}>{me.user.status}</Pill>
                </Field>
              </dl>
            </Panel>

            <Panel
              title="Signing in"
              hint="A secret is never shown here — only whether one is set."
            >
              <dl className="-my-1">
                <Field label="Password">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={13} aria-hidden className="text-[var(--muted)]" />
                    set
                    {security?.mustChangePw ? (
                      <Pill tone="danger">change required</Pill>
                    ) : null}
                  </span>
                </Field>
                <Field label="Authenticator app">
                  <Pill tone={security?.totpEnabled ? "success" : "muted"}>
                    {security?.totpEnabled ? "enabled" : "not enabled"}
                  </Pill>
                </Field>
                <Field label="Backup codes">{security?.backupCodes.length ?? 0} unused</Field>
                <Field label="Passkeys">{security?.passkeys ?? 0}</Field>
                <Field label="Console requires 2FA">
                  <Pill tone={security?.require2FA ? "success" : "warn"}>
                    {security?.require2FA ? "enforced" : "optional"}
                  </Pill>
                </Field>
                <Field label="Remember this device">
                  {security?.saveLoginInfo ? "on" : "off"}
                </Field>
                <Field label="Security last touched">
                  {security ? ago(security.updatedAt, NOW_ISO) : "—"}
                </Field>
              </dl>
              <p className="mt-3 text-[12px] leading-snug text-[var(--muted)]">
                Backup codes are shown once, at the moment they are generated. This screen counts
                them; it cannot print them, and neither should the endpoint behind it.
              </p>
            </Panel>
          </div>

          <Panel
            title="Sessions"
            hint="Every token that can act as you, and what it was used from."
            flush
            action={
              <button type="button" className="btn btn-quiet btn-sm" disabled title={MOCK_ERROR}>
                Revoke all
              </button>
            }
          >
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "device", label: "Device" },
                  { key: "where", label: "Where", hideBelow: "sm" },
                  { key: "status", label: "Status" },
                  { key: "used", label: "Last used", align: "right", hideBelow: "md" },
                  { key: "expires", label: "Expires", align: "right", hideBelow: "lg" },
                ]}
                rows={me.sessions.map((s) => ({
                  device: s.deviceName ?? <span className="text-[var(--muted)]">unknown</span>,
                  where: (
                    <span className="block truncate text-[12px]">
                      {s.ipAddress ?? "—"}
                      {s.location ? ` · ${s.location}` : ""}
                    </span>
                  ),
                  status: (
                    <Pill tone={SESSION_TONE[s.status]}>{s.status}</Pill>
                  ),
                  used: s.lastUsedAt ? ago(s.lastUsedAt, NOW_ISO) : "—",
                  expires: s.status === "active" ? dateOnly(s.expiresAt) : "—",
                }))}
                empty="No session is signed in as this operator."
              />
            </div>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Devices" flush hint="Recognised browsers, whether or not they hold a token.">
              <div className="px-4 py-1">
                <DataTable
                  columns={[
                    { key: "device", label: "Device" },
                    { key: "status", label: "Status" },
                    { key: "used", label: "Last used", align: "right", hideBelow: "sm" },
                  ]}
                  rows={me.devices.map((d) => ({
                    device: (
                      <span className="block max-w-[16rem] truncate">
                        {d.deviceName ?? "unknown device"}
                      </span>
                    ),
                    status: (
                      <Pill tone={d.status === "active" ? "success" : "muted"}>{d.status}</Pill>
                    ),
                    used: d.lastUsedAt ? ago(d.lastUsedAt, NOW_ISO) : "never",
                  }))}
                  empty="This account has never registered a device."
                />
              </div>
            </Panel>

            <Panel title="Recent sign-ins" flush>
              <div className="px-4 py-1">
                <DataTable
                  columns={[
                    { key: "at", label: "When" },
                    { key: "method", label: "Method", hideBelow: "sm" },
                    { key: "result", label: "Result" },
                    { key: "ip", label: "From", hideBelow: "md" },
                  ]}
                  rows={me.logins.slice(0, 8).map((l) => ({
                    at: dateTime(l.createdAt),
                    method: l.method,
                    result: <Pill tone={l.success ? "success" : "danger"}>{l.success ? "ok" : "failed"}</Pill>,
                    ip: <code className="text-[12px]">{l.ipAddress ?? "—"}</code>,
                  }))}
                  empty="No sign-in has been recorded for this operator."
                />
              </div>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Panel
              title="What you have changed"
              hint="The audit trail filtered to your own id — every console write names an actor."
              action={
                <Link href={`/admin/audit?q=${me.user.id}`} className="btn btn-quiet btn-sm">
                  Full trail
                </Link>
              }
            >
              <ol className="flex flex-col">
                {me.actions.length === 0 ? (
                  <li className="text-[13px] text-[var(--muted)]">
                    You have not written anything from the console yet.
                  </li>
                ) : (
                  me.actions.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[var(--divider)] py-2.5 last:border-0"
                    >
                      <span className="min-w-0 flex-1 text-[13px] text-[var(--fg)]">{a.title}</span>
                      <code className="text-[11px] text-[var(--text-4)]">{a.action}</code>
                      <span
                        className={`text-[12px] ${
                          a.severity === "error" || a.severity === "critical"
                            ? "text-[var(--danger-text)]"
                            : "text-[var(--muted)]"
                        }`}
                      >
                        {ago(a.createdAt, NOW_ISO)}
                      </span>
                    </li>
                  ))
                )}
              </ol>
            </Panel>

            <Panel title="Preferences" hint="Where each choice actually lives.">
              <ul className="flex flex-col divide-y divide-[var(--divider)]">
                {PREFERENCES.map((p) => (
                  <li key={p.label} className="py-2.5 first:pt-0 last:pb-0">
                    <p className="text-[13px] font-medium tracking-[-0.01em] text-[var(--fg)]">
                      {p.label}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug text-[var(--muted)]">
                      {p.where}
                    </p>
                    <p className="mt-1">
                      <Pill tone={p.wired ? "success" : "warn"}>{p.wired ? "stored" : "not stored"}</Pill>
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <Panel
            title="API keys"
            hint="Console-to-API credentials an operator can hand to a script."
            action={
              <button type="button" className="btn btn-secondary btn-sm" disabled title={MOCK_ERROR}>
                <KeyRound size={13} aria-hidden />
                Create key
              </button>
            }
          >
            <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
              Nothing to list, because nothing to list them from: no{" "}
              <code className="text-[12px]">admin_api_key</code> model exists in{" "}
              <code className="text-[12px]">apps/api/prisma/schema.prisma</code>. Wiring this
              screen needs the table first — id, hashed secret, scopes, created, last used,
              revoked — and one rule carried with it: the plain secret is returned exactly once.
            </p>
          </Panel>
        </>
      )}
    </>
  );
}

/* Preferences are the part of an account screen that is usually a lie: a
   switch that renders, and a cookie or a localStorage key that nobody told
   the database about. Naming where each one lives is the honest version, and
   it is the list the wiring has to promote to columns. */
const PREFERENCES = [
  {
    label: "Palette",
    where: "this browser — localStorage tirbeo:theme, applied before first paint",
    wired: false,
  },
  {
    label: "Remember this device",
    where: "user_security.save_login_info — a real column",
    wired: true,
  },
  {
    label: "Notification digest",
    where: "no per-user column; rules are platform-wide in admin/notifications",
    wired: false,
  },
  {
    label: "Default landing screen",
    where: "nowhere yet — the console opens on the dashboard for everyone",
    wired: false,
  },
];
