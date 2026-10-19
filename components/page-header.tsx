import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Unplug } from "lucide-react";

import type { Load, LoadState } from "@/lib/load-state";

/* The page frame: what a screen is called, what it is for, what you can do
   from it, and — for the screens whose data has no endpoint behind them yet
   — a badge that stops anybody mistaking a fixture for a live number.
   PageState lives here too: the loading panel is part of the frame, and
   four shared files is the cap this scaffold holds itself to. */

type Params = Record<string, string | string[] | undefined>;

export function PageHeader({
  title,
  description,
  actions,
  unwired,
  state,
  params,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** No endpoint behind this screen. Renders the badge and the state pills. */
  unwired?: boolean;
  /** The current ?state=, so the pills can mark the active branch. */
  state?: LoadState;
  /** The page's own searchParams — the pills rewrite only `state` and let
      every filter on the URL ride along, or a preview of the error branch
      would silently be a preview of a different query. */
  params?: Params;
}) {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em] text-[var(--fg)]">
              {title}
            </h1>
            {unwired ? <NotWired /> : null}
          </div>
          {description ? (
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[var(--muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {state ? <StatePills current={state} params={params ?? {}} /> : null}
    </header>
  );
}

/** The console's honest marker: this screen is built, its numbers are not. */
export function NotWired() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--warn-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--warn-text)]"
      title="No endpoint behind this screen yet — everything here is fixture data."
    >
      <Unplug size={11} aria-hidden />
      Not wired
    </span>
  );
}

/** A plate on the ground: the iOS grouped-list panel. Page furniture rather
    than a design system — it takes content and knows nothing about what is
    inside it, which is why 30 screens can share one div instead of each
    re-typing the same corner radius. */
export function Panel({
  title,
  hint,
  action,
  children,
  flush,
}: {
  title?: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
  /** Skip the inner padding, for a plate whose content is a table. */
  flush?: boolean;
}) {
  return (
    <section className="rounded-[17px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-plate)]">
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-[var(--divider)] px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-[var(--fg)]">{title}</h2>
            {hint ? <p className="mt-0.5 text-[12px] text-[var(--muted)]">{hint}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={flush ? undefined : "px-4 py-3.5"}>{children}</div>
    </section>
  );
}

/** A big number with the sentence beside it that makes it mean something. */
export function Metric({
  label,
  value,
  hint,
  href,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  href?: string;
  tone?: "default" | "accent" | "danger" | "warn" | "success";
}) {
  const colour = {
    default: "text-[var(--fg)]",
    accent: "text-[var(--accent-text)]",
    danger: "text-[var(--danger-text)]",
    warn: "text-[var(--warn-text)]",
    success: "text-[var(--success-text)]",
  }[tone];

  const body = (
    <>
      <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-[var(--muted)]">
        {label}
      </p>
      <p
        className={`mt-1.5 text-[28px] font-semibold leading-none tabular-nums tracking-[-0.03em] ${colour}`}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 text-[12px] leading-snug text-[var(--muted)]">{hint}</p> : null}
    </>
  );

  const plate =
    "rounded-[17px] border border-[var(--border)] bg-[var(--card)] px-4 py-3.5 text-left shadow-[var(--shadow-plate)]";

  return href ? (
    <Link href={href} className={`${plate} transition-colors hover:bg-[var(--hover)]`}>
      {body}
    </Link>
  ) : (
    <div className={plate}>{body}</div>
  );
}

/** A pill for a status. Tone is chosen by the caller, because only the
    caller knows whether "pending" is good news here. */
export function Pill({
  tone = "muted",
  children,
}: {
  tone?: "muted" | "accent" | "danger" | "warn" | "success";
  children: ReactNode;
}) {
  const styles = {
    muted: "bg-[var(--surface-2)] text-[var(--text-2)]",
    accent: "bg-[var(--accent-soft)] text-[var(--accent-text)]",
    danger: "bg-[var(--danger-soft)] text-[var(--danger-text)]",
    warn: "bg-[var(--warn-soft)] text-[var(--warn-text)]",
    success: "bg-[var(--success-soft)] text-[var(--success-text)]",
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium tracking-[-0.01em] ${styles}`}
    >
      {children}
    </span>
  );
}

/** One line of label/value, for the halves of a screen that are not tables. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[var(--divider)] py-2 last:border-0">
      <dt className="text-[13px] text-[var(--muted)]">{label}</dt>
      <dd className="min-w-0 max-w-full break-words text-right text-[13px] text-[var(--fg)]">
        {children}
      </dd>
    </div>
  );
}

/* The three branches a screen can be in without its content: waiting,
   failed, and legitimately nothing. `empty` is rendered here as well as in
   DataTable because a screen whose data is a snapshot rather than a list has
   no table to fall back on. */
export function PageState<T>({
  load,
  rows = 5,
  empty,
}: {
  load: Load<T>;
  rows?: number;
  /** The sentence for the empty branch, on a screen that is not a table. */
  empty?: string;
}) {
  if (load.status === "loading") {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-live="polite">
        <p className="sr-only">Loading…</p>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="skeleton h-11 rounded-[10px]" />
        ))}
      </div>
    );
  }

  if (load.status === "error") {
    return (
      <div className="flex items-start gap-3 rounded-[17px] bg-[var(--danger-soft)] px-5 py-4 ring-1 ring-[var(--danger-text)]/35">
        <AlertTriangle
          size={16}
          className="mt-0.5 shrink-0 text-[var(--danger-text)]"
          aria-hidden
        />
        <div className="flex min-w-0 flex-col gap-2.5">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--danger-text)]">
              This screen could not load
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-2)]">
              {load.message}
            </p>
          </div>
          {/* A failure the reader can end — sign in, retry — says so. Only the
              cause knows which that is, so the screen hands the action over. */}
          {load.action ? <div className="flex flex-wrap gap-2">{load.action}</div> : null}
        </div>
      </div>
    );
  }

  if (load.status === "empty") {
    return (
      <p className="rounded-[17px] border border-dashed border-[var(--border-strong)] px-6 py-12 text-center text-[13px] text-[var(--muted)]">
        {empty ?? "Nothing to show — no rows reached this screen."}
      </p>
    );
  }

  return null;
}

/* Dev-only: rewrites ?state= on the current URL so any branch is one click
   away. A production build drops it entirely — once real requests exist,
   their own failures are the states and a button to fake one is a bug. */
function StatePills({ current, params }: { current: LoadState; params: Params }) {
  if (process.env.NODE_ENV === "production") return null;

  const states: LoadState[] = ["ready", "loading", "empty", "error"];

  return (
    <div className="flex flex-wrap items-center gap-1.5 self-start rounded-full bg-[var(--fill)] py-1 pl-3 pr-1">
      <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted)]">
        preview
      </span>
      {states.map((s) => (
        <Link
          key={s}
          href={withState(params, s)}
          aria-current={s === current ? "true" : undefined}
          className={`rounded-full px-2.5 py-1 text-[12px] font-medium tracking-[-0.01em] ${
            s === current
              ? "bg-[var(--accent-solid)] text-[var(--accent-fg)]"
              : "text-[var(--accent-text)] hover:bg-[var(--fill-hover)]"
          }`}
        >
          {s}
        </Link>
      ))}
    </div>
  );
}

function withState(params: Params, state: LoadState): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "state" || value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) search.append(key, v);
  }
  if (state !== "ready") search.set("state", state);
  /* A bare "?" is a relative reference: same document, empty query. The
     pills must not navigate, only re-render this page's branch. */
  return `?${search.toString()}`;
}
