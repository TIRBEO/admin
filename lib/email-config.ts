import { apiFailure, apiGet, apiSend, errorMessage } from "@/lib/api";
import type { Load } from "@/lib/load-state";

import type { EmailConfigRow, SecretsPresence } from "@/lib/types";

/** The Email config screen's read: GET /api/admin/email/config.
 *
 *  Tirbeo sends from several verified domains and gives each kind of mail its
 *  own alias — the welcome mail and the password reset do not come from the
 *  same address. Those aliases are the whole point of this row, so the screen
 *  reads as a table of roles: what each kind of mail comes from, straight off
 *  the columns the door returns.
 *
 *  Two things this file is strict about:
 *
 *  — Secrets never leave it. The door returns the real `resendApiKey` and
 *    `smtpPass` in the row; they are read here only to answer "is a key set?"
 *    and are stripped before anything reaches a page or a client prop.
 *
 *  — "Never configured" is its own answer, not an empty form. With no row the
 *    door replies a hardcoded four-key stub (no `id`) whose values are the
 *    schema's defaults, not an operator's decisions; drawing them as settings,
 *    or offering a save that would write defaults, would put invented facts on
 *    the screen. So that reply becomes `{ kind: "unset" }`. */

type ApiConfig = {
  id?: string;
  provider?: string;
  resendApiKey?: string | null;
  resendDomain?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
  defaultFromEmail?: string;
  defaultFromName?: string;
  welcomeFromEmail?: string | null;
  welcomeFromName?: string | null;
  otpFromEmail?: string | null;
  otpFromName?: string | null;
  resetFromEmail?: string | null;
  resetFromName?: string | null;
  notifyFromEmail?: string | null;
  notifyFromName?: string | null;
  alertFromEmail?: string | null;
  alertFromName?: string | null;
  formsFromEmail?: string | null;
  formsFromName?: string | null;
  customDomain?: string | null;
  dkimEnabled?: boolean;
  enabled?: boolean;
  updatedAt?: string;
};

export type EmailConfigView =
  | { kind: "unset" }
  | { kind: "set"; config: EmailConfigRow; secrets: SecretsPresence };

export async function readEmailConfig(): Promise<Load<EmailConfigView>> {
  const result = await apiGet<ApiConfig>("/admin/email/config");

  if (!result.ok) return apiFailure(result);
  const data = result.data;
  if (!data || typeof data !== "object") {
    return { status: "error", message: "The API answered with no configuration in it." };
  }

  // The stub reply has no `id`; only a real row does. That is the difference
  // between "the operator never set this up" and "the provider is configured".
  if (!data.id) return { status: "ready", data: { kind: "unset" } };

  const config: EmailConfigRow = {
    id: data.id,
    provider: data.provider ?? "resend",
    resendDomain: data.resendDomain ?? null,
    smtpHost: data.smtpHost ?? null,
    smtpPort: data.smtpPort ?? null,
    smtpUser: data.smtpUser ?? null,
    defaultFromEmail: data.defaultFromEmail ?? "",
    defaultFromName: data.defaultFromName ?? "",
    welcomeFromEmail: data.welcomeFromEmail ?? null,
    welcomeFromName: data.welcomeFromName ?? null,
    otpFromEmail: data.otpFromEmail ?? null,
    otpFromName: data.otpFromName ?? null,
    resetFromEmail: data.resetFromEmail ?? null,
    resetFromName: data.resetFromName ?? null,
    notifyFromEmail: data.notifyFromEmail ?? null,
    notifyFromName: data.notifyFromName ?? null,
    alertFromEmail: data.alertFromEmail ?? null,
    alertFromName: data.alertFromName ?? null,
    formsFromEmail: data.formsFromEmail ?? null,
    formsFromName: data.formsFromName ?? null,
    customDomain: data.customDomain ?? null,
    dkimEnabled: data.dkimEnabled ?? false,
    enabled: data.enabled ?? true,
    updatedAt: data.updatedAt ?? "",
  };

  // Presence only — the value is read to decide a word and then dropped.
  const secrets: SecretsPresence = {
    resendApiKeySet: !!data.resendApiKey,
    smtpPassSet: !!data.smtpPass,
  };

  return { status: "ready", data: { kind: "set", config, secrets } };
}

/** The kind of mail and the alias it comes from, as the screen reads it. This
 *  is the table the row is really about — every one of these is a column the
 *  door returned, not a label we chose. */
export function senderRoles(config: EmailConfigRow): Array<{ kind: string; email: string | null; name: string | null }> {
  return [
    { kind: "Default", email: config.defaultFromEmail, name: config.defaultFromName },
    { kind: "Welcome", email: config.welcomeFromEmail, name: config.welcomeFromName },
    { kind: "One-time code", email: config.otpFromEmail, name: config.otpFromName },
    { kind: "Password reset", email: config.resetFromEmail, name: config.resetFromName },
    { kind: "Notification", email: config.notifyFromEmail, name: config.notifyFromName },
    { kind: "Alert", email: config.alertFromEmail, name: config.alertFromName },
    { kind: "Forms", email: config.formsFromEmail, name: config.formsFromName },
  ];
}

export type ConfigInput = {
  provider: string;
  apiKey: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
};

export type WriteResult = { ok: true } | { ok: false; message: string };

/** Save the provider settings: PUT /api/admin/email/config.
 *
 *  The door's PUT overwrites `resendApiKey` and `smtpPass` with whatever it is
 *  sent — a blank would erase a key that works. Since a secret is never echoed
 *  to the browser, an operator leaving the field blank means "keep it", not
 *  "remove it". So this reads the stored values server-side first and reuses
 *  them for any blank field, which preserves the secret without ever rendering
 *  it. */
export async function saveEmailConfig(input: ConfigInput): Promise<WriteResult> {
  const current = await apiGet<ApiConfig>("/admin/email/config");
  const storedKey = current.data?.resendApiKey ?? null;
  const storedPass = current.data?.smtpPass ?? null;

  const payload = {
    provider: input.provider || "resend",
    apiKey: input.apiKey.trim() || storedKey,
    smtpHost: input.smtpHost.trim() || null,
    smtpPort: input.smtpPort.trim() ? Number(input.smtpPort) : null,
    smtpUser: input.smtpUser.trim() || null,
    smtpPass: input.smtpPass.trim() || storedPass,
    fromEmail: input.fromEmail.trim() || "noreply@tirbeo.com",
    fromName: input.fromName.trim() || "Tirbeo",
  };

  const result = await apiSend<ApiConfig>("/admin/email/config", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return result.ok ? { ok: true } : { ok: false, message: errorMessage(result) };
}
