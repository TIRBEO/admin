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

/** The loading and error branches for a whole screen. `ready` and `empty`
    render nothing: a ready page draws its own content, and an empty one
    reaches DataTable's own sentence, which knows what was filtered out. */
export function PageState<T>({ load, rows = 5 }: { load: Load<T>; rows?: number }) {
  if (load.status === "loading") {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-live="polite">
        <p className="text-[13px] text-[var(--muted)]">Loading…</p>
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="h-11 rounded-[10px] bg-[var(--surface-2)] motion-safe:animate-pulse"
          />
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
        <div className="min-w-0">
          <p className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--danger-text)]">
            This screen could not load
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-2)]">
            {load.message}
          </p>
        </div>
      </div>
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
