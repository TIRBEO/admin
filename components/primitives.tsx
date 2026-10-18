import type { ReactNode } from "react";

/* Presentational primitives in the iOS grouped-list voice: each Card is a
   17px plate floating on the ground with a soft shadow, section labels are
   13px sentence-case, and rows are hairline-divided. Deliberately dumb —
   a page file is about the thing it shows, not about markup. */

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
    <section className="rounded-[17px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] shadow-[var(--tb-shadow-plate)]">
      {title ? (
        <header className="flex items-start justify-between gap-3 border-b border-[var(--tb-border)] px-5 pb-3 pt-4">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-[13px] leading-snug text-[var(--tb-text-muted)]">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "accent" | "danger" | "warn" | "ok";
}) {
  const colour = {
    default: "text-[var(--tb-text-primary)]",
    accent: "text-[var(--tb-accent-text)]",
    danger: "text-[var(--tb-danger)]",
    warn: "text-[var(--tb-warn)]",
    ok: "text-[var(--tb-ok)]",
  }[tone ?? "default"];

  return (
    <div className="rounded-[17px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-5 py-4 shadow-[var(--tb-shadow-plate)]">
      <p className="text-[13px] font-medium tracking-[-0.01em] text-[var(--tb-text-muted)]">
        {label}
      </p>
      <p
        className={`mt-1.5 text-[30px] font-semibold leading-none tabular-nums tracking-[-0.03em] ${colour}`}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 text-[13px] leading-snug text-[var(--tb-text-muted)]">
          {hint}
        </p>
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
    <div className="rounded-[17px] border border-[var(--tb-border)] bg-[var(--tb-surface-1)] px-6 py-12 text-center shadow-[var(--tb-shadow-plate)]">
      <p className={`text-[15px] font-medium tracking-[-0.01em] ${colour}`}>{title}</p>
      {body ? (
        <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-[var(--tb-text-muted)]">
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
    accent: "bg-[var(--tb-accent-soft)] text-[var(--tb-accent-text)]",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium tracking-[-0.01em] ${styles}`}
    >
      {children}
    </span>
  );
}

/** A compact horizontal bar for a single share of a whole. Pure CSS width —
    no charting library, no client JS. `max` is the value that fills the bar. */
export function Bar({
  value,
  max,
  tone = "accent",
}: {
  value: number;
  max: number;
  tone?: "accent" | "danger" | "warn" | "ok" | "muted";
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const fill = {
    accent: "bg-[var(--tb-accent-solid)]",
    danger: "bg-[var(--tb-danger)]",
    warn: "bg-[var(--tb-warn)]",
    ok: "bg-[var(--tb-ok)]",
    muted: "bg-[var(--tb-text-muted)]",
  }[tone];

  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--tb-surface-2)]"
      role="presentation"
    >
      <div
        className={`h-full rounded-full ${fill}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** A labelled count breakdown: name, bar, right-aligned tabular number.
    Reads like the iOS Storage bar — one glance tells you the shape. */
export function Bars({
  rows,
  tone = "accent",
}: {
  rows: Array<{ label: string; value: number; tone?: "accent" | "danger" | "warn" | "ok" | "muted" }>;
  tone?: "accent" | "danger" | "warn" | "ok" | "muted";
}) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
          <span className="truncate text-[13px] text-[var(--tb-text-secondary)]">
            {r.label}
          </span>
          <span className="text-[13px] font-medium tabular-nums text-[var(--tb-text-primary)]">
            {r.value.toLocaleString()}
          </span>
          <div className="col-span-2">
            <Bar value={r.value} max={max} tone={r.tone ?? tone} />
          </div>
        </li>
      ))}
    </ul>
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
                className="px-3 py-2 text-left text-[12px] font-semibold tracking-[-0.01em] text-[var(--tb-text-muted)] first:pl-0 last:pr-0"
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
              className="border-b border-[var(--tb-border)] transition-colors last:border-0 hover:bg-[var(--tb-surface-2)]"
            >
              {columns.map((c) => (
                <td key={c} className="px-3 py-2.5 align-middle first:pl-0 last:pr-0">
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
