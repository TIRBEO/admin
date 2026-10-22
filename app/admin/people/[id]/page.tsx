import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Field, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { PersonActionControls } from "@/components/person-action";
import { PersonDetailsForm } from "@/components/person-details-form";
import { ago, dateOnly, dateTime, device } from "@/lib/format";
import { readPerson } from "@/lib/person";
import { readRoster } from "@/lib/staff";
import { can, readMe } from "@/lib/permissions";
import { signInUrl } from "@/lib/sign-in";

import type { UserStatus } from "@/lib/types";

/* One account, as far as the account door can describe it.
 *
 *  The read is GET /api/admin/users/{id} and it is the only read on this
 *  screen, so what it does not return is simply not drawn: there is no
 *  last-seen or last sign-in, no enforcement reason or end date, and no history
 *  for the account. The ledger door takes a severity and a limit but no account
 *  filter, so a timeline here would be a fabrication and there isn't one.
 *
 *  Reference codes are the identifiers a person quotes and an operator searches
 *  for, so they are printed where they exist and an account's own id is used
 *  only as a link. */

const TONE: Record<UserStatus, "success" | "warn" | "danger" | "muted"> = {
  active: "success",
  restricted: "warn",
  banned: "danger",
  suspended: "danger",
  deactivated: "muted",
  deletion_pending: "warn",
  deleted: "muted",
};

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const read = await readPerson(id);

  if (read.kind === "absent") notFound();

  if (read.kind === "error") {
    /* The one refusal an operator can end themselves: a missing session. A
       refusal because the role does not cover this screen gets no button —
       sending somebody who is signed in to the sign-in page starts a loop they
       cannot leave. */
    const load =
      read.load.reason === "signed-out"
        ? {
            ...read.load,
            action: (
              <Link href={await signInUrl(`/admin/people/${id}`)} className="btn btn-primary btn-sm">
                Sign in
              </Link>
            ),
          }
        : read.load;

    return (
      <>
        <PageHeader title="Person" description="An account on this platform" />
        <PageState load={load} />
      </>
    );
  }

  const p = read.person;
  const name = p.name ?? p.username ?? p.email;
  const identity = p.username ? `@${p.username}` : p.email;
  const reference = p.banRefCode ?? p.suspendRefCode;

  /* Two different writes live on this screen and they are not gated together:
     enforcing on an account needs `people.manage`, while changing who is staff
     is an owner's act wherever the roster says so. An Administrator may ban
     this person and may not make them an administrator. */
  const [mayAct, me] = await Promise.all([can("people.manage"), readMe()]);
  const maySetRole = me.ok && me.data ? me.data.canManageStaff : false;
  /* An owner picking a role needs the list the roster publishes rather than a
     second copy of it typed into the console, so the picker is filled from the
     same read the Staff screen uses. */
  const roster = maySetRole ? await readRoster() : null;
  const roleChoices = roster?.status === "ready"
    ? roster.data.roles.map((r) => ({ key: r.key, label: r.label }))
    : [];

  return (
    <>
      <PageHeader
        title={name}
        description={`${p.email} · ${p.username ? `@${p.username}` : "no handle"}`}
        actions={
          <Link href="/admin/people" className="btn btn-quiet btn-sm">
            <ArrowLeft size={13} aria-hidden />
            All people
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-4">
          <Panel>
            <div className="flex flex-wrap items-start gap-4">
              <Monogram name={name} url={p.photoUrl} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--fg)]">
                    {name}
                  </h2>
                  <Pill tone={TONE[p.statusKind]}>{p.statusKind.replaceAll("_", " ")}</Pill>
                  {p.adminRole ? <Pill tone="accent">{p.adminRole.replaceAll("_", " ")}</Pill> : null}
                  <Pill tone={p.is2FAEnabled ? "success" : "muted"}>
                    {p.is2FAEnabled ? "two-factor on" : "no two-factor"}
                  </Pill>
                  <Pill tone={p.emailVerified ? "success" : "warn"}>
                    {p.emailVerified ? "address verified" : "address unverified"}
                  </Pill>
                </div>
                <dl className="mt-3 grid gap-x-6 text-[13px] sm:grid-cols-2">
                  <Field label="Signs in as">{p.email}</Field>
                  <Field label="Handle">{p.username ? `@${p.username}` : "none"}</Field>
                  <Field label="Joined">{dateOnly(p.createdAt)}</Field>
                  <Field label="Last changed">{ago(p.updatedAt)}</Field>
                  <Field label="Sessions held">
                    {p.sessionCount.toLocaleString()}
                    {p.sessions.length < p.sessionCount ? ` · ${p.sessions.length} newest listed` : ""}
                  </Field>
                  <Field label="Notifications">{p.notificationCount.toLocaleString()}</Field>
                  {reference ? (
                    <Field label="Reference code">
                      <code className="text-[var(--danger-text)]">{reference}</code>
                    </Field>
                  ) : null}
                </dl>
              </div>
            </div>
          </Panel>

          {p.isBanned || p.isSuspended ? (
            <Panel
              title={p.isBanned ? "Banned" : "Suspended"}
              hint="The code the account was mailed. What the restriction says and when it ends are not in this read."
            >
              <div className="flex flex-wrap items-center gap-3">
                <code className="rounded-[10px] bg-[var(--danger-soft)] px-3 py-2 text-[15px] font-semibold tracking-[0.02em] text-[var(--danger-text)]">
                  {reference ?? "no code returned"}
                </code>
                <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
                  Quote this in anything written about the account — it is what the block screen and
                  the notice both carry. Lifting it below leaves the code in place, so an appeal
                  still resolves to the same enforcement.
                </p>
              </div>
            </Panel>
          ) : null}

          <Panel title="Sessions" flush hint="Newest first. A token is never part of this read.">
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "device", label: "Client" },
                  { key: "ip", label: "From", hideBelow: "sm" },
                  { key: "started", label: "Started", align: "right", nowrap: true },
                  { key: "expires", label: "Expires", align: "right", hideBelow: "md", nowrap: true },
                ]}
                rows={p.sessions.map((s) => ({
                  device: (
                    <span className="block max-w-[34ch] truncate text-[12px]" title={s.userAgent ?? undefined}>
                      {device(s.userAgent) ?? <span className="text-[var(--muted)]">unknown client</span>}
                    </span>
                  ),
                  ip: <code className="text-[12px]">{s.ipAddress ?? "—"}</code>,
                  started: s.createdAt ? dateTime(s.createdAt) : "—",
                  expires: s.expiresAt ? dateOnly(s.expiresAt) : "—",
                }))}
                empty="No session row. A ban or a suspension signs every device out, so an enforced account reads empty here."
              />
            </div>
          </Panel>

          <Panel title="Mail the account is set up to receive">
            <dl className="-my-1">
              <Field label="Any mail">
                <Pill tone={p.emailOptIns.emailEnabled ? "success" : "muted"}>
                  {p.emailOptIns.emailEnabled ? "on" : "off"}
                </Pill>
              </Field>
              <Field label="Paused now">
                <Pill tone={p.emailOptIns.paused ? "warn" : "muted"}>
                  {p.emailOptIns.paused ? "paused" : "not paused"}
                </Pill>
              </Field>
              <Field label="Account recap">
                <Pill tone={p.emailOptIns.summaryEnabled ? "success" : "muted"}>
                  {p.emailOptIns.summaryEnabled
                    ? `${p.emailOptIns.summaryFrequency} recap on`
                    : "off"}
                </Pill>
              </Field>
              <Field label="Last recap sent">
                {p.emailOptIns.lastSummarySentAt ? dateTime(p.emailOptIns.lastSummarySentAt) : "never"}
              </Field>
            </dl>
          </Panel>

          <Panel
            title="Consent on file"
            hint="The switches as the preferences row holds them, in the database's own keys."
          >
            {p.signupConsent ? (
              <dl className="-my-1">
                <Field label="Policies accepted">
                  <Pill tone={p.signupConsent.policyAccepted ? "success" : "danger"}>
                    {p.signupConsent.policyAccepted ? "yes" : "no"}
                  </Pill>
                </Field>
                <Field label="When">
                  {p.signupConsent.acceptedAt ? dateTime(p.signupConsent.acceptedAt) : "—"}
                </Field>
                <Field label="Console may read their data">
                  <Pill tone={p.signupConsent.adminDataAccess ? "warn" : "muted"}>
                    {p.signupConsent.adminDataAccess ? "allowed" : "withheld"}
                  </Pill>
                </Field>
                <Field label="Signature">{p.signupConsent.signatureName || "—"}</Field>
                {p.signupConsent.viaOAuth ? (
                  <Field label="Accepted through">an OAuth sign-in</Field>
                ) : null}
              </dl>
            ) : (
              <p className="text-[13px] text-[var(--text-2)]">
                No signup consent record on this account.
              </p>
            )}
            {p.otherConsents.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2 border-t border-[var(--divider)] pt-3">
                {p.otherConsents.map((c) => (
                  <li key={c.key}>
                    <Pill tone={c.granted ? "success" : "muted"}>
                      {c.key} · {c.granted ? "yes" : "no"}
                    </Pill>
                  </li>
                ))}
              </ul>
            ) : null}
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          {mayAct ? (
            <Panel
              title="Act on this account"
              hint="Every write here is signed as you: the API authenticates your own session."
            >
              <PersonActionControls
                id={p.id}
                identity={identity}
                isBanned={p.isBanned}
                isSuspended={p.isSuspended}
                hasConsoleAccess={p.adminRole != null}
              />
            </Panel>
          ) : (
            <Panel
              title="Act on this account"
              hint="Read-only for this role."
            >
              <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
                Banning, suspending and lifting an enforcement change a person's account, so the console
                only offers them to a role holding “Change an account”. Your role can read this account and
                that is all it is asked to do.
              </p>
            </Panel>
          )}

          {mayAct ? (
            <Panel title="What you may change">
              <PersonDetailsForm
                id={p.id}
                identity={identity}
                name={p.name}
                adminRole={p.adminRole}
                maySetRole={maySetRole}
                roles={roleChoices}
              />
            </Panel>
          ) : null}

          <Panel title="What this read does not cover">
            <ul className="flex flex-col gap-2 text-[13px] leading-relaxed text-[var(--text-2)]">
              <li>
                No last-seen or last sign-in: the account detail door does not carry either column.
              </li>
              <li>
                No reason or end date beside an enforcement — only the reference code and the state.
              </li>
              <li>
                No history for this account. The ledger takes a severity and a limit, never a person,
                so its rows cannot be narrowed to one account from here.
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}

/** A photo URL on the account row is real, but the console has no image host
 *  allow-list to load it through — so the plate is a monogram and the row is
 *  named rather than rendered as a broken image. */
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
