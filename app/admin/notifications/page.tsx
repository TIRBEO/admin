import { apiGet, num } from "@/lib/api";
import { getDash } from "@/lib/dash";
import { Card, Stat, DataTable, Badge, State } from "@/components/primitives";
import { Failure } from "@/components/failure";
import { ago } from "@/lib/format";

/* Two different things share this route name, and conflating them would be
   a lie about who gets messaged:
     GET /api/admin/notifications       — the *operator's own* inbox
     GET /api/admin/notifications/prefs — the *operator's own* preferences
     GET /api/admin/notifications/broadcast — how many people a product
       broadcast would reach, computed from who actually opted in

   There is no history of past broadcasts: `admin_alert` and `product`
   notifications are written to each recipient individually, and nothing
   records that a broadcast was sent. So this page shows reach and the
   operator's own inbox, and says why there is no broadcast log. */

type Inbox = {
  items?: Array<{
    id?: string;
    type?: string;
    title?: string;
    body?: string | null;
    link?: string | null;
    isRead?: boolean;
    createdAt?: string;
  }>;
  total?: number;
};

type Prefs = Record<string, boolean | number | string>;

type BroadcastReach = { recipients?: number };

export default async function NotificationsPage() {
  const [inboxRes, prefsRes, reachRes, dashRes] = await Promise.all([
    apiGet<Inbox>("/admin/notifications?limit=25"),
    apiGet<Prefs>("/admin/notifications/prefs"),
    apiGet<BroadcastReach>("/admin/notifications/broadcast"),
    getDash(7),
  ]);

  if (!inboxRes.ok) return <Failure result={inboxRes} what="your notification inbox" />;

  const items = inboxRes.data?.items ?? [];
  const unread = items.filter((n) => n.isRead === false).length;
  const dash = dashRes.data;
  const byType = dash?.notifications?.byType ?? [];

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Notifications" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Platform notifications"
          value={num(dash?.notifications?.total) ?? 0}
          hint={`${num(dash?.notifications?.unread) ?? 0} unread across all accounts`}
        />
        <Stat
          label="In your inbox"
          value={inboxRes.data?.total ?? 0}
          hint={`${unread} unread here`}
        />
        <Stat
          label="Broadcast reach"
          value={reachRes.ok ? (reachRes.data?.recipients ?? 0) : "—"}
          hint="Verified, unbanned, product-email opt-ins"
        />
        <Stat
          label="Push channels"
          value={num(dash?.push?.total) ?? 0}
          hint="Devices holding a subscription"
        />
      </section>

      <Card
        title="There is no broadcast history"
        description="Stated up front, because an empty log here is not a reporting gap you can query your way out of."
      >
        <p className="text-[13px] text-[var(--tb-text-secondary)]">
          A broadcast writes one notification per recipient and one email per
          opted-in address, then logs a single line to the API&apos;s own
          stdout. No row anywhere records that it happened. The figure above
          is the reach a broadcast would have <em>now</em>; the messages it
          wrote are visible in each person&apos;s own inbox, not in a
          platform-wide list.
        </p>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="What people receive" description="Notifications by type, platform-wide.">
          <DataTable
            columns={["Type", "Count"]}
            empty="No notification has been created."
            rows={byType.map((t) => ({
              Type: <Badge tone="accent">{t.type}</Badge>,
              Count: t.count,
            }))}
          />
        </Card>

        <Card
          title="Your own preferences"
          description="The toggles that decide what reaches you, not anybody else."
        >
          {!prefsRes.ok ? (
            <State title="Your preferences could not be read." />
          ) : (
            <DataTable
              columns={["Channel", "On"]}
              empty="No preference is set."
              rows={Object.entries(prefsRes.data ?? {}).map(([k, v]) => ({
                Channel: <span className="font-mono text-[12px]">{k}</span>,
                On: v === true ? <Badge tone="ok">on</Badge> : v === false ? <Badge tone="muted">off</Badge> : String(v),
              }))}
            />
          )}
          <p className="mt-3 text-[12px] text-[var(--tb-text-muted)]">
            These are yours. Changing them here would change only your own
            inbox, which is not what this section is for — so they are shown
            and not edited.
          </p>
        </Card>
      </div>

      <Card title="Your inbox" description="Notifications addressed to you.">
        <DataTable
          columns={["When", "Type", "Title", "Read"]}
          empty="Your inbox is empty."
          rows={items.map((n) => ({
            When: ago(n.createdAt),
            Type: <Badge tone="accent">{n.type ?? "—"}</Badge>,
            Title: (
              <span>
                <span className="font-medium">{n.title ?? "—"}</span>
                {n.body ? (
                  <span className="block text-[12px] text-[var(--tb-text-muted)]">
                    {n.body}
                  </span>
                ) : null}
              </span>
            ),
            Read: n.isRead ? (
              <span className="text-[var(--tb-text-muted)]">read</span>
            ) : (
              <Badge tone="warn">unread</Badge>
            ),
          }))}
        />
      </Card>
    </div>
  );
}