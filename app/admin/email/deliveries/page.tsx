import { ago } from "@/lib/format";
import { listDeliveries } from "@/lib/mock";
import { NOW_ISO } from "@/lib/mock/world";

export default async function DeliveriesPage() {
  const items = await listDeliveries();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--fg)]">Deliveries</h1>
        <p className="mt-1 text-[13px] text-[var(--text-3)]">Recent mail</p>
      </div>

      <div className="divide-y divide-[var(--divider)]">
        {items.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-[13px] text-[var(--fg)]">{d.subject}</div>
              <div className="truncate text-[12px] text-[var(--text-4)]">{d.toEmail}</div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[12px] text-[var(--text-4)]">{d.status}</span>
              <span className="shrink-0 text-[12px] text-[var(--text-4)]">{ago(d.createdAt, NOW_ISO)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
