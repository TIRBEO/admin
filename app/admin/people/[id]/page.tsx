import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Field, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { getUser, restrictionState } from "@/lib/mock";
import { readPersonSummary } from "@/lib/people";
import { signInUrl } from "@/lib/sign-in";
import { MOCK_ERROR, present, readState } from "@/lib/load-state";
import { ago, bytes, dateOnly, dateTime } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

import type { UserStatus } from "@/lib/mock/types";

type Params = Record<string, string | string[] | undefined>;

const TONE: Record<UserStatus, "success" | "warn" | "danger" | "muted"> = {
  active: "success",
  restricted: "warn",
  banned: "danger",
  suspended: "danger",
  deactivated: "muted",
  deletion_pending: "warn",
  deleted: "muted",
};

export default async function PersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Params>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const state = readState(query);
  const person = await getUser(id);

  /* The list reads real accounts and this screen still reads the fixture
     world, so a real id arrives here and 404s. Say which of the two it is
     instead of telling an operator a person does not exist. */
  if (!person) return <RealAccount id={id} />;

  const load = present(state, person);
  const { user, profile } = person;
  const name = profile?.name ?? user.username ?? user.email;
  const active = person.restrictions.filter((r) => restrictionState(r) !== "expired");

  return (
    <>
      <PageHeader
        title={name}
        description={`${user.email} · ${user.username ? `@${user.username}` : "no handle"} · ${user.id}`}
        params={query}
        state={state}
        actions={
          <>
            <Link href="/admin/people" className="btn btn-quiet btn-sm">
              <ArrowLeft size={13} aria-hidden />
              All people
            </Link>
            {/* No endpoint can act on an account yet, so the buttons are the
                brief for one: rendered, labelled, and honest about being off. */}
            <button type="button" className="btn btn-secondary btn-sm" disabled title={MOCK_ERROR}>
              Message
            </button>
            <button type="button" className="btn btn-primary btn-sm" disabled title={MOCK_ERROR}>
              Change status
            </button>
          </>
        }
      />

      <PageState load={load} rows={8} />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Panel>
              <div className="flex flex-wrap items-start gap-4">
                <Monogram name={name} url={profile?.photoUrl ?? null} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--fg)]">
                      {name}
                    </h2>
                    <Pill tone={TONE[user.status]}>{user.status.replaceAll("_", " ")}</Pill>
                    {user.isAdmin ? <Pill tone="accent">admin</Pill> : null}
                    {person.security?.totpEnabled ? <Pill tone="success">2FA</Pill> : null}
                  </div>
                  {profile?.bio ? (
                    <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-[var(--text-2)]">
                      {profile.bio}
                    </p>
                  ) : null}
                  <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-[var(--muted)]">
                    {profile?.location ? <span>{profile.location}</span> : null}
                    {profile?.pronouns ? <span>{profile.pronouns}</span> : null}
                    {profile?.website ? (
                      <span className="break-all">{profile.website}</span>
                    ) : null}
                    {profile?.jobRole ? (
                      <span>
                        {profile.jobRole}
                        {profile.jobCompany ? ` · ${profile.jobCompany}` : ""}
                      </span>
                    ) : null}
                  </dl>
                </div>
              </div>
            </Panel>

            <Panel title="Account">
              <dl className="-my-1">
                <Field label="Joined">{dateOnly(user.createdAt)}</Field>
                <Field label="Last seen">
                  {user.lastActiveAt ? ago(user.lastActiveAt, NOW_ISO) : "never"}
                </Field>
                <Field label="Last sign-in">
                  {user.lastLoginAt ? ago(user.lastLoginAt, NOW_ISO) : "—"}
                </Field>
                <Field label="Updated">{ago(user.updatedAt, NOW_ISO)}</Field>
                <Field label="Two-factor">
                  {person.security ? (
                    <Pill tone={person.security.totpEnabled ? "success" : "muted"}>
                      {person.security.totpEnabled ? "enabled" : "not enabled"}
                    </Pill>
                  ) : (
                    "—"
                  )}
                </Field>
                <Field label="Passkeys">{person.security?.passkeys ?? 0}</Field>
                <Field label="Backup codes">
                  {person.security?.backupCodes.length ?? 0} left
                </Field>
              </dl>
            </Panel>
          </div>

          {active.length > 0 || person.deletion ? (
            <Panel title="Enforcement">
              <ul className="flex flex-col gap-3">
                {active.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-[12px] bg-[var(--surface-2)] px-3.5 py-2.5"
                  >
                    <span className="flex items-center gap-2 text-[13px] font-medium tracking-[-0.01em] text-[var(--fg)]">
                      <ShieldAlert
                        size={14}
                        aria-hidden
                        className={
                          r.severity === "strike"
                            ? "text-[var(--danger-text)]"
                            : r.severity === "warning"
                              ? "text-[var(--warn-text)]"
                              : "text-[var(--muted)]"
                        }
                      />
                      {r.title}
                    </span>
                    <span className="text-[12px] text-[var(--muted)]">
                      {restrictionState(r) === "permanent"
                        ? "no end date"
                        : `until ${dateOnly(r.endsAt)}`}
                      {` · ${r.severity}`}
                    </span>
                    {r.detail ? (
                      <p className="w-full text-[12px] leading-snug text-[var(--text-2)]">
                        {r.detail}
                      </p>
                    ) : null}
                  </li>
                ))}
                {person.deletion ? (
                  <li className="rounded-[12px] border border-[var(--danger-text)]/40 bg-[var(--danger-soft)] px-3.5 py-2.5 text-[13px] text-[var(--danger-text)]">
                    Deletion requested {ago(person.deletion.requestedAt, NOW_ISO)} · scheduled{" "}
                    {dateOnly(person.deletion.finalAt)}
                    {person.deletion.cancelledAt ? " · cancelled" : ""}
                    {person.deletion.executedAt ? " · executed" : ""}
                  </li>
                ) : null}
              </ul>
            </Panel>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Addresses" flush>
              <div className="px-4 py-1">
                <DataTable
                  columns={[
                    { key: "address", label: "Address" },
                    { key: "kind", label: "Kind", hideBelow: "sm" },
                    { key: "verified", label: "Verified", align: "right" },
                  ]}
                  rows={[
                    ...person.emails.map((e) => ({
                      address: (
                        <span className="flex items-center gap-2">
                          <code className="text-[12px]">{e.address}</code>
                          {e.isDefault ? <Pill tone="accent">primary</Pill> : null}
                        </span>
                      ),
                      kind: e.kind,
                      verified: e.verifiedAt ? dateOnly(e.verifiedAt) : <span className="text-[var(--warn-text)]">unverified</span>,
                    })),
                    ...(person.phone?.number
                      ? [
                          {
                            address: <code className="text-[12px]">{person.phone.number}</code>,
                            kind: "phone",
                            verified: person.phone.verifiedAt
                              ? dateOnly(person.phone.verifiedAt)
                              : "unverified",
                          },
                        ]
                      : []),
                  ]}
                  empty="This account has no verified address on file."
                />
              </div>
            </Panel>

            <Panel
              title="Sessions"
              flush
              hint="A token is never shown — only what it was used from."
            >
              <div className="px-4 py-1">
                <DataTable
                  columns={[
                    { key: "device", label: "Device" },
                    { key: "where", label: "Where", hideBelow: "md" },
                    { key: "status", label: "Status" },
                    { key: "used", label: "Last used", align: "right", hideBelow: "sm" },
                  ]}
                  rows={person.sessions.map((s) => ({
                    device: s.deviceName ?? <span className="text-[var(--muted)]">unknown</span>,
                    where: (
                      <span className="block truncate text-[12px]">
                        {s.ipAddress ?? "—"}
                        {s.location ? ` · ${s.location}` : ""}
                      </span>
                    ),
                    status: (
                      <Pill
                        tone={s.status === "active" ? "success" : s.status === "revoked" ? "danger" : "muted"}
                      >
                        {s.status}
                      </Pill>
                    ),
                    used: s.lastUsedAt ? ago(s.lastUsedAt, NOW_ISO) : "—",
                  }))}
                  empty="No device holds a session for this account."
                />
              </div>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Sign-ins" flush>
              <div className="px-4 py-1">
                <DataTable
                  columns={[
                    { key: "at", label: "When" },
                    { key: "method", label: "Method", hideBelow: "sm" },
                    { key: "result", label: "Result" },
                    { key: "ip", label: "From", hideBelow: "md" },
                  ]}
                  rows={person.logins.slice(0, 10).map((l) => ({
                    at: dateTime(l.createdAt),
                    method: l.method,
                    result: (
                      <Pill tone={l.success ? "success" : "danger"}>
                        {l.success ? "ok" : "failed"}
                      </Pill>
                    ),
                    ip: <code className="text-[12px]">{l.ipAddress ?? "—"}</code>,
                  }))}
                  empty="This account has never signed in."
                />
              </div>
            </Panel>

            <Panel title="Restrictions and appeals" flush>
              <div className="px-4 py-1">
                <DataTable
                  columns={[
                    { key: "what", label: "Action" },
                    { key: "severity", label: "Severity", hideBelow: "sm" },
                    { key: "state", label: "State" },
                    { key: "at", label: "Issued", align: "right", hideBelow: "md" },
                  ]}
                  rows={[
                    ...person.restrictions.map((r) => ({
                      what: r.title,
                      severity: r.severity,
                      state: <Pill tone={restrictionState(r) === "expired" ? "muted" : "warn"}>{restrictionState(r)}</Pill>,
                      at: dateOnly(r.startedAt),
                    })),
                    ...person.appeals.map((a) => ({
                      what: `Appeal — ${a.note.slice(0, 48)}${a.note.length > 48 ? "…" : ""}`,
                      severity: "appeal",
                      state: (
                        <Pill tone={a.decision === "overturned" ? "success" : a.decision === "upheld" ? "danger" : "muted"}>
                          {a.decision ?? "pending"}
                        </Pill>
                      ),
                      at: dateOnly(a.createdAt),
                    })),
                  ]}
                  empty="Never restricted, and never asked to be."
                />
              </div>
            </Panel>
          </div>

          <Panel
            title="Everything else this account touched"
            hint="Counts are what the console can reach for one person."
          >
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              <Tally label="Devices" value={person.devices.length} />
              <Tally label="Notifications" value={person.notifications.length} href="/admin/notifications" />
              <Tally label="Push tokens" value={person.push.length} href="/admin/push" />
              <Tally label="Emails sent" value={person.emailsSent.length} href="/admin/email/deliveries" />
              <Tally label="Data exports" value={person.exports.length} href="/admin/export-requests" />
              <Tally label="Tickets" value={person.tickets.length} href="/admin/tickets" />
              <Tally label="Console actions on them" value={person.audit.length} href="/admin/audit" />
              <Tally label="Activity rows" value={person.statusEvents.length} href="/admin/activity" />
              <Tally
                label="Storage"
                value={person.exports.reduce((t, e) => t + (e.bytes ?? 0), 0)}
                asBytes
              />
              <Tally
                label="Handle"
                value={person.identity?.username ?? "—"}
                href="/admin/identities"
              />
            </div>
          </Panel>

          <Panel title="Recent activity" hint="The ledger rows this account appears in, newest first.">
            <ol className="flex flex-col gap-0">
              {person.statusEvents.slice(0, 12).map((e) => (
                <li key={e.id} className="flex gap-3 border-b border-[var(--divider)] py-2.5 last:border-0">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      e.severity === "critical"
                        ? "bg-danger"
                        : e.severity === "error"
                          ? "bg-danger"
                          : e.severity === "warning"
                            ? "bg-warn"
                            : "bg-[var(--text-4)]"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-[var(--fg)]">{e.title}</p>
                    <p className="mt-0.5 text-[12px] text-[var(--muted)]">
                      <code>{e.kind}</code>
                      {e.detail ? ` · ${e.detail}` : ""}
                    </p>
                  </div>
                  <time className="shrink-0 text-[12px] tabular-nums text-[var(--muted)]">
                    {ago(e.createdAt, NOW_ISO)}
                  </time>
                </li>
              ))}
              {person.statusEvents.length === 0 ? (
                <li className="text-[13px] text-[var(--muted)]">Nothing in the ledger yet.</li>
              ) : null}
            </ol>
          </Panel>
        </>
      )}
    </>
  );
}

/** A fictional avatar URL would render a broken image, and a scaffold is read
    for its layout — so the plate is a monogram, which also proves the fallback
    a real photo URL would need anyway. */
function Monogram({ name, url }: { name: string; url: string | null }) {
  const initials = name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[17px] font-semibold tracking-[-0.02em] text-[var(--accent-text)]"
        aria-hidden
      >
        {initials || "—"}
      </span>
      {url ? (
        <span className="max-w-[8rem] truncate text-[10px] text-[var(--text-4)]" title={url}>
          photo on file
        </span>
      ) : (
        <span className="text-[10px] text-[var(--text-4)]">no photo</span>
      )}
    </div>
  );
}

function Tally({
  label,
  value,
  href,
  asBytes,
}: {
  label: string;
  value: number | string;
  href?: string;
  asBytes?: boolean;
}) {
  const shown =
    typeof value === "string" ? value : asBytes ? bytes(value) : value.toLocaleString();

  const body = (
    <>
      <p className="text-[19px] font-semibold tabular-nums tracking-[-0.02em] text-[var(--fg)]">
        {shown}
      </p>
      <p className="mt-0.5 text-[12px] leading-snug text-[var(--muted)]">{label}</p>
    </>
  );

  const plate = "rounded-[12px] bg-[var(--surface-2)] px-3 py-2.5";

  return href ? (
    <Link href={href} className={`${plate} transition-colors hover:bg-[var(--hover)]`}>
      {body}
    </Link>
  ) : (
    <div className={plate}>{body}</div>
  );
}

/** A real account, on a screen that cannot describe it yet.
 *
 *  Only what the one door that exists can say is shown, and the rest of the
 *  screen is named rather than left blank — a 360 that quietly omits the
 *  devices, sessions and history it has no endpoint for reads as an account
 *  with none of those things. */
async function RealAccount({ id }: { id: string }) {
  const lookup = await readPersonSummary(id);

  if (lookup.kind === "absent") notFound();

  if (lookup.kind === "error") {
    const load =
      lookup.load.reason === "signed-out"
        ? {
            ...lookup.load,
            action: (
              <Link
                href={await signInUrl(`/admin/people/${id}`)}
                className="btn btn-primary btn-sm"
              >
                Sign in
              </Link>
            ),
          }
        : lookup.load;
    return (
      <>
        <PageHeader title="Person" description={`Account ${id}`} />
        <PageState load={load} />
      </>
    );
  }

  const p = lookup.person;
  return (
    <>
      <PageHeader
        title={p.name ?? p.username ?? p.email}
        description={`${p.email} · ${p.username ? `@${p.username}` : "no handle"} · ${p.id}`}
        unwired
        actions={
          <Link href="/admin/people" className="btn btn-quiet btn-sm">
            <ArrowLeft size={13} aria-hidden />
            All people
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Panel title="What the account row says">
          <Field label="Status">
            <Pill tone={TONE[p.status]}>{p.status.replaceAll("_", " ")}</Pill>
          </Field>
          <Field label="Level">{p.isAdmin ? "admin" : "person"}</Field>
          <Field label="Joined">{dateOnly(p.createdAt)}</Field>
        </Panel>

        <Panel title="What this screen is waiting for">
          <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
            The person row is real. Everything below it — profile, addresses, security, sessions,
            devices, logins, restrictions, appeals, status history, notifications, push, exports,
            tickets, mail and the trail of console actions — is still drawn from the fixture world,
            which only knows its own seeded ids. Wiring this screen means one read per section, and
            most of those sections have no admin endpoint yet.
          </p>
        </Panel>
      </div>
    </>
  );
}
