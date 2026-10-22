import Link from "next/link";

import { NotificationBroadcast } from "@/components/notification-broadcast";
import { NotificationMarkRead } from "@/components/notification-mark-read";
import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { ago, dateTime } from "@/lib/format";
import { readBroadcastRecipients, readLimit, readNotifications, PAGE_SIZES } from "@/lib/notifications";
import { can } from "@/lib/permissions";

/* What the platform tells a person — and the one door that says it to everyone.

   This is the signed-in operator&rsquo;s own inbox: the notices written to their account,
   newest first, the same rows the bell beside their name counts. Marking one
   read, or the whole lot, is a real write through the panel&rsquo;s door.

   The "notification rules" this screen used to draw are gone — no endpoint
   serves them. What replaces them is what genuinely exists: the broadcast that
   reaches every opted-in account, with the recipient count read live beside
   the send so an operator knows the audience before committing to it. */

type Params = Record<string, string | string[] | undefined>;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const page = Math.max(1, Number(one("page")) || 1);
  const limit = readLimit(one("limit"));

  const maySend = await can("notifications.send");
  const [inbox, recipients] = await Promise.all([
    readNotifications(page, limit),
    readBroadcastRecipients(),
  ]);

  const list = inbox.status === "ready" ? inbox.data : null;

  const href = (over: Record<string, string | number>) => {
    const next = { page, limit, ...over };
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (!value || (key === "page" && Number(value) === 1)) continue;
      search.set(key, String(value));
    }
    const q = search.toString();
    return q ? `?${q}` : "";
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        description="The notices the platform has written to your account, and the broadcast that reaches every opted-in account at once. This is an inbox, not a directory — it shows what was sent to you, the operator reading it."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="In your inbox" value={list ? list.total.toLocaleString() : "—"} hint="notices addressed to you" />
        <Metric
          label="Unread"
          value={list ? list.unread.toLocaleString() : "—"}
          hint="waiting for a first read"
          tone={list && list.unread > 0 ? "warn" : "success"}
        />
        <Metric label="On this page" value={list ? list.items.length : "—"} hint={list ? `page ${list.page}` : ""} />
        <Metric
          label="Broadcast reach"
          value={recipients.status === "ready" ? recipients.data.toLocaleString() : "—"}
          hint="opted-in, verified accounts"
          tone="accent"
        />
      </div>

      <Panel flush title="Your inbox" hint="Newest first. Marking a notice read is written back to the account API.">
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--divider)] px-4 py-3">
          <form action="/admin/notifications" method="get" className="flex flex-wrap items-center gap-2">
            <span className="sr-only">Rows per page</span>
            <select
              name="limit"
              defaultValue={String(limit)}
              className="h-9 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n} rows
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-secondary btn-sm h-9">
              Apply
            </button>
          </form>
          {list && list.unread > 0 ? (
            <span className="ml-auto">
              <NotificationMarkRead label="Mark all read" />
            </span>
          ) : null}
        </div>

        <PageState
          load={inbox}
          rows={6}
          empty="Nothing has been sent to your account. A product broadcast, a security alert or an admin note will land here the moment it is written."
        />

        {list ? (
          <>
            <ul className="divide-y divide-[var(--divider)]">
              {list.items.map((n) => (
                <li key={n.id} className="flex items-start gap-3 px-4 py-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-[var(--border-strong)]" : "bg-warn"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-[13px] font-medium tracking-[-0.01em] text-[var(--fg)]">{n.title}</p>
                      <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[11px] text-[var(--muted)]">{n.type}</code>
                    </div>
                    {n.body ? (
                      <p className="mt-1 text-[12px] leading-snug text-[var(--text-2)]">{n.body}</p>
                    ) : null}
                    {n.link ? (
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                        <span>links to</span>
                        <code className="text-[var(--accent-text)]">{n.link}</code>
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <time className="text-[12px] tabular-nums text-[var(--muted)]" dateTime={n.createdAt} title={dateTime(n.createdAt)}>
                      {ago(n.createdAt)}
                    </time>
                    {n.isRead ? (
                      <Pill tone="muted">read</Pill>
                    ) : (
                      <NotificationMarkRead id={n.id} label="Mark read" />
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <nav
              aria-label="Pagination"
              className="flex items-center justify-between gap-3 border-t border-[var(--divider)] px-4 py-3"
            >
              <p className="text-[12px] tabular-nums text-[var(--muted)]">{range(list)}</p>
              <div className="flex gap-2">
                {list.page > 1 ? (
                  <Link href={href({ page: list.page - 1 })} className="btn btn-secondary btn-sm">
                    Previous
                  </Link>
                ) : null}
                {list.page * list.perPage < list.total ? (
                  <Link href={href({ page: list.page + 1 })} className="btn btn-secondary btn-sm">
                    Next
                  </Link>
                ) : null}
              </div>
            </nav>
          </>
        ) : null}
      </Panel>

      <Panel
        title="Broadcast a product update"
        hint="Mails every opted-in account with a verified address, and files an in-app notice. The API sends what fits in one request and refuses a larger audience rather than delivering it in part."
      >
        {maySend ? (
          <>
            <PageState load={recipients} rows={2} empty="No opted-in accounts are reachable, so there is nothing to preview." />
            {recipients.status === "ready" ? <NotificationBroadcast recipients={recipients.data} /> : null}
          </>
        ) : (
          <p className="text-[13px] leading-relaxed text-[var(--muted)]">
            A broadcast reaches every opted-in account on the platform at once, so the console offers it to a
            role holding <code className="text-[var(--text-2)]">notifications.send</code>. Your own notices
            above are still yours to read and to mark.
          </p>
        )}
      </Panel>
    </>
  );
}

function range(list: { page: number; perPage: number; total: number }): string {
  if (list.total === 0) return "no notices";
  const first = (list.page - 1) * list.perPage + 1;
  const last = Math.min(list.page * list.perPage, list.total);
  return `${first}–${last.toLocaleString()} of ${list.total.toLocaleString()}`;
}
