/* Platform switches. Three real homes today: app_config (a key/value blob),
   the notification rules that live beside it, and the feature flags whose
   endpoint answers 501 — the last one is a rebuild brief, not a read. */

import type { AppConfigRow, FeatureFlag, NotificationRule } from "./types";
import { daysAgo, hoursAgo, minsAgo, rng } from "./world";
import { users } from "./users";

export const appConfig: AppConfigRow[] = [
  ["signup.enabled", true, "Whether new accounts may be created at all"],
  ["signup.inviteOnly", false, "Require an invite code before signup"],
  ["auth.requireVerifiedEmail", true, "Block sign-in until the address is confirmed"],
  ["auth.sessionDays", 30, "How long a session lives before it must be renewed"],
  ["media.maxUploadMb", 25, "Largest single upload, in megabytes"],
  ["media.allowedMime", ["image/*", "video/mp4", "application/pdf"], "Accepted upload types"],
  ["digest.weeklyEnabled", true, "Send the Monday digest to everyone opted in"],
  ["search.indexedHandles", 12_480, "Handles currently in the search index"],
  ["legal.dataRetentionPolicyDays", 400, "How long raw events are kept"],
  ["turnstile.enabled", true, "Challenge the signup and sign-in endpoints"],
].map(([key, value, description], i) => ({
  key: key as string,
  value,
  description: description as string,
  updatedAt: daysAgo(i * 5 + 1),
}));

/** admin/settings and content/feature-flags both answer 501 — this is the
    list the screen asks for, and the shape a future endpoint should return. */
export const featureFlags: FeatureFlag[] = [
  ["reactions-threaded", "Reactions inside threads", "rollout", 35, "beta"],
  ["profile-pronouns", "Pronouns on the profile card", "on", 100, "platform"],
  ["push-digest", "Push for the weekly digest", "off", 0, "platform"],
  ["search-fuzzy", "Fuzzy handle search", "rollout", 10, "beta"],
  ["media-alt-text", "Ask for alt text on upload", "on", 100, "platform"],
  ["oauth-discord", "Sign in with Discord", "off", 0, "internal"],
  ["tip-jar", "Tip jar on profiles", "rollout", 60, "beta"],
  ["legacy-avatars", "The pre-redesign avatar plates", "off", 0, "internal"],
].map(([key, label, state, rollout, scope], i) => {
  const r = rng(33000 + i);
  return {
    key: key as string,
    label: label as string,
    state: state as string,
    rollout: rollout as number,
    scope: scope as FeatureFlag["scope"],
    /* A flag nobody remembers flipping is the incident report everyone dreads,
       so the row carries who and when. */
    updatedAt: hoursAgo(r.int(1, 24 * 40)),
    updatedBy: users[r.int(0, 2)]!.id,
  };
});

export const notificationRules: NotificationRule[] = [
  ["new_follower", "New follower", "Someone follows the account", ["inapp", "push"], true],
  ["reply", "Reply to your post", "A direct reply, one level down", ["inapp", "email", "push"], true],
  ["mention", "Mention", "An @ in someone else's post", ["inapp", "push"], true],
  ["tip", "Tip received", "Money arrived", ["inapp", "email"], true],
  ["digest_weekly", "Weekly digest", "A Monday summary of the account", ["email"], true],
  ["security_signin", "New sign-in", "A device or place we have not seen", ["inapp", "email", "push"], true],
  ["restriction", "Enforcement notice", "Something was done to the account", ["inapp", "email"], true],
  ["media_processed", "Media ready", "An upload finished transcoding", ["inapp"], false],
].map(([key, label, description, channels, enabled], i) => {
  const r = rng(34000 + i);
  return {
    key: key as string,
    label: label as string,
    description: description as string,
    channels: channels as NotificationRule["channels"],
    enabled: enabled as boolean,
    /* Reach is per rule: an operator deciding whether to widen one needs the
       denominator beside the toggle. */
    audience: Math.round(users.length * (0.3 + r.next() * 0.7)),
  };
});

export const heartbeat = {
  /* POST /api/admin/heartbeat is the only cron screen that exists: a job
     pings in and the console reads the gaps back out of cronSchedules. */
  secretSet: true,
  lastPingAt: minsAgo(6),
  windowHours: 24,
  missed: 1,
};
