import Link from "next/link";
import { ShieldCheck, UserRoundPlus } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { RolePowerEditor } from "@/components/role-power-editor";
import { StaffAppoint } from "@/components/staff-appoint";
import { StaffRolePicker } from "@/components/staff-role-picker";
import { ago, dateTime } from "@/lib/format";
import { readPowers, readRoster } from "@/lib/staff";
import { can } from "@/lib/permissions";

/* Who runs this platform, and what each kind of them may do.

   Three facts are kept apart on this screen because they are kept apart in the
   data: who is staff at all (`users.is_admin`), what kind of staff the account
   was made (`staff_roles`, with who decided and when), and what that kind means
   here (`app_config`, one delta per role on top of the powers in code). Folding
   the three into one "admin yes/no" column is what made the old console useless
   for a second administrator: it could not say who was in charge, and it could
   not say why a Moderator was refused.

   Writing the roster is an owner's act and nothing else, so the picker and the
   appoint form simply are not drawn for other roles. The role delta is writable
   by anything holding `staff.manage`, which the Administrator has and a
   Moderator does not. */

export default async function StaffPage() {
  const [roster, powers, mayReadPeople] = await Promise.all([
    readRoster(),
    readPowers(),
    can("people.read"),
  ]);

  const staff = roster.status === "ready" ? roster.data.staff : [];
  const owners = staff.filter((s) => s.role === "owner").length;
  const legacy = staff.filter((s) => !s.assigned).length;

  return (
    <>
      <PageHeader
        title="Staff"
        description="Every account that can act as staff, the role it holds, and the powers that role resolves to on this installation. Only an owner can add or remove a person here; at least one owner always has to exist, so the last one cannot be demoted or removed."
        actions={
          mayReadPeople && roster.status === "ready" && roster.data.canManage ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--success-soft)] px-3 py-1 text-[12px] font-medium text-[var(--success-text)]">
              <ShieldCheck size={13} aria-hidden />
              You can change the roster
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--fill)] px-3 py-1 text-[12px] font-medium text-[var(--text-2)]">
              <ShieldCheck size={13} aria-hidden />
              Reading the roster only
            </span>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric
          label="Staff accounts"
          value={String(staff.length)}
          hint="every account the console opens for"
        />
        <Metric
          label="Owners"
          value={String(owners)}
          hint={owners <= 1 ? "the last one cannot be removed" : "each can appoint and revoke"}
          tone={owners === 0 ? "danger" : owners === 1 ? "warn" : "success"}
        />
        <Metric
          label="Unassigned"
          value={String(legacy)}
          hint="staff from the old switch — no role row names them"
          tone={legacy > 0 ? "warn" : "default"}
        />
        <Metric
          label="Roles"
          value={powers.status === "ready" ? String(powers.data.roles.length) : "—"}
          hint="powers are code; the ticks are this installation's"
        />
      </div>

      {roster.status === "ready" && roster.data.canManage ? (
        <Panel
          title="Appoint somebody"
          hint="The account has to exist already. Find it by address or handle, choose what kind of staff it becomes, and the reason you recorded."
        >
          <StaffAppoint roles={roster.data.roles.map((r) => ({ key: r.key, label: r.label }))} />
        </Panel>
      ) : null}

      {roster.status === "ready" ? (
        <Panel
          title="The roster"
          flush
          hint="Most powerful first. A role named by nobody reads as unassigned rather than as a decision somebody made."
        >
          <div className="px-4 py-1">
            <DataTable
              columns={[
                { key: "person", label: "Account" },
                { key: "role", label: "Role" },
                { key: "by", label: "Granted by", hideBelow: "md", nowrap: true },
                { key: "when", label: "When", align: "right", hideBelow: "sm", nowrap: true },
                { key: "note", label: "Reason", hideBelow: "lg" },
                ...(roster.data.canManage ? [{ key: "act", label: "", align: "right" as const, width: "32ch" }] : []),
              ]}
              rows={roster.data.staff.map((s) => ({
                person: (
                  <span className="flex min-w-0 flex-col">
                    {mayReadPeople ? (
                      <Link
                        href={`/admin/people/${s.userId}`}
                        className="truncate text-[13px] font-medium text-[var(--accent-text)] hover:underline"
                      >
                        {s.name || s.username || s.email || s.userId}
                      </Link>
                    ) : (
                      <span className="truncate text-[13px] font-medium text-[var(--fg)]">
                        {s.name || s.username || s.email || s.userId}
                      </span>
                    )}
                    <span className="truncate text-[11px] text-[var(--muted)]">{s.email ?? "no address on file"}</span>
                  </span>
                ),
                role: rolePill(s.role, s.assigned, roster.data.roles),
                by: s.grantedBy ? (
                  <span className="truncate text-[12px]">{s.grantedBy.name || s.grantedBy.email}</span>
                ) : (
                  <span className="text-[12px] text-[var(--muted)]">not recorded</span>
                ),
                when: s.grantedAt ? (
                  <span className="text-[12px] tabular-nums text-[var(--muted)]" title={dateTime(s.grantedAt)}>
                    {ago(s.grantedAt, new Date().toISOString())}
                  </span>
                ) : (
                  <span className="text-[12px] text-[var(--muted)]">—</span>
                ),
                note: s.note ? (
                  <span className="block max-w-[24rem] truncate text-[12px] text-[var(--text-2)]">{s.note}</span>
                ) : (
                  <span className="text-[12px] text-[var(--muted)]">no reason given</span>
                ),
                act: roster.data.canManage ? (
                  <StaffRolePicker
                    userId={s.userId}
                    currentRole={s.role}
                    assigned={s.assigned}
                    roles={roster.data.roles.map((r) => ({ key: r.key, label: r.label }))}
                  />
                ) : null,
              }))}
              empty="No account is staff. The platform is only reachable by whoever seeded it."
            />
          </div>
        </Panel>
      ) : (
        <PageState load={roster} rows={5} empty="No account is staff." />
      )}

      {powers.status === "ready" ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold tracking-[-0.01em] text-[var(--fg)]">
              <UserRoundPlus size={15} aria-hidden className="text-[var(--text-4)]" />
              What each role can do
            </h2>
            <p className="text-[12px] text-[var(--muted)]">
              Base powers live in the API and are read at review time; these are this installation’s additions and
              removals on top.
            </p>
          </div>
          {powers.data.roles.map((role) => (
            <RolePowerEditor
              key={role.key}
              role={role}
              permissions={powers.data.permissions}
              canEdit={powers.data.canEdit}
            />
          ))}
        </div>
      ) : (
        <PageState load={powers} rows={4} empty="No roles are registered." />
      )}
    </>
  );
}

function rolePill(role: string | null, assigned: boolean, roles: Array<{ key: string; label: string }>) {
  if (!role) return <Pill tone="muted">no role</Pill>;
  const label = roles.find((r) => r.key === role)?.label ?? role;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Pill tone={role === "owner" ? "accent" : assigned ? "success" : "warn"}>{label}</Pill>
      {!assigned ? (
        <span className="text-[11px] text-[var(--muted)]" title="Staff from the single admin switch — no role row names this.">
          unassigned
        </span>
      ) : null}
    </span>
  );
}
