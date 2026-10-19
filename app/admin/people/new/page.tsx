import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader, Panel } from "@/components/page-header";
import { MOCK_ERROR } from "@/lib/load-state";

export default function NewPersonPage() {
  const input =
    "h-9 w-full min-w-0 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[13px] text-[var(--fg)] placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:outline-none";
  const label = "block text-[12px] font-medium tracking-[-0.01em] text-[var(--muted)]";

  return (
    <>
      <PageHeader
        title="New person"
        description="Provision an account from the console — an operator-created account skips the signup flow, so this screen is where the exceptions live."
        actions={
          <Link href="/admin/people" className="btn btn-quiet btn-sm">
            <ArrowLeft size={13} aria-hidden />
            All people
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="Account" hint="Two addresses and a name is all an account needs to exist.">
          <form className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className={label} htmlFor="email">
                  Email
                </label>
                <input id="email" name="email" type="email" required placeholder="ada@example.invalid" className={input} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={label} htmlFor="username">
                  Handle
                </label>
                <input id="username" name="username" type="text" placeholder="sample_a" className={input} />
                <p className="text-[12px] leading-snug text-[var(--muted)]">
                  Lowercase letters, digits and underscores. Reserved handles are listed under{" "}
                  <Link href="/admin/identities" className="text-[var(--accent-text)] hover:underline">
                    Identities
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className={label} htmlFor="name">
                  Display name
                </label>
                <input id="name" name="name" type="text" placeholder="Sample Person A" className={input} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={label} htmlFor="phone">
                  Phone
                </label>
                <input id="phone" name="phone" type="tel" placeholder="+880 1700 000000" className={input} />
              </div>
            </div>

            <fieldset className="flex flex-col gap-3 rounded-[12px] bg-[var(--surface-2)] px-3.5 py-3">
              <legend className="px-1 text-[12px] font-medium tracking-[-0.01em] text-[var(--muted)]">
                How they get in
              </legend>
              <label className="flex items-start gap-2.5">
                <input type="radio" name="mode" value="invite" defaultChecked className="mt-0.5" />
                <span className="text-[13px] text-[var(--fg)]">
                  Email an invite
                  <span className="block text-[12px] text-[var(--muted)]">
                    No password is set here; the link lands them on the normal reset flow.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2.5">
                <input type="radio" name="mode" value="password" className="mt-0.5" />
                <span className="text-[13px] text-[var(--fg)]">
                  Set a temporary password
                  <span className="block text-[12px] text-[var(--muted)]">
                    Lands in <code>mustChangePw</code>, so their first sign-in forces a new one.
                  </span>
                </span>
              </label>
            </fieldset>

            <fieldset className="flex flex-col gap-2.5 rounded-[12px] bg-[var(--surface-2)] px-3.5 py-3">
              <legend className="px-1 text-[12px] font-medium tracking-[-0.01em] text-[var(--muted)]">
                What they are
              </legend>
              <label className="flex items-center gap-2.5 text-[13px] text-[var(--fg)]">
                <input type="checkbox" name="isAdmin" className="mt-0" />
                Console access
              </label>
              <label className="flex items-center gap-2.5 text-[13px] text-[var(--fg)]">
                <input type="checkbox" name="require2FA" className="mt-0" />
                Require two-factor from the first sign-in
              </label>
              <label className="flex items-center gap-2.5 text-[13px] text-[var(--fg)]">
                <input type="checkbox" name="verifyEmail" className="mt-0" />
                Mark the email verified
              </label>
            </fieldset>

            <div className="flex flex-wrap items-center gap-2">
              {/* No handler exists to receive this, so the control is off
                  rather than decorative: disabled is the honest state. */}
              <button type="submit" className="btn btn-primary" disabled title={MOCK_ERROR}>
                Create account
              </button>
              <Link href="/admin/people" className="btn btn-quiet">
                Cancel
              </Link>
            </div>
          </form>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel title="What wiring this screen needs">
            <ul className="flex flex-col gap-2.5 text-[13px] leading-relaxed text-[var(--text-2)]">
              <li>
                A <code>POST users</code> that writes <code>users</code>, then the one-to-one rows
                it depends on — <code>user_profile</code>, <code>user_preferences</code>,{" "}
                <code>user_email</code>, <code>user_security</code>.
              </li>
              <li>
                An address already taken must come back as a conflict on the field, not a banner
                for the whole form.
              </li>
              <li>
                Creating an operator is a privilege escalation, so the write belongs in the audit
                trail before it belongs in the database.
              </li>
              <li>An invite needs the email queue to be reachable, which is its own screen.</li>
            </ul>
          </Panel>

          <Panel title="Existing accounts" hint="Nothing here was created by the console.">
            <ul className="flex flex-col divide-y divide-[var(--divider)]">
              {[
                ["People", "/admin/people", "search, filter, open a 360"],
                ["Identities", "/admin/identities", "handles and reserved addresses"],
                ["Export requests", "/admin/export-requests", "what an account asked to take with it"],
              ].map(([title, href, note]) => (
                <li key={href} className="py-2 first:pt-0 last:pb-0">
                  <Link href={href} className="text-[13px] font-medium text-[var(--accent-text)] hover:underline">
                    {title}
                  </Link>
                  <p className="text-[12px] text-[var(--muted)]">{note}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
