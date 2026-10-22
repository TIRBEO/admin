import { ago } from "@/lib/format";
import { listEmailJobs } from "@/lib/mock";
import { NOW_ISO } from "@/lib/mock/world";

export default async function QueuePage() {
  const items = await listEmailJobs();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--fg)]">Queue</h1>
        <p className="mt-1 text-[13px] text-[var(--text-3)]">Jobs</p>
      </div>

      <div className="divide-y divide-[var(--divider)]">
        {items.map((j) => (
          <div key={j.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-[13px] text-[var(--fg)]">{j.subject ?? j.kind}</div>
              <div className="truncate text-[12px] text-[var(--text-4)]">{j.status}</div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[12px] text-[var(--text-4)]">{j.attempts}/{j.maxAttempts}</span>
              <span className="shrink-0 text-[12px] text-[var(--text-4)]">{ago(j.createdAt, NOW_ISO)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
