import { apiGet } from "@/lib/api";
import { Card, State, Badge } from "@/components/primitives";

/* Appeals is the one section with no endpoint to read.
   The tables survived — status.user_restrictions and status.user_appeals,
   joined by restriction_id — but every route that served them now answers
   410 "Feature removed" (support/appeal, support/tickets/appeals). An
   appeal still reaches the person in their own settings screens; it just
   has no admin-readable surface any more.

   Rather than show an empty table that looks like "nobody has appealed",
   this page probes the route and reports what actually answered. */

async function probe() {
  const [appeals, tickets] = await Promise.all([
    apiGet<{ error?: string }>("/support/tickets/appeals"),
    apiGet<{ error?: string }>("/support/tickets"),
  ]);
  return { appeals, tickets };
}

export default async function AppealsPage() {
  const { appeals, tickets } = await probe();

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="What the API answered"
        description="Probed just now, with this operator's own session."
      >
        <ul className="flex flex-col gap-2">
          {[
            { label: "GET /api/support/tickets/appeals", res: appeals },
            { label: "GET /api/support/tickets", res: tickets },
          ].map(({ label, res }) => (
            <li
              key={label}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--tb-border)] px-3 py-2.5"
            >
              <span className="font-mono text-[12px]">{label}</span>
              <span className="flex items-center gap-2">
                <span className="text-[12px] text-[var(--tb-text-muted)]">
                  {res.status === 0
                    ? "API unreachable"
                    : res.data?.error ?? "no message"}
                </span>
                <Badge
                  tone={
                    res.status === 410
                      ? "danger"
                      : res.ok
                        ? "ok"
                        : "muted"
                  }
                >
                  {res.status === 0 ? "no answer" : res.status}
                </Badge>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <State
        tone="warn"
        title="Appeals has no admin endpoint"
        body="The records still exist in status.user_appeals, attached to status.user_restrictions, and a person can still see and file one from their own settings. What is gone is the route an administrator would read them through, so this page cannot list them and will not pretend it is empty."
      />

      <Card title="What restoring it needs">
        <ol className="list-decimal space-y-2 pl-5 text-[13px] text-[var(--tb-text-secondary)]">
          <li>
            A route that joins <code className="rounded bg-[var(--tb-surface-2)] px-1 text-[11px]">status.user_appeals</code>{" "}
            to its restriction and to the account that filed it, admin-gated.
          </li>
          <li>
            A decision write, since{" "}
            <code className="rounded bg-[var(--tb-surface-2)] px-1 text-[11px]">decision</code>{" "}
            and{" "}
            <code className="rounded bg-[var(--tb-surface-2)] px-1 text-[11px]">decided_at</code>{" "}
            are columns nothing currently sets.
          </li>
          <li>
            An audit event per decision — the audit table already has the
            severity column to record it in.
          </li>
        </ol>
      </Card>
    </div>
  );
}