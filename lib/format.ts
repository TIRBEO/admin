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

/** "3 days ago" / "in 2 hours" / "just now".
 *  `from` pins the comparison to a fixed clock, so two rows on one page
 *  cannot disagree about how old "now" is.
 *
 *  The running value is scaled into each unit before it is compared, which is
 *  the part that is easy to get wrong: testing the raw second count against
 *  every threshold answers "is this older than a year" for anything over a
 *  minute and prints "this year" on a row written eight hours ago. */
export function ago(v: unknown, from?: unknown): string {
  const d = toDate(v);
  if (!d) return "—";
  const now = toDate(from)?.getTime() ?? Date.now();
  const secs = Math.round((now - d.getTime()) / 1000);
  const future = secs < 0;

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["second", 60],
    ["minute", 60],
    ["hour", 24],
    ["day", 7],
    ["week", 4.35],
    ["month", 12],
    ["year", Number.POSITIVE_INFINITY],
  ];

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  let value = Math.abs(secs);
  for (const [unit, size] of units) {
    const n = Math.round(value);
    if (n < size) return rtf.format(future ? n : -n, unit);
    value /= size;
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

/** Byte counts as an operator reads them: 1.4 GB, never 1498316800. */
export function bytes(v: unknown): string {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let value = n;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = unit === 0 || value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[unit]}`;
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
/* A user-agent string names four engines and one browser. The row keeps the
   whole thing in its title attribute; this is the part worth a column. */
const BROWSERS: Array<[RegExp, string]> = [
  [/CriOS\/(\d+)/, "Chrome"],
  [/FxiOS\/(\d+)/, "Firefox"],
  [/Edg(?:A|iOS|CV)?\/(\d+)/, "Edge"],
  [/OPR\/(\d+)/, "Opera"],
  [/SamsungBrowser\/(\d+)/, "Samsung Internet"],
  [/Firefox\/(\d+)/, "Firefox"],
  [/Chrome\/(\d+)/, "Chrome"],
  [/Version\/(\d+).*Safari/, "Safari"],
];

const SYSTEMS: Array<[RegExp, string]> = [
  [/\((?:iPhone|iPad|iPod)/, "iOS"],
  [/Android/, "Android"],
  [/Mac OS X/, "macOS"],
  [/Windows NT/, "Windows"],
  [/CrOS/, "ChromeOS"],
  [/Linux/, "Linux"],
];

export function device(userAgent: string | null | undefined): string | null {
  const ua = userAgent?.trim();
  if (!ua) return null;
  const browser = BROWSERS.find(([re]) => re.test(ua));
  const system = SYSTEMS.find(([re]) => re.test(ua))?.[1];
  if (!browser && !system) return ua.slice(0, 40);
  const version = browser ? browser[0].exec(ua)?.[1] : null;
  return [browser ? `${browser[1]} ${version ?? ""}`.trim() : null, system ?? null]
    .filter(Boolean)
    .join(" · ");
}
