import Link from "next/link";

import { ago, dateOnly } from "@/lib/format";
import { getTemplate, listTemplates } from "@/lib/mock";
import { NOW_ISO } from "@/lib/mock/world";

export default async function EmailTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.slug;
  const slug = (Array.isArray(raw) ? raw[0] : raw) ?? "";

  const templates = await listTemplates();
  const selected = slug ? await getTemplate(slug) : (templates[0] ?? null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--fg)]">Templates</h1>
        <p className="mt-1 text-[13px] text-[var(--text-3)]">Registry of email templates</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div>
          <div className="text-[12px] uppercase tracking-wide text-[var(--text-4)]">All</div>
          <div className="mt-2 divide-y divide-[var(--divider)]">
            {templates.map((t) => {
              const active = selected?.slug === t.slug;
              return (
                <Link
                  key={t.slug}
                  href={`/admin/email/templates?slug=${t.slug}`}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className={`truncate text-[13px] ${active ? "text-[var(--fg)]" : "text-[var(--text-2)]"}`}>
                      {t.slug}
                    </div>
                    <div className="truncate text-[12px] text-[var(--text-4)]">{t.label}</div>
                  </div>
                  <div className="shrink-0 text-[12px] text-[var(--text-4)]">{ago(t.updatedAt, NOW_ISO)}</div>
                </Link>
              );
            })}
          </div>
        </div>

        {selected ? (
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <div className="text-[13px] text-[var(--fg)]">{selected.slug}</div>
                <div className="mt-1 text-[12px] text-[var(--text-4)]">{selected.label}</div>
              </div>
              <div className="text-[12px] text-[var(--text-4)]">{selected.variables.length} vars</div>
            </div>

            <div className="mt-4 divide-y divide-[var(--divider)]">
              <div className="flex items-center justify-between py-2">
                <span className="text-[13px] text-[var(--text-3)]">Subject</span>
                <span className="text-[13px] text-[var(--fg)]">{selected.subject}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[13px] text-[var(--text-3)]">Updated</span>
                <span className="text-[13px] text-[var(--text-2)]">{ago(selected.updatedAt, NOW_ISO)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[13px] text-[var(--text-3)]">Created</span>
                <span className="text-[13px] text-[var(--text-2)]">{dateOnly(selected.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[13px] text-[var(--text-3)]">Variables</span>
                <div className="flex flex-wrap gap-1.5">
                  {selected.variables.map((v) => (
                    <span key={v} className="text-[12px] text-[var(--text-3)]">{`{{${v}}}`}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-[12px] text-[var(--text-4)]">Render</div>
              <iframe
                title={`Rendered ${selected.slug}`}
                sandbox=""
                srcDoc={`<!doctype html><meta charset="utf-8"><body style="margin:0;font:15px/1.5 -apple-system,system-ui,sans-serif;color:#e6e6e6;background:#1c1c1e"><div style="max-width:34rem;margin:0 auto;padding:20px">${selected.html}</div></body>`}
                className="mt-2 h-64 w-full border border-[var(--divider)] bg-[#1c1c1e]"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
              <Link href={`/admin/email/compose?template=${selected.slug}`} className="text-[13px] text-[var(--link)]">
                Send a test
              </Link>
              <Link href="/admin/email/queue" className="text-[13px] text-[var(--link)]">
                Jobs using it
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
