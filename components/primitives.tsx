import type { ReactNode } from "react";

/* Small presentational primitives. Deliberately dumb: they take data and
   render it, so a page file is about the thing it shows, not about markup. */

export function Card({
  title,
  description,
  action,
  children,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface-1)]">
      {title ? (
        <header className="flex items-start justify-between gap-3 border-b border-[var(--tb-border)] px-4 py-3">
          <div>
            <h2 className="text-[14px] font-semibold">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-[12px] text-[var(--tb-text-muted)]">
                {description}
              </p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface-1)] p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--tb-text-muted)]">
        {label}
      </p>
      <p className="mt-1.5 text-[26px] font-semibold tabular-nums tracking-[-0.02em]">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[12px] text-[var(--tb-text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

/** The one place a page decides it has nothing to show. */
export function State({
  tone = "muted",
  title,
  body,
  action,
}: {
  tone?: "muted" | "danger" | "warn" | "ok";
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  const colour = {
    muted: "text-[var(--tb-text-secondary)]",
    danger: "text-[var(--tb-danger)]",
    warn: "text-[var(--tb-warn)]",
    ok: "text-[var(--tb-ok)]",
  }[tone];

  return (
    <div className="rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-6 py-10 text-center">
      <p className={`text-[14px] font-medium ${colour}`}>{title}</p>
      {body ? (
        <p className="mx-auto mt-1 max-w-md text-[13px] text-[var(--tb-text-muted)]">
          {body}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Badge({
  tone = "muted",
  children,
}: {
  tone?: "muted" | "danger" | "warn" | "ok" | "accent";
  children: ReactNode;
}) {
  const styles = {
    muted: "bg-[var(--tb-surface-2)] text-[var(--tb-text-secondary)]",
    danger: "bg-[var(--tb-danger-soft)] text-[var(--tb-danger)]",
    warn: "bg-[var(--tb-warn-soft)] text-[var(--tb-warn)]",
    ok: "bg-[var(--tb-ok-soft)] text-[var(--tb-ok)]",
    accent: "bg-[var(--tb-accent-soft)] text-[var(--tb-accent)]",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${styles}`}
    >
      {children}
    </span>
  );
}

export function DataTable({
  columns,
  rows,
  empty,
}: {
  columns: string[];
  rows: Array<Record<string, ReactNode>>;
  empty: string;
}) {
  if (rows.length === 0) {
    return <State title={empty} />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-[var(--tb-border)]">
            {columns.map((c) => (
              <th
                key={c}
                scope="col"
                className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tb-text-muted)]"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[var(--tb-border)] last:border-0"
            >
              {columns.map((c) => (
                <td key={c} className="px-3 py-2.5 align-middle">
                  {row[c] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}