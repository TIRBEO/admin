"use client";

import Link from "next/link";
import { AlertTriangle, Loader2, UserPlus } from "lucide-react";
import { useState } from "react";

import { Panel, Pill } from "@/components/page-header";
import type { RoleChoice } from "@/components/staff-role-picker";
import type { CreatedAccount } from "@/lib/person";

/* ═══════════════════════════════════════════════════════════════════
   Provisioning an account

   The door behind this form has two flows and they are not the same
   decision. A Tirbeo handle becomes the account's identity — `handle`
   becomes `handle@tirbeo.com`, which is what the person signs in with, and
   an external address can only ever ride along as a recovery mailbox. An
   email with no handle creates the older kind of account, on that address.
   So the form asks for one or the other and says which one it is writing.

   What comes back after a create is the API's answer, and one part of it is
   not recoverable: the temporary password exists only in this response, so
   the plate below prints that fact next to the password rather than leaving
   an operator to discover it when the account will not sign in.
   ═══════════════════════════════════════════════════════════════════ */

type Created = { data: CreatedAccount; viaIdentity: boolean };

export function PersonCreateForm({ roles }: { roles: RoleChoice[] }) {
  const [state, setState] = useState<"idle" | "sending">("idle");
  const [created, setCreated] = useState<Created | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [needsOne, setNeedsOne] = useState(false);

  async function submit(form: HTMLFormElement) {
    const value = (key: string) => {
      const raw = new FormData(form).get(key);
      return typeof raw === "string" ? raw.trim() : "";
    };

    const username = value("username");
    const email = value("email");
    setNeedsOne(!username && !email);
    if (!username && !email) return;

    const level = value("adminRole");
    setState("sending");
    setRefusal(null);

    const payload = {
      username: username || undefined,
      email: email || undefined,
      name: value("name") || undefined,
      recoveryEmail: value("recoveryEmail") || undefined,
      adminRole: level || null,
      sendEmail: value("sendEmail") !== "off",
    };

    try {
      const res = await fetch("/api/people/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as CreatedAccount | { error?: string } | null;

      if (!res.ok) {
        setState("idle");
        setRefusal(
          (json as { error?: string } | null)?.error ??
            (res.status === 0
              ? "The console never answered."
              : `The console answered ${res.status}.`),
        );
        return;
      }

      const data = json as CreatedAccount;
      setCreated({ data, viaIdentity: Boolean(data.user?.username) });
    } catch {
      setState("idle");
      setRefusal("The console never answered. Nothing was created — try again.");
    } finally {
      setState("idle");
    }
  }

  if (created) return <CreatedPlate created={created} onAnother={() => setCreated(null)} />;

  const input =
    "h-9 w-full min-w-0 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:outline-none";
  const label = "block text-[12px] font-medium tracking-[-0.01em] text-[var(--muted)]";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Panel title="Account" hint="A Tirbeo handle or an email — one of them is the identity.">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(e.currentTarget);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={label} htmlFor="username">
                Tirbeo handle
              </label>
              <input id="username" name="username" type="text" placeholder="sample_a" className={input} />
              <p className="text-[12px] leading-snug text-[var(--muted)]">
                Letters, digits, dots, dashes or underscores. The account signs in as{" "}
                <code className="text-[var(--text-2)]">handle@tirbeo.com</code>.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={label} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="ada@example.invalid"
                className={input}
              />
              <p className="text-[12px] leading-snug text-[var(--muted)]">
                Only the identity when there is no handle. Beside a handle it must be the address
                that handle derives, or the door refuses the create.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={label} htmlFor="name">
                Display name
              </label>
              <input id="name" name="name" type="text" placeholder="Sample Person A" className={input} />
              <p className="text-[12px] leading-snug text-[var(--muted)]">
                Left blank with a handle, the handle is the name.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={label} htmlFor="recoveryEmail">
                Recovery email
              </label>
              <input
                id="recoveryEmail"
                name="recoveryEmail"
                type="email"
                placeholder="ada@example.invalid"
                className={input}
              />
              <p className="text-[12px] leading-snug text-[var(--muted)]">
                A mailbox, never a login. With a handle, this is where the onboarding mail goes.
              </p>
            </div>
          </div>

          {roles.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <label className={label} htmlFor="adminRole">
                Staff role
              </label>
              <select id="adminRole" name="adminRole" defaultValue="" className={input}>
                <option value="">Not staff — an ordinary account</option>
                {roles.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
              <p className="text-[12px] leading-snug text-[var(--muted)]">
                Starting an account on the roster is an owner&apos;s act. From anybody else the API refuses
                the role and says so on this form; the powers behind the name are on the Staff screen.
              </p>
            </div>
          ) : null}

          <label className="flex items-start gap-2.5 rounded-[14px] bg-[var(--surface-2)] px-3.5 py-3">
            <input type="checkbox" name="sendEmail" defaultChecked className="mt-0.5" />
            <span className="text-[13px] text-[var(--fg)]">
              Send the welcome mail
              <span className="block text-[12px] text-[var(--muted)]">
                With a handle and a recovery address this is the onboarding mail, to the recovery
                mailbox. Otherwise it goes to the account&apos;s own address.
              </span>
            </span>
          </label>

          <input type="hidden" name="sendEmail" value="off" readOnly />

          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className="btn btn-primary" disabled={state === "sending"}>
              {state === "sending" ? (
                <Loader2 size={14} aria-hidden className="animate-spin" />
              ) : (
                <UserPlus size={14} aria-hidden />
              )}
              {state === "sending" ? "Creating…" : "Create account"}
            </button>
            <Link href="/admin/people" className="btn btn-quiet">
              Cancel
            </Link>
          </div>

          {needsOne && !created ? (
            <p className="rounded-[10px] bg-[var(--warn-soft)] px-3 py-2 text-[12.5px] text-[var(--warn-text)]">
              A handle or an email — the door will not create an account with neither.
            </p>
          ) : null}

          {refusal ? (
            <p className="flex items-start gap-2 rounded-[10px] bg-[var(--danger-soft)] px-3 py-2 text-[12.5px] leading-relaxed text-[var(--danger-text)]">
              <AlertTriangle size={14} aria-hidden className="mt-0.5 shrink-0" />
              {refusal}
            </p>
          ) : null}
        </form>
      </Panel>

      <Panel title="What the door does with this">
        <ul className="flex flex-col gap-2.5 text-[13px] leading-relaxed text-[var(--text-2)]">
          <li>
            A handle writes the account, its profile, a verified primary address, a security row
            that forces a new password, the identity record and a mail registry entry — in one
            transaction.
          </li>
          <li>
            It then asks Supabase Auth for the same identity. That step is best-effort: the account
            exists either way, and the answer below says whether it worked.
          </li>
          <li>
            A taken handle or a taken address comes back as a conflict on that field, and nothing is
            written.
          </li>
          <li>
            The create is on the audit trail as <code className="text-[var(--text-2)]">user.created</code>{" "}
            with the temporary password marked as issued — never the password itself.
          </li>
        </ul>
      </Panel>
    </div>
  );
}

function CreatedPlate({ created, onAnother }: { created: Created; onAnother: () => void }) {
  const { data, viaIdentity } = created;
  const user = data.user;
  const password = typeof data.temporaryPassword === "string" ? data.temporaryPassword : null;
  const passwordRef = typeof data.temporaryPasswordRef === "string" ? data.temporaryPasswordRef : null;

  const field = "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[var(--divider)] py-2 last:border-0";
  const key = "text-[13px] text-[var(--muted)]";
  const val = "min-w-0 break-words text-right text-[13px] text-[var(--fg)]";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Panel
        title="Account created"
        hint="Everything below is what the API answered. Nothing on this plate is a guess."
      >
        <div className="flex flex-col gap-2">
          <div className={field}>
            <span className={key}>Signs in as</span>
            <span className={`${val} font-medium`}>{user.email}</span>
          </div>
          {user.username ? (
            <div className={field}>
              <span className={key}>Handle</span>
              <span className={val}>@{user.username}</span>
            </div>
          ) : null}
          <div className={field}>
            <span className={key}>Display name</span>
            <span className={val}>{user.name ?? "—"}</span>
          </div>
          <div className={field}>
            <span className={key}>Console level</span>
            <span className={val}>{user.adminRole ? user.adminRole.replaceAll("_", " ") : "none"}</span>
          </div>
          <div className={field}>
            <span className={key}>First sign-in</span>
            <span className={val}>
              {user.mustChangePassword ? (
                <Pill tone="warn">must set a new password</Pill>
              ) : (
                <Pill tone="muted">no change forced</Pill>
              )}
            </span>
          </div>
          <div className={field}>
            <span className={key}>Open the account</span>
            <span className={val}>
              <Link href={`/admin/people/${user.id}`} className="text-[var(--accent-text)] hover:underline">
                {viaIdentity ? `@${user.username}` : user.email}
              </Link>
            </span>
          </div>
        </div>

        {data.note ? (
          <p className="mt-3 text-[12px] leading-relaxed text-[var(--muted)]">{data.note}</p>
        ) : null}
      </Panel>

      <div className="flex flex-col gap-4">
        <Panel title="Temporary password">
          {password ? (
            <div className="flex flex-col gap-2.5">
              <input
                readOnly
                value={password}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Temporary password"
                className="h-10 w-full min-w-0 rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] px-3 font-mono text-[14px] tracking-[0.02em] text-[var(--fg)]"
              />
              <p className="rounded-[10px] bg-[var(--warn-soft)] px-3 py-2 text-[12.5px] leading-relaxed text-[var(--warn-text)]">
                This is the only time it can be read. The password is hashed on the way in and
                stored in no form this console can show again — write it down or hand it over now.
                The account is set to demand its own password at first sign-in, so this one is only
                a door through which the person gets to choose another.
              </p>
            </div>
          ) : passwordRef ? (
            <div className="flex flex-col gap-2.5">
              <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
                The API did not echo a password — it hands one back only in its own development
                builds, because in production the mail carries it. What it returned instead is a
                reference:
              </p>
              <code className="break-all rounded-[10px] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--fg)]">
                {passwordRef}
              </code>
              <p className="text-[12px] leading-relaxed text-[var(--muted)]">
                A reference is not a password: nobody can sign in with it, and there is no way to
                recover the secret it stands for from this screen.
              </p>
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
              The door echoed no password, and there is no way to read one from here: it prints one
              only in its own development builds, and otherwise leaves it to the welcome mail. The
              line under “What else the door reported” says what that mail was asked to do — it does
              not prove the message arrived.
            </p>
          )}
        </Panel>

        <Panel title="What else the door reported">
          <div className="flex flex-col gap-2">
            <div className={field}>
              <span className={key}>
                {viaIdentity ? "Onboarding mail" : "Welcome mail"}
              </span>
              <span className={val}>
                {typeof data.emailSent !== "boolean" ? (
                  "—"
                ) : viaIdentity ? (
                  <Pill tone={data.emailSent ? "success" : "danger"}>
                    {data.emailSent ? "delivered to the provider" : "not sent"}
                  </Pill>
                ) : (
                  /* The email-only flow reports the request back rather than the
                     delivery, so it must not be drawn as though a provider said yes. */
                  <Pill tone={data.emailSent ? "accent" : "muted"}>
                    {data.emailSent ? "send requested" : "not requested"}
                  </Pill>
                )}
              </span>
            </div>
            {data.emailRecipient ? (
              <div className={field}>
                <span className={key}>Sent to</span>
                <span className={val}>{data.emailRecipient}</span>
              </div>
            ) : null}
            {typeof data.supabaseProvisioned === "boolean" ? (
              <div className={field}>
                <span className={key}>Auth provider row</span>
                <span className={val}>
                  <Pill tone={data.supabaseProvisioned ? "success" : "warn"}>
                    {data.supabaseProvisioned ? "created" : "skipped"}
                  </Pill>
                </span>
              </div>
            ) : (
              <p className="text-[12px] leading-relaxed text-[var(--muted)]">
                An account created on an external email is not provisioned at the auth provider by
                this door, so it reported nothing either way.
              </p>
            )}
          </div>
        </Panel>

        <button type="button" className="btn btn-secondary self-start" onClick={onAnother}>
          Create another
        </button>
      </div>
    </div>
  );
}
