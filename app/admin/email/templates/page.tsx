import Link from "next/link";

import { EmailTemplateEditor } from "@/components/email-template-editor";
import { PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { readTemplates } from "@/lib/email-templates";
import { dateOnly, dateTime } from "@/lib/format";
import { can } from "@/lib/permissions";

import type { EmailTemplate } from "@/lib/types";

/* The mail bodies, and the slots each one fills.

   The registry reads in one shot — the door hands back every template with its
   body attached — so opening a template is navigation, not a request: the slug
   in the URL names which loaded row to draw. That is why selecting here is a
   plain link rather than a client fetch; there is nothing second to retrieve.

   What the screen prints comes from the row, nothing more: the subject and body
   are the template's own, the slot names are what the body actually contains,
   and the declared-variable list is exactly what the registry stores. */

type Params = Record<string, string | string[] | undefined>;

export default async function EmailTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const raw = params.slug;
  const slug = (Array.isArray(raw) ? raw[0] : raw) ?? "";

  const mayEdit = await can("email.configure");
  const load = await readTemplates();

  return (
    <>
      <PageHeader
        title="Templates"
        description="Every mail the platform can build, with the slots it fills and the body a person receives. Opening one lets you edit its subject and body; the mail goes out in this shape the next time its event fires."
      />

      <PageState
        load={load}
        rows={6}
        empty="The registry holds no templates. Until one exists, the platform has no body to build a mail from."
      />

      {load.status !== "ready" ? null : (
        <TemplateView templates={load.data} slug={slug} mayEdit={mayEdit} />
      )}
    </>
  );
}

function TemplateView({
  templates,
  slug,
  mayEdit,
}: {
  templates: EmailTemplate[];
  slug: string;
  /** Whose role holds email.configure: the editor or only the reader. */
  mayEdit: boolean;
}) {
  const selected = templates.find((t) => t.slug === slug) ?? templates[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
      <Panel flush title="Registry" hint={`${templates.length} templates`}>
        <ul className="max-h-[70vh] divide-y divide-[var(--divider)] overflow-y-auto">
          {templates.map((t) => {
            const active = selected?.slug === t.slug;
            return (
              <li key={t.id}>
                <Link
                  href={`/admin/email/templates?slug=${encodeURIComponent(t.slug)}`}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-[var(--hover)] ${
                    active ? "bg-[var(--hover)]" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-[13px] font-medium tracking-[-0.01em] ${
                        active ? "text-[var(--accent-text)]" : "text-[var(--fg)]"
                      }`}
                    >
                      {t.label || t.slug}
                    </span>
                    <code className="block truncate text-[11px] text-[var(--muted)]">{t.slug}</code>
                  </span>
                  <span className="shrink-0 text-[11px] tabular-nums text-[var(--muted)]">
                    {dateOnly(t.updatedAt)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Panel>

      {selected ? (
        <div className="flex flex-col gap-3">
          <Panel title={selected.label || selected.slug} hint={`slug ${selected.slug}`}>
            <dl className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="accent">{selected.subject || "no subject"}</Pill>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[12px] text-[var(--muted)]">
                <span title={dateTime(selected.createdAt)}>Created {dateOnly(selected.createdAt)}</span>
                <span title={dateTime(selected.updatedAt)}>Updated {dateOnly(selected.updatedAt)}</span>
                <span>
                  Declares {selected.variables.length > 0 ? selected.variables.join(", ") : "no variables"}
                </span>
              </div>
            </dl>
          </Panel>

          <Panel title={mayEdit ? "Edit subject & body" : "Subject & body"}>
            {mayEdit ? (
              <EmailTemplateEditor
                key={selected.id}
                id={selected.id}
                slug={selected.slug}
                subject={selected.subject}
                html={selected.html}
              />
            ) : (
              <p className="text-[13px] leading-relaxed text-[var(--muted)]">
                A body can be read here and written only by a role holding{" "}
                <code className="text-[var(--text-2)]">email.configure</code>. Yours sees the mail, not the
                editor.
              </p>
            )}
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
