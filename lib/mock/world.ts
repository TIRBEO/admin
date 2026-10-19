/* One clock, one id table, one seeded generator.

   Why a fixed NOW: every age on every screen is derived from it, so a row
   that says "12 m ago" says that in the dashboard, in the person's 360 and
   in the audit trail. System time would make three screens disagree about
   the same event, and a static build would change its own numbers when
   re-rendered.

   Why a seeded generator: fixture data has to look organic enough to review
   — a column of identical numbers hides a bad layout — while staying
   byte-identical across builds. Math.random() would make every render diff
   and every screenshot unreproducible.

   Why the fiction: this console has no auth and Vercel redeploys on push, so
   the URL is public. Every address is @example.invalid or @tirbeo.test,
   every name is Sample Person, every IP is in the RFC 5737 documentation
   ranges. Nothing here can be mistaken for a customer. */

import type { UserStatus } from "./types";

/** 2026-10-17T09:30:00Z. Move it and the whole console moves with it. */
export const NOW = Date.UTC(2026, 9, 17, 9, 30, 0);

export const NOW_ISO = new Date(NOW).toISOString();

export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export const minsAgo = (n: number): string => new Date(NOW - n * MIN).toISOString();
export const hoursAgo = (n: number): string => new Date(NOW - n * HOUR).toISOString();
export const daysAgo = (n: number): string => new Date(NOW - n * DAY).toISOString();
export const minsAhead = (n: number): string => new Date(NOW + n * MIN).toISOString();
export const hoursAhead = (n: number): string => new Date(NOW + n * HOUR).toISOString();
export const daysAhead = (n: number): string => new Date(NOW + n * DAY).toISOString();

/** Deterministic 32-bit PRNG (mulberry32). Same seed, same console. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rng(seed: number) {
  const next = mulberry32(seed);
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    /** Percentage as an integer — a rollout, an open rate, a fill. */
    pct: (min: number, max: number) => Math.round(min + next() * (max - min)),
    pick: <T>(list: readonly T[]): T => list[Math.floor(next() * list.length)]!,
    chance: (probability: number) => next() < probability,
  };
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWX" as const;
type Letter = (typeof LETTERS)[number];

/** Statuses the seed table assigns, typed against the schema's enum so a
    typo is a compile error rather than a row the filter never finds. */
const SEED_STATUS: Record<number, UserStatus> = {
  14: "restricted",
  15: "restricted",
  16: "banned",
  17: "suspended",
  18: "deactivated",
  19: "deletion_pending",
};

export type SeedUser = {
  id: string;
  letter: Letter;
  name: string;
  username: string;
  email: string;
  status: UserStatus;
  isAdmin: boolean;
  daysSinceSignup: number;
  minutesSinceActive: number;
};

/** The 24 accounts every other fixture hangs off. One table, so a
    restriction, a ticket and an email job can never point at a stranger. */
export const USERS: SeedUser[] = LETTERS.split("").map((letter, index) => {
  const r = rng(1000 + index);
  return {
    id: `u_${1001 + index}`,
    letter,
    name: `Sample Person ${letter}`,
    username: `sample_${letter.toLowerCase()}`,
    email: `sample_${letter.toLowerCase()}@example.invalid`,
    /** Deliberately uneven: a console built on uniform data hides the rows
        where one column is null and the layout breaks. */
    status: SEED_STATUS[index] ?? "active",
    isAdmin: index === 0 || index === 1 || index === 2,
    daysSinceSignup: 3 + index * 11 + r.int(0, 9),
    minutesSinceActive: r.int(2, 60 * 24 * 9),
  };
});

export const UID = Object.fromEntries(USERS.map((u) => [u.letter, u.id])) as Record<Letter, string>;

/** RFC 5737 documentation ranges — never a routable address. */
const IP_RANGES = ["203.0.113", "198.51.100", "192.0.2"] as const;

export function ip(seed: number): string {
  const r = rng(seed);
  return `${r.pick(IP_RANGES)}.${r.int(2, 250)}`;
}

export const LOCATIONS = [
  "Dhaka, BD",
  "Berlin, DE",
  "Toronto, CA",
  "Lisbon, PT",
  "Nairobi, KE",
  "Osaka, JP",
  "São Paulo, BR",
  "Auckland, NZ",
  "Unknown",
] as const;

export const AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/129.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/605.1.15",
  "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) Safari/604.1",
  "TirbeoiOS/1.4 (iPhone; iOS 18.0)",
] as const;

/** A short quote-able code, the way the API's `ref` renders on an event row. */
export function ref(seed: string): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  h = h >>> 0;
  return Array.from({ length: 6 }, (_, i) => alphabet[(h >> (i * 4)) % alphabet.length]).join("");
}

export const DOMAIN = "tirbeo.test";
export const SEND_DOMAIN = "send.tirbeo.test";
