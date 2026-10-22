import { ago } from "@/lib/format";
import { listInbox } from "@/lib/mock";
import { NOW_ISO } from "@/lib/mock/world";

export default async function InboxPage() {
  const items = await listInbox();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--fg)]">Inbox</h1>
        <p className="mt-1 text-[13px] text-[var(--text-3)]">Bounces and replies</p>
      </div>

      <div className="divide-y divide-[var(--divider)]">
        {items.map((i) => (
          <div key={i.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-[13px] text-[var(--fg)]">{i.subject}</div>
              <div className="truncate text-[12px] text-[var(--text-4)]">{i.from}</div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[12px] text-[var(--text-4)]">{i.kind}</span>
              <span className="shrink-0 text-[12px] text-[var(--text-4)]">{ago(i.receivedAt, NOW_ISO)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
