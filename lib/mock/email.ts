/* Outbound mail: the template registry, the queue, what the provider said
   back, the sender configuration, and the inbound side. */

import type {
  BroadcastInput,
  BroadcastPreview,
  EmailConfigRow,
  EmailDelivery,
  EmailJob,
  EmailTemplate,
  InboundEmail,
  SecretsPresence,
} from "./types";
import { SEND_DOMAIN, daysAgo, hoursAgo, minsAgo, minsAhead, rng } from "./world";
import { users } from "./users";

/* The queue's templateSlug column points at these, so the registry is
   declared first and every job is built from a slug that exists. */
const REGISTRY: Array<{
  slug: string;
  label: string;
  subject: string;
  kind: EmailJob["kind"];
  category: string;
  variables: string[];
}> = [
  {
    slug: "otp-email",
    label: "Sign-in code (email)",
    subject: "Your Tirbeo code",
    kind: "otp",
    category: "auth",
    variables: ["name", "code", "minutes"],
  },
  {
    slug: "verify-email",
    label: "Confirm address",
    subject: "Confirm your email address",
    kind: "verify",
    category: "auth",
    variables: ["name", "link", "hours"],
  },
  {
    slug: "reset-password",
    label: "Password reset",
    subject: "Reset your password",
    kind: "reset",
    category: "security",
    variables: ["name", "link", "hours"],
  },
  {
    slug: "weekly-digest",
    label: "Weekly digest",
    subject: "Your week on Tirbeo",
    kind: "digest",
    category: "digest",
    variables: ["name", "highlights", "count"],
  },
  {
    slug: "restriction-notice",
    label: "Enforcement notice",
    subject: "A change to your account",
    kind: "notice",
    category: "safety",
    variables: ["name", "title", "guideline", "endsAt"],
  },
  {
    slug: "appeal-decision",
    label: "Appeal decision",
    subject: "Your appeal has been reviewed",
    kind: "notice",
    category: "safety",
    variables: ["name", "decision", "title"],
  },
  {
    slug: "new-signin-alert",
    label: "New sign-in alert",
    subject: "Your account signed in from a new place",
    kind: "notice",
    category: "security",
    variables: ["name", "where", "when", "ip"],
  },
  {
    slug: "export-ready",
    label: "Data export ready",
    subject: "Your archive is ready",
    kind: "notice",
    category: "privacy",
    variables: ["name", "link", "days"],
  },
  {
    slug: "deletion-warning",
    label: "Deletion scheduled",
    subject: "Your account will be deleted in 30 days",
    kind: "notice",
    category: "privacy",
    variables: ["name", "finalAt", "link"],
  },
  {
    slug: "broadcast-plain",
    label: "Operator broadcast",
    subject: "{{subject}}",
    kind: "notice",
    category: "growth",
    variables: ["name", "subject", "body"],
  },
];

export const emailTemplates: EmailTemplate[] = REGISTRY.map((entry, i) => ({
  id: `tpl_${100 + i}`,
  slug: entry.slug,
  label: entry.label,
  subject: entry.subject,
  /* A short body per template: the screen renders it, so it has to be
     readable markup rather than a placeholder string. */
  html: `<p>Hi {{name}},</p>\n<p>Sample ${entry.label.toLowerCase()} body.</p>\n<p>Tirbeo</p>`,
  variables: entry.variables,
  createdAt: daysAgo(300 - i * 7),
  updatedAt: daysAgo(i * 3),
}));

export const templateSlugs = REGISTRY.map((r) => r.slug);

export const emailJobs: EmailJob[] = Array.from({ length: 40 }, (_, i) => {
  const r = rng(22000 + i);
  const tpl = r.pick(REGISTRY);
  const owner = r.chance(0.9) ? users[r.int(0, users.length - 1)]! : null;
  /* The failing rows are the point of the screen, so three are pinned at
     the front rather than left to land anywhere in the list. */
  const pinned = i < 3;
  const status = pinned ? "failed" : r.pick(["sent", "sent", "queued", "running", "dropped", "failed"]);
  const createdAt = pinned ? hoursAgo(i + 1) : minsAgo(i * 11 + r.int(0, 9));
  return {
    id: `ej_${1000 + i}`,
    userId: owner?.id ?? null,
    dedupeKey: `${tpl.slug}:${owner?.id ?? "anon"}:${i}`,
    eventKey: tpl.slug,
    toEmail: owner?.email ?? `anonymous_${i}@example.invalid`,
    toAddress: owner?.username ?? `curious_${i}`,
    category: tpl.category,
    priority: tpl.kind === "otp" || tpl.kind === "reset" ? "high" : r.pick(["normal", "low"]),
    kind: tpl.kind,
    templateSlug: tpl.slug,
    subject: tpl.subject,
    status,
    attempts: status === "failed" ? tpl.kind === "otp" ? 3 : r.int(1, 3) : status === "queued" ? 0 : r.int(1, 2),
    maxAttempts: 3,
    lastError:
      status === "failed"
        ? r.pick([
            "550 5.1.1 No mailbox by that name",
            "provider timeout after 10000ms",
            "429 too many requests from this IP",
          ])
        : status === "dropped"
          ? "suppressed: address unsubscribed"
          : null,
    availableAt: status === "queued" ? minsAhead(r.int(1, 30)) : createdAt,
    processedAt: status === "queued" ? null : minsAgo(r.int(1, 60)),
    sentAt: status === "sent" ? minsAgo(r.int(1, 55)) : null,
    createdAt,
  };
});

export const emailDeliveries: EmailDelivery[] = Array.from({ length: 52 }, (_, i) => {
  const r = rng(23000 + i);
  const tpl = r.pick(REGISTRY);
  const owner = r.chance(0.85) ? users[r.int(0, users.length - 1)]! : null;
  const status = r.pick(["delivered", "delivered", "delivered", "opened", "bounced", "failed"]);
  const createdAt = minsAgo(i * 41 + r.int(0, 30));
  return {
    id: `ed_${1000 + i}`,
    jobId: `ej_${1000 + (i % 40)}`,
    userId: owner?.id ?? null,
    toEmail: owner?.email ?? `anonymous_${i}@example.invalid`,
    eventKey: tpl.slug,
    event: tpl.label,
    category: tpl.category,
    subject: tpl.subject,
    status,
    provider: r.pick(["resend", "smtp"]),
    providerId: `prov_${r.int(100000, 999999)}`,
    messageId: `<${r.int(1000, 9999)}.${i}@${SEND_DOMAIN}>`,
    openedAt: status === "opened" ? minsAgo(r.int(1, 300)) : null,
    clickedAt: status === "opened" && r.chance(0.4) ? minsAgo(r.int(1, 200)) : null,
    createdAt,
  };
});

/** Secrets are presence-only. A screen that shows a key is a screen that
    gets screenshotted. */
export const emailConfig: EmailConfigRow = {
  id: "cfg_100",
  provider: "resend",
  resendDomain: SEND_DOMAIN,
  smtpHost: `smtp.${SEND_DOMAIN}`,
  smtpPort: 587,
  smtpUser: `postmaster@${SEND_DOMAIN}`,
  defaultFromEmail: `noreply@${SEND_DOMAIN}`,
  defaultFromName: "Tirbeo",
  welcomeFromEmail: `welcome@${SEND_DOMAIN}`,
  welcomeFromName: "Tirbeo",
  otpFromEmail: `codes@${SEND_DOMAIN}`,
  otpFromName: "Tirbeo codes",
  resetFromEmail: `reset@${SEND_DOMAIN}`,
  resetFromName: "Tirbeo",
  notifyFromEmail: `notify@${SEND_DOMAIN}`,
  notifyFromName: "Tirbeo",
  alertFromEmail: `alerts@${SEND_DOMAIN}`,
  alertFromName: "Tirbeo alerts",
  formsFromEmail: `forms@${SEND_DOMAIN}`,
  formsFromName: "Tirbeo Forms",
  customDomain: null,
  dkimEnabled: false,
  enabled: true,
  updatedAt: daysAgo(11),
};

export const emailSecrets: SecretsPresence = {
  resendApiKeySet: true,
  smtpPassSet: false,
};

export const inboundEmails: InboundEmail[] = Array.from({ length: 14 }, (_, i) => {
  const r = rng(24000 + i);
  const kind = r.pick(["message", "message", "bounce", "autoreply", "spam"]);
  const owner = r.chance(0.7) ? users[r.int(0, users.length - 1)]! : null;
  return {
    id: `inb_${100 + i}`,
    from: owner?.email ?? `stranger_${i}@example.invalid`,
    to: kind === "bounce" ? `noreply@${SEND_DOMAIN}` : `support@${SEND_DOMAIN}`,
    subject:
      kind === "bounce"
        ? "Delivery Status Notification (Failure)"
        : kind === "autoreply"
          ? "Out of office"
          : r.pick(["Re: your reply", "Question about my export", "Is this the right address?", "Thank you"]),
    excerpt:
      kind === "bounce"
        ? "550 no such user here"
        : kind === "autoreply"
          ? "I am away until the 31st."
          : "Sample inbound body, two sentences long, so the row can be read at a glance.",
    kind,
    status: r.pick(["new", "new", "read", "linked"]),
    /* A reply is only useful once it can be tied back to a thread. */
    ticketId: r.chance(0.4) ? `t_${2001 + r.int(0, 17)}` : null,
    userId: owner?.id ?? null,
    receivedAt: hoursAgo(r.int(1, 24 * 9)),
  };
});

const SEGMENTS = ["all", "active-30d", "verified-email", "admins", "deletion-pending"] as const;

/** Deterministic from the fixtures: the same segment always previews the
    same audience, so an operator can sanity-check the maths. */
export function previewBroadcast(input: BroadcastInput): BroadcastPreview {
  const eligible = users.filter((u) => u.status !== "deleted" && u.status !== "banned");
  const audience =
    input.segment === "admins"
      ? eligible.filter((u) => u.isAdmin).length
      : input.segment === "deletion-pending"
        ? eligible.filter((u) => u.status === "deletion_pending").length
        : input.segment === "verified-email"
          ? eligible.length
          : input.segment === "active-30d"
            ? Math.round(eligible.length * 0.72)
            : eligible.length;

  return {
    audience,
    segments: SEGMENTS.map((label) => ({
      label,
      count: label === input.segment ? audience : 0,
    })),
    /* The two numbers a broadcast can quietly get wrong: who said no, and
        who is suppressed by policy rather than preference. */
    optOuts: 2,
    suppressed: eligible.filter((u) => u.status === "restricted").length,
    throttle: Array.from({ length: 6 }, (_, h) => ({
      label: `${String((9 + h) % 24).padStart(2, "0")}:00`,
      count: Math.max(0, Math.round(audience / 6) - (h === 0 ? 1 : 0)),
    })),
  };
}

export const BROADCAST_SEGMENTS: string[] = [...SEGMENTS];
