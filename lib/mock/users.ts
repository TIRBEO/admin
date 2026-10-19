/* The account cluster: users, their profile rows, addresses, security,
   sessions, devices and login history. Everything else in the world file
   references these ids — a ticket, a restriction, an email job. */

import type {
  DataExportRequest,
  LoginMethod,
  Notification,
  PushSubscription,
  ReservedAddress,
  TirbeoIdentity,
  User,
  UserDeletionRequest,
  UserDevice,
  UserEmailRow,
  UserLogin,
  UserPhone,
  UserProfile,
  UserSecurity,
  UserSession,
} from "./types";
import {
  AGENTS,
  DOMAIN,
  LOCATIONS,
  USERS,
  daysAgo,
  hoursAgo,
  ip,
  minsAgo,
  ref,
  rng,
} from "./world";

export const users: User[] = USERS.map((seed) => ({
  id: seed.id,
  username: seed.username,
  email: seed.email,
  status: seed.status,
  isAdmin: seed.isAdmin,
  lastActiveAt: seed.status === "deleted" ? null : minsAgo(seed.minutesSinceActive),
  lastLoginAt: seed.status === "deleted" ? null : hoursAgo(Math.max(1, seed.minutesSinceActive / 90)),
  createdAt: daysAgo(seed.daysSinceSignup),
  updatedAt: minsAgo(seed.minutesSinceActive),
}));

const BIOS: Array<string | null> = [
  "Building small tools that do one thing.",
  "Writes about interfaces and weather.",
  "Photographer. Mostly of staircases.",
  "Runs a bookshop with two shelves.",
  null,
  "Interested in maps, margins and menus.",
  null,
];

export const profiles: UserProfile[] = users.map((user, i) => {
  const seed = USERS[i]!;
  const r = rng(2000 + i);
  return {
    userId: user.id,
    name: seed.name,
    bio: r.pick(BIOS),
    gender: r.chance(0.7) ? r.pick(["woman", "man", "non-binary", "undisclosed"]) : null,
    birthday: r.chance(0.8) ? `19${r.int(70, 99)}-0${r.int(1, 9)}-1${r.int(0, 9)}` : null,
    /* No avatar service is contacted: a fixture that pointed at a real CDN
       would make a UI-only build phone home. */
    photoUrl: r.chance(0.55) ? `https://avatar.${DOMAIN}/${user.id}.png` : null,
    bannerUrl: r.chance(0.2) ? `https://banner.${DOMAIN}/${user.id}.jpg` : null,
    pronouns: r.chance(0.35) ? r.pick(["she/her", "he/him", "they/them"]) : null,
    location: r.chance(0.7) ? r.pick(LOCATIONS) : null,
    website: r.chance(0.3) ? `https://${seed.username}.${DOMAIN}` : null,
    jobRole: r.chance(0.5) ? r.pick(["Designer", "Carpenter", "Teacher", "Nurse", "Baker"]) : null,
    jobCompany: r.chance(0.4) ? `Sample Works ${r.int(1, 40)}` : null,
    jobPlace: null,
    jobStarted: null,
    followers: r.int(0, 900),
    following: r.int(0, 400),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
});

export const userEmails: UserEmailRow[] = users.flatMap((user, i) => {
  const r = rng(3000 + i);
  const rows: UserEmailRow[] = [
    {
      id: `eml_${100 + i}`,
      userId: user.id,
      address: user.email,
      kind: "primary",
      /* An unverified primary is a real state a console has to show. */
      verifiedAt: user.status === "deletion_pending" ? null : minsAgo(r.int(30, 6000)),
      isDefault: true,
      createdAt: user.createdAt,
    },
  ];
  if (r.chance(0.3)) {
    rows.push({
      id: `eml_${200 + i}`,
      userId: user.id,
      address: `alt_${user.username}@tirbeo.test`,
      kind: "secondary",
      verifiedAt: r.chance(0.6) ? minsAgo(r.int(30, 6000)) : null,
      isDefault: false,
      createdAt: hoursAgo(r.int(1, 500)),
    });
  }
  return rows;
});

export const userPhones: UserPhone[] = users
  .map((user, i) => ({ user, i }))
  .filter(({ i }) => i % 3 !== 0)
  .map(({ user, i }) => {
    const r = rng(4000 + i);
    return {
      userId: user.id,
      number: `+1 555 0${r.int(10, 99)}`,
      verifiedAt: r.chance(0.75) ? minsAgo(r.int(60, 9000)) : null,
    };
  });

export const security: UserSecurity[] = users.map((user, i) => {
  const r = rng(5000 + i);
  const totp = r.chance(0.28);
  return {
    userId: user.id,
    totpEnabled: totp,
    backupCodes: totp ? Array.from({ length: 3 }, () => `sample-${r.int(1000, 9999)}`) : [],
    mustChangePw: r.chance(0.08),
    saveLoginInfo: r.chance(0.85),
    require2FA: user.isAdmin ? true : r.chance(0.05),
    passkeys: r.int(0, 2),
    updatedAt: user.updatedAt,
  };
});

export const sessions: UserSession[] = users.flatMap((user, i) => {
  const r = rng(6000 + i);
  const count = user.status === "active" ? r.int(1, 4) : r.int(0, 2);
  return Array.from({ length: count }, (_, n) => {
    const roll = r.next();
    const status: UserSession["status"] = roll < 0.15 ? "revoked" : roll < 0.35 ? "expired" : "active";
    return {
      id: `sess_${i}_${n}`,
      userId: user.id,
      status,
      ipAddress: ip(i * 7 + n),
      userAgent: r.pick(AGENTS),
      deviceName: r.pick(["MacBook Pro", "iPhone", "Pixel 9", "iPad Air", "Linux desktop"]),
      location: r.pick(LOCATIONS),
      createdAt: daysAgo(r.int(0, 40)),
      lastUsedAt: minsAgo(r.int(1, 60 * 24 * 6)),
      /* A future expiry written as a literal, not NOW + n: the fixture must
          still say "expires in 9 weeks" whatever date the build runs. */
      expiresAt: status === "expired" ? minsAgo(r.int(10, 900)) : "2026-12-31T00:00:00.000Z",
      revokedAt: status === "revoked" ? minsAgo(r.int(10, 4000)) : null,
    };
  });
});

export const devices: UserDevice[] = users.flatMap((user, i) => {
  const r = rng(7000 + i);
  return Array.from({ length: r.int(1, 3) }, (_, n) => ({
    id: `dev_${i}_${n}`,
    userId: user.id,
    deviceName: r.pick(["MacBook Pro", "iPhone 16", "Pixel 9", "iPad Air", "Work desktop"]),
    userAgent: r.pick(AGENTS),
    ipAddress: ip(i * 11 + n),
    location: r.pick(LOCATIONS),
    status: r.chance(0.1) ? "revoked" : "active",
    createdAt: daysAgo(r.int(10, 300)),
    lastUsedAt: minsAgo(r.int(1, 60 * 24 * 20)),
  }));
});

const METHODS: LoginMethod[] = ["password", "google", "github", "magic", "passkey", "otp"];

export const logins: UserLogin[] = users.flatMap((user, i) => {
  const r = rng(8000 + i);
  return Array.from({ length: r.int(2, 7) }, (_, n) => ({
    id: `log_${i}_${n}`,
    userId: user.id,
    method: r.pick(METHODS),
    success: r.chance(0.86),
    ipAddress: ip(i * 13 + n),
    userAgent: r.pick(AGENTS),
    location: r.pick(LOCATIONS),
    createdAt: minsAgo(r.int(1, 60 * 24 * 21)),
  }));
});

export const identities: TirbeoIdentity[] = users.map((user, i) => ({
  id: `idt_${100 + i}`,
  userId: user.id,
  username: user.username ?? `sample_${i}`,
  email: user.email,
  verifiedSource: i % 5 === 0 ? null : "email",
  verifiedAt: i % 5 === 0 ? null : user.createdAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
}));

/** admin/reserved-addresses answers 501; this is the list it will need. */
export const reservedAddresses: ReservedAddress[] = (
  [
    ["admin", "Reserved for the console operator"],
    ["root", "Reserved — system account"],
    ["tirbeo", "Reserved for the brand handle"],
    ["support", "Reserved for the helpdesk"],
    ["abuse", "Reserved for abuse reports"],
    ["noreply", "Reserved for outbound mail"],
    ["www", "Reserved — host name collision"],
    ["api", "Reserved — host name collision"],
    ["security", "Reserved for the disclosure address"],
    ["billing", "Reserved for the payment receipt sender"],
  ] as const
).map(([username, reason], i) => ({
  id: `rsv_${100 + i}`,
  username,
  reason,
  heldBy: i < 2 ? users[0]!.id : null,
  createdAt: daysAgo(400 - i * 9),
}));

export const deletionRequests: UserDeletionRequest[] = users
  .filter((u) => u.status === "deletion_pending")
  .map((user, i) => ({
    id: `del_${100 + i}`,
    userId: user.id,
    reason: "Asked for a copy of their data first",
    requestedAt: minsAgo(60 * 24 * 3),
    finalAt: "2026-11-01T00:00:00.000Z",
    cancelledAt: null,
    executedAt: null,
  }));

const NOTIF_TYPES: Array<[string, string]> = [
  ["profile.viewed", "Someone viewed your profile"],
  ["new.follower", "New follower"],
  ["tip.received", "Received a tip"],
  ["security.ip", "New sign-in from an unfamiliar place"],
  ["digest.weekly", "Your week in review"],
];

export const notifications: Notification[] = users.flatMap((user, i) => {
  const r = rng(9000 + i);
  return Array.from({ length: r.int(0, 6) }, (_, n) => {
    const [type, title] = r.pick(NOTIF_TYPES);
    return {
      id: `nt_${i}_${n}`,
      userId: user.id,
      type,
      title,
      body: r.chance(0.8) ? `Fixture notification ${n + 1} for ${user.username}.` : null,
      icon: r.chance(0.6) ? "bell" : null,
      link: r.chance(0.7) ? `/u/${user.username}` : null,
      isRead: r.chance(0.55),
      createdAt: minsAgo(r.int(1, 60 * 24 * 12)),
    };
  });
});

export const pushSubscriptions: PushSubscription[] = users.flatMap((user, i) => {
  const r = rng(9500 + i);
  return Array.from({ length: r.int(0, 2) }, (_, n) => ({
    id: `ps_${i}_${n}`,
    userId: user.id,
    /* A real web-push endpoint is a provider URL; a fixture must not be. */
    endpoint: `https://push.${DOMAIN}/subscriptions/${user.id}-${n}`,
    userAgent: r.pick(AGENTS),
    createdAt: daysAgo(r.int(1, 200)),
    lastUsedAt: minsAgo(r.int(1, 60 * 24 * 8)),
  }));
});

export const exportRequests: DataExportRequest[] = users.flatMap((user, i) => {
  const r = rng(9700 + i);
  if (!r.chance(0.35)) return [];
  const status = r.chance(0.15) ? "failed" : r.chance(0.85) ? "ready" : "pending";
  return [
    {
      id: `exp_${100 + i}`,
      userId: user.id,
      format: r.pick(["json", "html"]),
      status,
      fileName: `tirbeo-${user.username}.${status === "ready" ? "zip" : "json"}`,
      bytes: status === "ready" ? r.int(40_000, 9_000_000) : null,
      counts: status === "ready" ? { profile: 1, posts: r.int(0, 320), media: r.int(0, 60) } : null,
      error: status === "failed" ? "Archive build timed out after 30 s" : null,
      requestedAt: minsAgo(r.int(5, 60 * 24 * 30)),
      builtAt: status === "pending" ? null : minsAgo(r.int(1, 60 * 24 * 29)),
    },
  ];
});

/** The person every screen links into from everywhere else. */
export const PRIMARY_USER_ID = users[0]!.id;
export const PRIMARY_USER_REF = ref(PRIMARY_USER_ID);
