import Link from "next/link";
import { BellRing, Mail, MonitorSmartphone, Smartphone } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { listNotifications, notificationRules } from "@/lib/mock";
import { present, readState } from "@/lib/load-state";
import { ago, dateTime } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

import type { NotificationRule } from "@/lib/mock/types";

type Params = Record<string, string | string[] | undefined>;

const CHANNEL_ICON = {
  inapp: MonitorSmartphone,
  email: Mail,
  push: Smartphone,
} as const;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const state = readState(params);
  const raw = params.type;
  const type = (Array.isArray(raw) ? raw[0] : raw) ?? "";

  const [rows, rules] = await Promise.all([listNotifications({ type }), notificationRules()]);
  const load = present(state, { rows, rules });

  const types = [...new Set(rows.map((n) => n.type))];
  const unread = rows.filter((n) => !n.isRead).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="What the platform tells a person, through which channel, and how many of them it would reach if it fired now."
        state={state}
        params={params}
      />

      <PageState load={load} rows={6} empty="No rule is configured and nothing has been delivered — the feed is silent because nobody has written one." />

      {load.status !== "ready" ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Delivered" value={rows.length} hint="in-app rows" />
            <Metric label="Unread" value={unread} hint="waiting on a person" tone={unread > 0 ? "warn" : "success"} />
            <Metric label="Rules" value={rules.length} hint="what may fire at all" />
            <Metric
              label="Enabled"
              value={rules.filter((r) => r.enabled).length}
              hint={`${rules.length - rules.filter((r) => r.enabled).length} switched off`}
            />
          </div>

          <Panel
            title="Rules"
            hint="A channel a person has not earned is never offered: the audience is what the platform can actually reach."
          >
            <ul className="flex flex-col gap-3">
              {rules.map((rule: NotificationRule) => (
                <li
                  key={rule.key}
                  className="flex flex-wrap items-start gap-x-3 gap-y-2 rounded-[12px] bg-[var(--surface-2)] px-3.5 py-3"
                >
                  <span className="mt-0.5 text-[var(--muted)]">
                    <BellRing size={14} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium tracking-[-0.01em] text-[var(--fg)]">
                      {rule.label}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug text-[var(--muted)]">
                      {rule.description}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--muted)]">
                      <code>{rule.key}</code>
                      <span>· reaches {rule.audience.toLocaleString()}</span>
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {rule.channels.map((c) => {
                      const Icon = CHANNEL_ICON[c];
                      return (
                        <span
                          key={c}
                          title={c}
                          className={`grid h-7 w-7 place-items-center rounded-full ${
                            rule.enabled
                              ? "bg-[var(--accent-soft)] text-[var(--accent-text)]"
                              : "bg-[var(--surface-3)] text-[var(--muted)]"
                          }`}
                        >
                          <Icon size={13} aria-hidden />
                        </span>
                      );
                    })}
                  </span>
                  <Pill tone={rule.enabled ? "success" : "muted"}>
                    {rule.enabled ? "on" : "off"}
                  </Pill>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <form action="/admin/notifications" method="get" className="flex flex-wrap items-center gap-2">
              <span className="sr-only">Type</span>
              <select
                name="type"
                defaultValue={type}
                className="h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
              >
                <option value="">Every type</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary btn-sm h-9">
                Apply
              </button>
              {type ? (
                <a href="/admin/notifications" className="btn btn-quiet btn-sm h-9">
                  Reset
                </a>
              ) : null}
            </form>
          </Panel>

          <Panel title="Delivered" flush>
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "title", label: "What it said" },
                  { key: "type", label: "Type", hideBelow: "sm" },
                  { key: "account", label: "Account", hideBelow: "md" },
                  { key: "read", label: "Read" },
                  { key: "when", label: "When", align: "right", hideBelow: "lg" },
                ]}
                rows={rows.map((n) => ({
                  title: (
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[var(--fg)]">{n.title}</span>
                      {n.body ? (
                        <span className="truncate text-[11px] text-[var(--muted)]">{n.body}</span>
                      ) : null}
                    </span>
                  ),
                  type: <code className="text-[12px]">{n.type}</code>,
                  account: (
                    <Link
                      href={`/admin/people/${n.userId}`}
                      className="font-mono text-[12px] text-[var(--accent-text)] hover:underline"
                    >
                      {n.userId}
                    </Link>
                  ),
                  read: n.isRead ? (
                    <Pill tone="muted">read</Pill>
                  ) : (
                    <Pill tone="warn">unread</Pill>
                  ),
                  when: <span title={dateTime(n.createdAt)}>{ago(n.createdAt, NOW_ISO)}</span>,
                }))}
                empty="Nothing of that type has been delivered."
              />
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
