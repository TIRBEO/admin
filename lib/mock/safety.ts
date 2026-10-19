/* Enforcement: what was done to an account, what they asked back about,
   what is blocked outright, and the score that summarises all of it. */

import type {
  AppealDecision,
  BlocklistRow,
  RateLimitBucket,
  RateLimitMetrics,
  RestrictionSeverity,
  SecurityEventRow,
  SecurityScore,
  Severity,
  UserAppeal,
  UserRestriction,
  VerificationLimit,
} from "./types";
import { USERS, daysAgo, daysAhead, ip, minsAgo, minsAhead, rng } from "./world";
import { security, sessions, users } from "./users";

const GUIDELINES: Array<{ guideline: string; title: string; severity: RestrictionSeverity }> = [
  { guideline: "spam.repeated-posts", title: "Repeated identical posts", severity: "warning" },
  { guideline: "harassment.targeted", title: "Targeted harassment", severity: "strike" },
  { guideline: "nsfw.unmarked-media", title: "Unmarked sensitive media", severity: "notice" },
  { guideline: "impersonation.handle", title: "Handle impersonating another person", severity: "strike" },
  { guideline: "spam.link-farming", title: "Link farming in bios", severity: "warning" },
  { guideline: "misinfo.health", title: "Repeated health misinformation", severity: "strike" },
  { guideline: "abuse.automated", title: "Automated abuse of the reply box", severity: "warning" },
];

/* A slice, not all of them: a console where every account is under
   enforcement is a console whose badges mean nothing. */
const MODERATED = USERS.slice(4, 16);

export const restrictions: UserRestriction[] = MODERATED.map((seed, i) => {
  const r = rng(11000 + i);
  const g = r.pick(GUIDELINES);
  const started = r.int(1, 40);
  return {
    id: `res_${100 + i}`,
    userId: seed.id,
    guideline: g.guideline,
    title: g.title,
    detail: r.chance(0.8) ? `Sample enforcement note ${i + 1}: three reports in one day.` : null,
    severity: g.severity,
    startedAt: daysAgo(started),
    /* Half expired, half still running — the screen needs both, and the
        "expiring in 3 days" branch is where an operator acts. */
    endsAt:
      g.severity === "notice"
        ? null
        : started > 14
          ? daysAgo(started - 14)
          : daysAhead(14 - started),
    readAt: r.chance(0.4) ? daysAgo(Math.max(0, started - 1)) : null,
  };
});

const APPEAL_NOTES = [
  "I think this was automated. My posts were about a public event.",
  "Sorry — I did not know links in a bio counted as spam.",
  "This is a second account of mine and it was compromised.",
  "Please review, the report came from someone I blocked.",
];

export const appeals: UserAppeal[] = restrictions
  .filter((_, i) => i % 2 === 0)
  .map((restriction, i) => {
    const r = rng(11500 + i);
    const decision: AppealDecision | null = r.chance(0.45) ? null : r.pick(["upheld", "overturned"]);
    return {
      id: `apl_${100 + i}`,
      restrictionId: restriction.id,
      userId: restriction.userId,
      note: r.pick(APPEAL_NOTES),
      decision,
      decidedAt: decision ? daysAgo(r.int(1, 9)) : null,
      createdAt: daysAgo(r.int(2, 20)),
    };
  });

const TARGET_TYPES: BlocklistRow["targetType"][] = ["ip", "email", "domain", "user", "device"];

export const blocklist: BlocklistRow[] = Array.from({ length: 22 }, (_, i) => {
  const r = rng(12000 + i);
  const targetType = r.pick(TARGET_TYPES);
  const targetId =
    targetType === "ip"
      ? ip(1200 + i)
      : targetType === "email"
        ? `spam${i}@example.invalid`
        : targetType === "domain"
          ? `evil-${i}.test`
          : targetType === "user"
            ? users[i % users.length]!.id
            : `dev_${i}_${r.int(0, 2)}`;
  const active = r.chance(0.75);
  return {
    id: `blk_${100 + i}`,
    targetType,
    targetId,
    reason: r.pick([
      "Credential stuffing attempt",
      "Bulk account creation",
      "Reported phishing links",
      "Abuse of the signup OTP",
      "Recurring spam from this range",
    ]),
    blockedBy: r.chance(0.7) ? users[r.int(0, 2)]!.id : null,
    isActive: active,
    expiresAt: r.chance(0.4) ? `2027-01-0${r.int(1, 9)}T00:00:00.000Z` : null,
    createdAt: daysAgo(r.int(1, 180)),
    updatedAt: daysAgo(r.int(0, 40)),
  };
});

/** The unified ledger's security slice. Kinds are the ones the API writes. */
const SECURITY_KINDS: Array<{ kind: string; severity: Severity; title: string }> = [
  { kind: "auth.login_failed", severity: "warning", title: "Sign-in failed" },
  { kind: "auth.otp_login_failed", severity: "warning", title: "Code sign-in failed" },
  { kind: "auth.login_success", severity: "info", title: "Signed in" },
  { kind: "auth.password_reset_requested", severity: "warning", title: "Password reset requested" },
  { kind: "auth.2fa_disabled", severity: "error", title: "Two-factor turned off" },
  { kind: "auth.passkey_registered", severity: "info", title: "Passkey added" },
  { kind: "captcha.blocked", severity: "warning", title: "Challenge blocked the attempt" },
  { kind: "security.session_revoked", severity: "error", title: "Session revoked" },
  { kind: "security.ip_blocked", severity: "critical", title: "Address blocked automatically" },
  { kind: "auth.oauth_failed", severity: "warning", title: "Provider sign-in failed" },
];

export const securityEvents: SecurityEventRow[] = Array.from({ length: 64 }, (_, i) => {
  const r = rng(13000 + i);
  const k = r.pick(SECURITY_KINDS);
  const owner = r.chance(0.85) ? users[r.int(0, users.length - 1)]! : null;
  return {
    id: `sev_${1000 + i}`,
    userId: owner?.id ?? null,
    eventType: k.kind,
    severity: k.severity,
    ipAddress: ip(900 + i),
    userAgent: r.pick([
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/129.0 Safari/537.36",
      "curl/8.9.1",
      "python-requests/2.32.3",
    ]),
    createdAt: minsAgo(i * 37 + r.int(0, 30)),
  };
});

/** The event every screen links to when it says "critical". */
export const PRIMARY_SECURITY_EVENT_ID = securityEvents.find((e) => e.severity === "critical")?.id;

export const verificationLimits: VerificationLimit[] = (
  [
    ["email_otp", 5, 15],
    ["phone_otp", 3, 15],
    ["signup", 4, 60],
    ["password_reset", 3, 30],
    ["magic_link", 5, 15],
    ["email_change", 2, 60],
  ] as const
).map(([method, max, windowMin], i) => ({
  id: `vrl_${100 + i}`,
  method,
  max,
  /* The column is milliseconds; a screen reads it in minutes. */
  windowMs: windowMin * 60_000,
  createdAt: daysAgo(300),
  updatedAt: daysAgo(i * 9),
}));

const BUCKET_KEYS = [
  ["auth.login", "per IP", 20, 15],
  ["auth.otp", "per address", 5, 15],
  ["api.read", "per token", 240, 5],
  ["api.write", "per token", 60, 5],
  ["media.upload", "per user", 30, 60],
  ["public.search", "per IP", 120, 1],
] as const;

export const rateLimitBuckets: RateLimitBucket[] = BUCKET_KEYS.map(
  ([key, window, limit, windowMin], i) => {
    const r = rng(14000 + i);
    const used = r.int(0, Math.round(limit * 1.25));
    return {
      key,
      window,
      limit,
      used,
      /* The spend is labelled by the window it belongs to, not by the
          limiter's name twice. */
      resetAt: minsAhead(r.int(1, windowMin)),
      blocked: used > limit ? r.int(2, 40) : 0,
    };
  },
);

export const rateLimitMetrics: RateLimitMetrics = {
  totalHits: 412_880,
  totalBlocked: 3_164,
  totalBypassed: 1_207,
  blockRate: 0.77,
  trackedQueries: 188,
  buckets: rateLimitBuckets,
};

/** Mirrors /api/admin/security/score, including its arithmetic — the
    factors are what the endpoint actually reports today. */
export const securityScore: SecurityScore = {
  score: 88,
  threatLevel: "low",
  factors: [
    {
      name: "Password Policy",
      score: 18,
      maxScore: 20,
      status: "good",
      description: "Strong password requirements enforced",
    },
    {
      name: "2FA Adoption",
      score: 11,
      maxScore: 20,
      status: "warning",
      description: "27% of users have 2FA enabled",
    },
    {
      name: "Session Security",
      score: 18,
      maxScore: 20,
      status: "good",
      description: "42 active sessions, 7 revoked",
    },
    {
      name: "Rate Limiting",
      score: 17,
      maxScore: 20,
      status: "good",
      description: "Effective rate limiting configured",
    },
    {
      name: "Blocklist Coverage",
      score: 20,
      maxScore: 20,
      status: "good",
      description: "11 blocked IPs, 6 blocked users",
    },
  ],
  stats: {
    totalUsers: users.length,
    usersWith2FA: security.reduce((n, s) => n + (s.totpEnabled ? 1 : 0), 0),
    activeSessions: sessions.filter((x) => x.status === "active").length,
    revokedSessions: sessions.filter((x) => x.status === "revoked").length,
    blockedIPs: blocklist.filter((b) => b.targetType === "ip" && b.isActive).length,
    blockedUsers: blocklist.filter((b) => b.targetType === "user" && b.isActive).length,
  },
  topIPs: Array.from({ length: 6 }, (_, i) => ({
    ip: ip(1500 + i),
    count: 240 - i * 31,
    lastSeen: minsAgo(i * 19 + 3),
  })),
  topEventTypes: SECURITY_KINDS.slice(0, 6).map((k, i) => ({
    type: k.kind,
    count: 96 - i * 13,
  })),
  recentCritical: securityEvents.filter((e) => e.severity === "critical").slice(0, 5),
};
