import Link from "next/link";

import { PageHeader, Panel } from "@/components/page-header";
import { NAV_GROUPS } from "@/lib/nav";

/* Screens that used to be here — Subscribers, Push, Waitlist, Jobs — were
   drawn over invented numbers and have been deleted, so an old bookmark or a
   link from a mail lands here. Listing what the console actually has is more
   use than an apology: the operator can see in one look whether the screen
   moved or never existed. */
export default function AdminNotFound() {
  return (
    <>
      <PageHeader
        title="No such section"
        description="This console only ships screens that read from the API. Anything that was drawn over fixture data has been removed rather than left to mislead."
        actions={
          <Link href="/admin" className="btn btn-secondary btn-sm">
            To the dashboard
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {NAV_GROUPS.map((group) => (
          <Panel key={group.id} title={group.title}>
            <ul className="flex flex-col gap-1.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[13px] text-[var(--accent-text)] hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </>
  );
}
