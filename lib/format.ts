/** Small formatters shared by every page.
 *
 *  An admin table is read at a glance and under pressure, so a date that
 *  renders as "Invalid Date" or an age of "NaN days" costs more than the
 *  row it sits in. Every one of these takes untrusted input and always
 *  returns something a person can read. */

export function dateTime(v: unknown): string {
  const d = toDate(v);
  if (!d) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dateOnly(v: unknown): string {
  const d = toDate(v);
  return d ? d.toLocaleDateString() : "—";
}

/** "3 days ago" / "in 2 hours" / "just now". */
export function ago(v: unknown): string {
  const d = toDate(v);
  if (!d) return "—";
  const secs = Math.round((Date.now() - d.getTime()) / 1000);
  const future = secs < 0;
  const abs = Math.abs(secs);

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["second", 60],
    ["minute", 60],
    ["hour", 24],
    ["day", 7],
    ["week", 4.35],
    ["month", 12],
    ["year", Number.POSITIVE_INFINITY],
  ];

  let value = -abs;
  for (const [unit, size] of units) {
    if (abs < size) {
      const rtf = new Intl.RelativeTimeFormat(undefined, {
        numeric: "auto",
      });
      return rtf.format(future ? -value : value, unit);
    }
    value = Math.round(value / size);
  }
  return "—";
}

/** Duration in the largest sensible unit: "4 h 12 m", "37 s". */
export function duration(seconds: unknown): string {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return "—";
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ${m % 60} m`;
  const d = Math.floor(h / 24);
  return `${d} d ${h % 24} h`;
}

function toDate(v: unknown): Date | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === "number" && Number.isFinite(v)) {
    // Anything past ~Sep 2001 in ms is a timestamp, not a year.
    const ms = v > 1e11 ? v : v * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === "string" && v.trim()) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}