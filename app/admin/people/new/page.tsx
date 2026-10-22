import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader, PageState } from "@/components/page-header";
import { PersonCreateForm } from "@/components/person-create-form";
import { can, readMe } from "@/lib/permissions";
import { readRoster } from "@/lib/staff";

/* Creating an account writes a row in the user table, sends a mail and issues a
   password, so it belongs to the role that may change accounts — not to whoever
   can read them. The rail already hides this screen from a Support or Analyst
   account; arriving at the URL directly still has to say the same thing, which
   is why the check is here as well. */

export default async function NewPersonPage() {
  const mayCreate = await can("people.manage");
  const me = await readMe();
  const maySetRole = me.ok && me.data ? me.data.canManageStaff : false;
  const roster = maySetRole ? await readRoster() : null;
  const roles = roster?.status === "ready" ? roster.data.roles.map((r) => ({ key: r.key, label: r.label })) : [];

  return (
    <>
      <PageHeader
        title="New person"
        description="Provision an account from the console. An operator-created account skips the signup flow, so this is where the exceptions live — and the password it starts with exists only in the answer below."
        actions={
          <Link href="/admin/people" className="btn btn-quiet btn-sm">
            <ArrowLeft size={13} aria-hidden />
            All people
          </Link>
        }
      />

      {mayCreate ? (
        <PersonCreateForm roles={roles} />
      ) : (
        <PageState
          load={{
            status: "error",
            message:
              "Provisioning an account writes a row, issues a password and sends a mail, so the console offers it to a role that holds “Change an account”. Yours reads accounts; it does not create them.",
          }}
        />
      )}
    </>
  );
}
