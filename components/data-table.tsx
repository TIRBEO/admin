import type { ReactNode } from "react";

/* The console's one table. It stays here rather than in every page because
   a row drawn twelve times is not a scaffold — but it is deliberately
   dumb: it aligns, sticks and fades, and knows nothing about users,
   tickets or SMTP. Pages pass ReactNode cells, so a badge or a pill link
   is just a cell. */

export type Column = {
  key: string;
  label: string;
  /** Right-aligns the cell and tabular-nums it — for anything you compare
      by magnitude rather than read. */
  align?: "left" | "right";
  /** Column drops below this breakpoint. A phone should keep the identity
      column and the one fact you came to read; everything else is a
      wider-screen decision. */
  hideBelow?: "sm" | "md" | "lg";
  /** Keeps the cell on one line. For a value with a shape of its own — a
      timestamp, an age, a reference code — where a wrapped tail reads as a
      different value rather than a longer one. */
  nowrap?: boolean;
  /** Preferred width, as a plain CSS value. */
  width?: string;
};

const HIDE = {
  sm: "hidden md:table-cell",
  md: "hidden lg:table-cell",
  lg: "hidden xl:table-cell",
} as const;

/* The identity column takes the whole table and then gives back what the
   others need: `w-full max-w-0` is what makes an auto-layout cell shrink to
   its container instead of growing to its content. Without it a long event
   title or a mail subject pushes Severity and When past the panel's edge,
   where they sit off-screen behind a fade with no scrollbar to reach them. */
const FIRST =
  "sticky left-0 z-10 w-full max-w-0 bg-[var(--card)] font-medium text-[var(--fg)] after:absolute after:inset-y-0 after:-right-3 after:w-3 after:bg-[linear-gradient(to_right,var(--card),transparent)] group-hover:bg-[var(--hover)]";

export function DataTable({
  columns,
  rows,
  empty,
}: {
  columns: Column[];
  rows: Array<Record<string, ReactNode>>;
  /** Full sentence, not "No data" — the table cannot tell whether the
      filter, the search or the platform itself is why it is empty. */
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-[var(--border-strong)] px-6 py-12 text-center text-[13px] text-[var(--muted)]">
        {empty}
      </p>
    );
  }

  return (
    /* The right edge fades rather than showing a scrollbar: in LTR the
       clipped columns are always the ones on the right, and a fade that
       bit into the left edge would eat the sticky identity column.
       The last column carries padding of the fade's own width, so when the
       table fits and there is nothing left to scroll, what sits under the
       fade is empty space rather than the tail of a date. */
    <div className="[mask-image:linear-gradient(to_right,black_calc(100%_-_28px),transparent)] overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-[var(--divider)]">
            {columns.map((c, i) => (
              <th
                key={c.key}
                scope="col"
                style={c.width ? { width: c.width } : undefined}
                className={`px-3 py-2 text-[12px] font-semibold tracking-[-0.01em] text-[var(--muted)] first:pl-0 last:pr-8 ${
                  c.hideBelow ? HIDE[c.hideBelow] : ""
                } ${c.nowrap ? "whitespace-nowrap" : ""} ${c.align === "right" ? "text-right" : "text-left"} ${
                  i === 0
                    ? "sticky left-0 z-10 w-full max-w-0 bg-[var(--card)] after:absolute after:inset-y-0 after:-right-3 after:w-3 after:bg-[linear-gradient(to_right,var(--card),transparent)]"
                    : ""
                }`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="group border-b border-[var(--divider)] last:border-0">
              {columns.map((c, i) => (
                <td
                  key={c.key}
                  className={`px-3 py-2.5 align-middle first:pl-0 last:pr-8 ${
                    c.hideBelow ? HIDE[c.hideBelow] : ""
                  } ${c.nowrap ? "whitespace-nowrap" : ""} ${c.align === "right" ? "text-right tabular-nums" : ""} ${
                    i === 0
                      ? FIRST
                      : "text-[var(--text-2)]"
                  }`}
                >
                  {row[c.key] ?? <span className="text-[var(--muted)]">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
