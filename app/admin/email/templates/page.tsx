import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { Field, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { getTemplate, listTemplates } from "@/lib/mock";
import { present, readState } from "@/lib/load-state";
import { ago, dateOnly } from "@/lib/format";
import { NOW_ISO } from "@/lib/mock/world";

type Params = Record<string, string | string[] | undefined>;

export default async function EmailTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const state = readState(params);
  const raw = params.slug;
  const slug = (Array.isArray(raw) ? raw[0] : raw) ?? "";

  const templates = await listTemplates();
  const selected = slug ? await getTemplate(slug) : (templates[0] ?? null);
  const load = present(state, { templates, selected });

  return (
    <>
      <PageHeader
        title="Templates"
        description="The layout a job renders into. Editing one here changes the next mail, not the last one."
        state={state}
        params={params}
      />

      <PageState load={load} rows={6} empty="There is no template registry — nothing can be sent, because there is nothing to send as." />

      {load.status !== "ready" ? null : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Panel title="Registry" flush hint="A slug is what the code asks for; a label is what an operator reads.">
            <div className="px-4 py-1">
              <DataTable
                columns={[
                  { key: "slug", label: "Slug" },
                  { key: "subject", label: "Subject", hideBelow: "sm" },
                  { key: "changed", label: "Changed", align: "right", hideBelow: "md" },
                ]}
                rows={templates.map((t) => ({
                  slug: (
                    <span className="flex min-w-0 flex-col">
                      <Link
                        href={`/admin/email/templates?slug=${t.slug}`}
                        className={`truncate font-medium hover:underline ${
                          selected?.slug === t.slug
                            ? "text-[var(--accent-text)]"
                            : "text-[var(--fg)] hover:text-[var(--accent-text)]"
                        }`}
                      >
                        {t.slug}
                      </Link>
                      <span className="truncate text-[11px] text-[var(--muted)]">{t.label}</span>
                    </span>
                  ),
                  subject: <span className="block truncate text-[var(--text-2)]">{t.subject}</span>,
                  changed: (
                    <span title={dateOnly(t.updatedAt)}>{ago(t.updatedAt, NOW_ISO)}</span>
                  ),
                }))}
                empty="No template is registered."
              />
            </div>
          </Panel>

          {selected ? (
            <div className="flex flex-col gap-4">
              <Panel
                title={selected.slug}
                hint={selected.label ?? "no label"}
                action={<Pill tone="muted">{selected.variables.length} variables</Pill>}
              >
                <dl className="-my-1">
                  <Field label="Subject">{selected.subject}</Field>
                  <Field label="Variables">
                    <span className="flex flex-wrap justify-end gap-1.5">
                      {selected.variables.map((v) => (
                        <code
                          key={v}
                          className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] text-[var(--text-2)]"
                        >
                          {`{{${v}}}`}
                        </code>
                      ))}
                    </span>
                  </Field>
                  <Field label="Updated">{ago(selected.updatedAt, NOW_ISO)}</Field>
                  <Field label="Created">{dateOnly(selected.createdAt)}</Field>
                </dl>
              </Panel>

              <Panel
                title="Render"
                hint="Isolated in a sandboxed frame: a template is markup from the database, and a console should not execute it."
              >
                <iframe
                  title={`Rendered ${selected.slug}`}
                  sandbox=""
                  srcDoc={`<!doctype html><meta charset="utf-8"><body style="margin:0;font:15px/1.5 -apple-system,system-ui,sans-serif;color:#171717;background:#fff"><div style="max-width:34rem;margin:0 auto;padding:20px">${selected.html}</div></body>`}
                  className="h-64 w-full rounded-[12px] border border-[var(--border)] bg-white"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/email/compose?template=${selected.slug}`}
                    className="btn btn-secondary btn-sm"
                  >
                    Send a test
                  </Link>
                  <Link href="/admin/email/queue" className="btn btn-quiet btn-sm">
                    Jobs using it
                  </Link>
                </div>
              </Panel>
            </div>
          ) : (
            <Panel title="Pick a template" hint="Nothing is selected — the registry is empty or the slug does not exist.">
              <p className="text-[13px] text-[var(--muted)]">
                Choose a slug from the registry to see what it renders into.
              </p>
            </Panel>
          )}
        </div>
      )}
    </>
  );
}
