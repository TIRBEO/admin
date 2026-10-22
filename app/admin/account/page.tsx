import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { Field, Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { TwoFactorPanel } from "@/components/two-factor-panel";
import { ago, dateOnly, dateTime, device } from "@/lib/format";
import { readOperator } from "@/lib/operator";

import type { Severity } from "@/lib/types";

type Params = Record<string, string | string[] | undefined>;

const TONE: Record<Severity, "muted" | "warn" | "danger"> = {
  info: "muted",
  warning: "warn",
  error: "danger",
  critical: "danger",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  void await searchParams; // no filters: this screen is always about whoever is reading it.
  const load = await readOperator();
  const now = new Date().toISOString();

  if (load.status !== "ready") {
    return (
      <>
        <PageHeader
          title="My account"
          description="Who this console believes is reading it — the role, the two-factor state, the sessions in force, and what these hands have changed."
        />
        <PageState
          load={load}
          rows={6}
          empty="There is no account behind this screen."
        />
      </>
    );
  }

  const { me, twoFactor, detail, actions, mayReadPeople, mayReadTrail } = load.data;
  const displayName = me.name ?? detail?.name ?? detail?.username ?? me.email;
  const entries = Object.entries(me.permissions ?? {});
  const granted = entries.filter(([, on]) => on);
  const withheld = entries.filter(([, on]) => !on);

  return (
    <>
      <PageHeader
        title="My account"
        description="Who this console believes is reading it — the role, the two-factor state, the sessions in force, and what these hands have changed."
        actions={
          mayReadTrail ? (
            <Link href={`/admin/audit?actorId=${me.id}`} className="btn btn-secondary btn-sm">
              My full trail
            </Link>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric
          label="Role"
          value={me.role.label}
          hint={
            me.role.assigned
              ? `${granted.length} of ${entries.length} permissions`
              : "staff with no role row yet"
          }
          tone={me.role.assigned ? "accent" : "warn"}
        />
        <Metric
          label="Two-factor"
          value={twoFactor.enabled ? "on" : "off"}
          hint={twoFactor.enabled ? "protects every write" : "not enrolled"}
          tone={twoFactor.enabled ? "success" : "danger"}
        />
        <Metric
          label="Recovery codes"
          value={String(twoFactor.remainingRecoveryCodes)}
          hint="left unused"
        />
        <Metric
          label="Sessions"
          value={detail ? String(detail._count.sessions) : "—"}
          hint={detail ? `${detail.sessions.length} shown, newest first` : "needs people.read"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel
          title="Identity"
          hint={`Signed in as ${me.email}. The account API is where this is decided.`}
        >
          <dl className="-my-1">
            <Field label="Name">{displayName}</Field>
            <Field label="Handle">
              {detail?.username ? (
                <Link
                  href={`/admin/people/${detail.id}`}
                  className="text-[var(--accent-text)] hover:underline"
                >
                  @{detail.username}
                </Link>
              ) : (
                "no handle"
              )}
            </Field>
            <Field label="Email">
              <code className="text-[12px]">{me.email}</code>
            </Field>
            <Field label="Email verified">
              {detail ? (
                <Pill tone={detail.emailVerified ? "success" : "warn"}>
                  {detail.emailVerified ? "verified" : "not verified"}
                </Pill>
              ) : (
                <span className="text-[var(--muted)]">see below</span>
              )}
            </Field>
            <Field label="Account id">
              <code className="text-[12px]">{me.id}</code>
            </Field>
            <Field label="Status">
              <Pill tone={me.status === "active" ? "success" : "warn"}>{me.status}</Pill>
            </Field>
            <Field label="Joined the platform">
              {detail ? dateOnly(detail.createdAt) : <span className="text-[var(--muted)]">—</span>}
            </Field>
            <Field label="Role">
              <span className="text-[var(--fg)]">{me.role.label}</span>
              <span className="block text-[12px] leading-relaxed text-[var(--muted)]">
                {me.role.purpose}
              </span>
            </Field>
          </dl>
          {!mayReadPeople ? (
            <p className="mt-3 border-t border-[var(--divider)] pt-3 text-[12px] leading-relaxed text-[var(--muted)]">
              The handle, the join date and the verified mark come from the accounts table, which this role
              does not hold. They are on{" "}
              <code className="text-[var(--text-2)]">people.read</code> screens.
            </p>
          ) : null}
        </Panel>

        <Panel
          title="Two-factor"
          hint="The recovery codes print once, at the moment they are generated."
        >
          <TwoFactorPanel
            enabled={twoFactor.enabled}
            remainingRecoveryCodes={twoFactor.remainingRecoveryCodes}
          />
        </Panel>
      </div>

      <Panel
        title="What you can do"
        hint="Every permission in the catalogue, resolved for your role by the account API. Your role does not grant a screen you cannot see here."
        action={
          me.canManageStaff ? (
            <Link href="/admin/staff" className="btn btn-quiet btn-sm">
              Configure roles
            </Link>
          ) : null
        }
      >
        {entries.length === 0 ? (
          <p className="text-[13px] text-[var(--muted)]">
            The account API returned no permission set, so this console has nothing to draw. Check{" "}
            <Link href="/admin/staff" className="text-[var(--accent-text)] hover:underline">
              the staff roster
            </Link>{" "}
            — an account that is staff without a role row reads every screen this way.
          </p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px] text-[var(--muted)]">
              <Pill tone="success">{granted.length} granted</Pill>
              {withheld.length > 0 ? <Pill tone="muted">{withheld.length} withheld</Pill> : null}
              <span>
                A withheld key is a screen the rail hides and a door that answers 403 — the same fact from
                two places.
              </span>
            </div>
            <ul className="flex flex-wrap gap-2">
              {entries.map(([key, on]) => (
                <li key={key}>
                  <Pill tone={on ? "success" : "muted"}>
                    <code className="text-[11px]">{key}</code>
                    {on ? "" : " · off"}
                  </Pill>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      <Panel title="Sessions" flush hint="Every token that can act as you, and what it was used from.">
        {detail ? (
          <div className="px-4 py-1">
            <DataTable
              columns={[
                { key: "device", label: "Device" },
                { key: "where", label: "Where", hideBelow: "sm" },
                { key: "created", label: "Started", hideBelow: "md", nowrap: true },
                { key: "expires", label: "Expires", align: "right", nowrap: true },
              ]}
              rows={detail.sessions.map((s) => ({
                device: (
                  <span className="block max-w-[18rem] truncate" title={s.userAgent ?? undefined}>
                    {device(s.userAgent) ?? <span className="text-[var(--muted)]">unknown</span>}
                  </span>
                ),
                where: <code className="text-[12px]">{s.ipAddress ?? "—"}</code>,
                created: <span className="text-[12px]">{dateTime(s.createdAt)}</span>,
                expires: <span className="text-[12px]">{dateOnly(s.expiresAt)}</span>,
              }))}
              empty="No session is signed in as this operator."
            />
          </div>
        ) : (
          <p className="px-4 py-3 text-[13px] leading-relaxed text-[var(--muted)]">
            Your own sessions are read from the accounts table, so a role without{" "}
            <code className="text-[var(--text-2)]">people.read</code> sees no list here. Two-factor below is
            still yours to change — signing out of every device is the part that needs the table.
          </p>
        )}
      </Panel>

      <Panel
        title="What you have changed"
        hint="The audit trail filtered to your own id — every console write names an actor."
        action={
          mayReadTrail ? (
            <Link href={`/admin/audit?actorId=${me.id}`} className="btn btn-quiet btn-sm">
              Full trail
            </Link>
          ) : null
        }
      >
        {!mayReadTrail ? (
          <p className="text-[13px] leading-relaxed text-[var(--muted)]">
            Reading the trail needs <code className="text-[var(--text-2)]">activity.read</code>. Your writes
            are still recorded — this console simply is not allowed to show them back to you.
          </p>
        ) : actions.length === 0 ? (
          <p className="text-[13px] text-[var(--muted)]">
            You have not written anything from the console yet.
          </p>
        ) : (
          <ol className="flex flex-col">
            {actions.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[var(--divider)] py-2.5 last:border-0"
              >
                <span className="min-w-0 flex-1 text-[13px] text-[var(--fg)]">{a.title}</span>
                <Pill tone={TONE[a.severity]}>{a.severity}</Pill>
                <code className="text-[11px] text-[var(--text-4)]">{a.action}</code>
                <span className="text-[12px] tabular-nums text-[var(--muted)]" title={dateTime(a.createdAt)}>
                  {ago(a.createdAt, now)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </>
  );
}
