/* The helpdesk, the inbox of product feedback, the billing stub and the
   landing page's waitlist — four different owners' data, one screen each. */

import type {
  FeedbackRow,
  Subscriber,
  Ticket,
  TicketAttachment,
  TicketMessage,
  TicketPriority,
  TicketStatus,
  WaitlistEntry,
} from "./types";
import { DOMAIN, daysAgo, hoursAgo, minsAgo, rng } from "./world";
import { users } from "./users";

const CATEGORIES = [
  "account",
  "sign-in",
  "privacy",
  "media",
  "billing",
  "reports",
  "feature request",
  "bug",
] as const;

const SUBJECTS = [
  "Cannot receive the sign-in code",
  "Request to download my data before deleting",
  "Photos upload but do not appear",
  "Charged twice for the same month",
  "Someone is impersonating me",
  "Please add a keyboard shortcut for posting",
  "Dark mode flickers on the profile page",
  "Email digest arrived eight times",
  "Change the handle on my account",
  "Report: repeated harassment in replies",
  "Exported archive would not open",
  "Two-factor codes out of sync",
] as const;

const ADMIN_IDS = users.filter((u) => u.isAdmin).map((u) => u.id);

export const tickets: Ticket[] = Array.from({ length: 18 }, (_, i) => {
  const r = rng(16000 + i);
  const status: TicketStatus = r.chance(0.4) ? "open" : r.chance(0.6) ? "pending" : r.chance(0.7) ? "resolved" : "closed";
  const priority: TicketPriority = r.pick(["low", "normal", "normal", "high", "urgent"]);
  const requester = users[r.int(3, users.length - 1)]!;
  const createdAt = hoursAgo(r.int(2, 24 * 26));
  const answered = status !== "open" || r.chance(0.5);
  return {
    id: `t_${2001 + i}`,
    subject: r.pick(SUBJECTS),
    category: r.pick(CATEGORIES),
    status,
    priority,
    requesterId: requester.id,
    /* An unassigned open ticket is the row an operator is meant to notice. */
    assigneeId: status === "open" && r.chance(0.4) ? null : r.pick(ADMIN_IDS),
    unreadForAdmin: status === "open" && r.chance(0.5),
    firstResponseAt: answered ? hoursAgo(r.int(1, 20)) : null,
    /* The SLA the priority implies, so "urgent" and "overdue" can disagree
        on screen and be visible as a problem. */
    dueAt:
      status === "resolved" || status === "closed"
        ? createdAt
        : priority === "urgent"
          ? minsAgo(r.int(0, 400))
          : `2026-10-2T00:00:00.000Z`,
    createdAt,
    updatedAt: hoursAgo(r.int(0, 22)),
  };
});

const CUSTOMER_BODIES = [
  "It started yesterday and I cannot get past the code screen. I have tried three addresses.",
  "I would like the archive before the deletion window closes. Thank you.",
  "Uploads report success but the post shows nothing. Restarted twice.",
  "Here is what I see on my side, with the times.",
];

const ADMIN_BODIES = [
  "Thanks for the detail — I can see the delivery failing on our side. Retrying now.",
  "I have queued the export; the link will arrive by email and stay live for seven days.",
  "Could you tell me which browser this is in? Nothing on our end shows a failure.",
  "Escalated to the provider. Nothing is charged twice from here; I will confirm shortly.",
];

export const ticketMessages: TicketMessage[] = tickets.flatMap((ticket, i) => {
  const r = rng(17000 + i);
  const turns = ticket.status === "open" ? r.int(1, 2) : r.int(2, 5);
  return Array.from({ length: turns }, (_, n) => {
    const fromAdmin = n % 2 === 1;
    return {
      id: `msg_${i}_${n}`,
      ticketId: ticket.id,
      authorId: fromAdmin ? ticket.assigneeId : ticket.requesterId,
      fromAdmin,
      body: fromAdmin ? r.pick(ADMIN_BODIES) : r.pick(CUSTOMER_BODIES),
      createdAt: n === 0 ? ticket.createdAt : hoursAgo(r.int(1, 40) + n),
    };
  });
});

export const ticketAttachments: TicketAttachment[] = tickets
  .filter((_, i) => i % 3 === 0)
  .map((ticket, i) => {
    const r = rng(18000 + i);
    return {
      id: `att_${100 + i}`,
      ticketId: ticket.id,
      name: r.pick(["screenshot.png", "console.log", "receipt.pdf", "screen-recording.mov"]),
      bytes: r.int(24_000, 9_000_000),
      mimeType: r.pick(["image/png", "text/plain", "application/pdf", "video/quicktime"]),
      createdAt: ticket.createdAt,
    };
  });

/* The rail links straight at this thread, so its first row is pinned
   rather than left to the dice: it has to be the one worth reading. */
tickets[0] = {
  ...tickets[0]!,
  status: "open",
  priority: "urgent",
  assigneeId: null,
  unreadForAdmin: true,
  firstResponseAt: null,
};

export const PRIMARY_TICKET_ID = tickets[0]!.id;

const FEEDBACK_KINDS = [
  "feedback.profile",
  "feedback.article",
  "feedback.onboarding",
  "feedback.search",
  "feedback.report",
] as const;

export const feedback: FeedbackRow[] = Array.from({ length: 26 }, (_, i) => {
  const r = rng(19000 + i);
  const kind = r.pick(FEEDBACK_KINDS);
  const owner = r.chance(0.8) ? users[r.int(0, users.length - 1)]! : null;
  const hasComment = r.chance(0.65);
  return {
    id: `fb_${100 + i}`,
    userId: owner?.id ?? null,
    kind,
    source: r.pick(["web", "ios", "android"]),
    /* The page the person was standing on, which is the half that makes a
        report actionable. */
    page: r.pick(["/u/sample_a", "/settings/profile", "/help/articles/export", "/onboarding/2", "/search"]),
    articleId: kind === "feedback.article" ? `art_${r.int(10, 40)}` : null,
    vote: r.chance(0.6) ? r.pick(["up", "down"]) : null,
    rating: r.chance(0.4) ? r.int(1, 5) : null,
    comment: hasComment
      ? r.pick([
          "The button did not look pressed, so I clicked it again and it doubled.",
          "Wanted this two years ago. Please never take it away.",
          "Took me four tries to find where to change the handle.",
          "Works, but the wording on the second step is confusing.",
        ])
      : null,
    status: r.pick(["open", "open", "triaged", "fixed", "wont_fix"]),
    createdAt: hoursAgo(r.int(1, 24 * 40)),
  };
});

/** admin/subscribers answers an empty array; this is what a billing
    provider would hand back, so the screen is a real brief. */
export const subscribers: Subscriber[] = users
  .filter((_, i) => i % 4 === 1)
  .map((user, i) => {
    const r = rng(20000 + i);
    const status = r.pick(["active", "active", "active", "trialing", "past_due", "cancelled"]);
    const interval = r.pick(["month", "month", "year"]) as Subscriber["interval"];
    return {
      id: `sub_${100 + i}`,
      userId: user.id,
      plan: r.pick(["Tirbeo Plus", "Tirbeo Pro", "Tirbeo Team"]),
      status,
      provider: r.pick(["stripe", "paddle", "local"]),
      amountCents: r.pick([490, 990, 1900, 4900]),
      currency: "USD",
      interval,
      seats: interval === "month" ? 1 : r.int(1, 12),
      currentPeriodEnd: "2026-11-1T00:00:00.000Z",
      startedAt: daysAgo(r.int(30, 700)),
    };
  });

/** The store is apps/landing/app/api/waitlist — not the API. */
export const waitlist: WaitlistEntry[] = Array.from({ length: 34 }, (_, i) => {
  const r = rng(21000 + i);
  const status = r.pick(["pending", "pending", "pending", "invited", "joined", "blocked"]);
  return {
    id: `wl_${1000 + i}`,
    email: `curious_${i}@example.invalid`,
    source: r.pick(["landing", "referral", "twitter", "friend", "press", "direct", null]),
    status,
    /* Position is the queue's own order, so a screen can show that an
        invite skipped ahead of it and be honest about why. */
    position: i + 1,
    invitedAt: status === "invited" || status === "joined" ? daysAgo(r.int(1, 20)) : null,
    createdAt: daysAgo(45 - Math.min(40, i)),
  };
});

export const waitlistStats = {
  total: waitlist.length,
  pending: waitlist.filter((w) => w.status === "pending").length,
  invited: waitlist.filter((w) => w.status === "invited").length,
  joined: waitlist.filter((w) => w.status === "joined").length,
  blocked: waitlist.filter((w) => w.status === "blocked").length,
  bySource: [...new Set(waitlist.map((w) => w.source ?? "unknown"))].map((source) => ({
    label: source as string,
    value: waitlist.filter((w) => (w.source ?? "unknown") === source).length,
  })),
};

/** A sample render the compose screen shows without contacting a provider. */
export const SAMPLE_PREVIEW_HTML = `
  <div style="font:15px/1.5 -apple-system,system-ui,sans-serif;color:#171717">
    <p>Hi Sample Person,</p>
    <p>Your sign-in code is <strong>402 118</strong>. It expires in 10 minutes.</p>
    <p>If you did not ask for this, nothing else needs to happen.</p>
  </div>`;

export const ABUSE_INBOX = `abuse@${DOMAIN}`;
