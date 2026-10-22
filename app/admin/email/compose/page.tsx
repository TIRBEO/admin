import Link from "next/link";

import { getTemplate, previewBroadcast, sampleRender } from "@/lib/mock";

type Params = Record<string, string | string[] | undefined>;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const subject = one("subject") ?? "A change to your export window";
  const body = one("body") ?? "We moved the download deadline. Nothing you need to do.";
  const segment = one("segment") ?? "all";
  const templateSlug = one("template") ?? "";

  const [template, preview, sample] = await Promise.all([
    templateSlug ? getTemplate(templateSlug) : null,
    previewBroadcast({ subject, body, segment, audience: 0 }),
    sampleRender(),
  ]);

  const field =
    "w-full bg-transparent px-0 py-2 text-[13px] text-[var(--fg)] placeholder:text-[var(--text-4)] focus:outline-none";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--fg)]">Compose</h1>
        <p className="mt-1 text-[13px] text-[var(--text-3)]">Broadcast</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          {template ? (
            <div className="mb-4 text-[13px] text-[var(--text-3)]">
              Using <span className="text-[var(--fg)]">{template.slug}</span> — {template.label}
            </div>
          ) : null}

          <form action="/admin/email/compose" method="get" className="divide-y divide-[var(--divider)]">
            <div className="py-2">
              <label htmlFor="subject" className="block text-[12px] text-[var(--text-4)]">
                Subject
              </label>
              <input id="subject" name="subject" defaultValue={subject} className={field} />
            </div>
            <div className="py-2">
              <label htmlFor="segment" className="block text-[12px] text-[var(--text-4)]">
                Audience
              </label>
              <select id="segment" name="segment" defaultValue={segment} className={field}>
                {preview.segments.map((s) => (
                  <option key={s.label} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="py-2">
              <label htmlFor="body" className="block text-[12px] text-[var(--text-4)]">
                Body
              </label>
              <textarea id="body" name="body" rows={6} defaultValue={body} className={`${field} resize-y`} />
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <button type="submit" className="text-[13px] text-[var(--link)]">
                Recalculate
              </button>
              <button type="submit" name="state" value="preview" className="text-[13px] text-[var(--link)]">
                Preview only
              </button>
              <span className="text-[13px] text-[var(--text-4)]">Send to {preview.audience}</span>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-[12px] text-[var(--text-4)]">Rendered</div>
            <iframe
              title="Rendered message"
              sandbox=""
              srcDoc={`<!doctype html><meta charset="utf-8"><body style="margin:0;font:15px/1.5 -apple-system,system-ui,sans-serif;color:#e6e6e6;background:#1c1c1e"><div style="max-width:34rem;margin:0 auto;padding:20px"><p style="margin:0 0 12px;font-weight:600">${escapeHtml(subject)}</p><p style="margin:0;white-space:pre-wrap">${escapeHtml(body)}</p></div></body>`}
              className="mt-2 h-56 w-full border border-[var(--divider)] bg-[#1c1c1e]"
            />
          </div>
        </div>

        <div>
          <div className="text-[12px] uppercase tracking-wide text-[var(--text-4)]">Counts</div>
          <div className="mt-2 divide-y divide-[var(--divider)]">
            <div className="flex items-center justify-between py-2">
              <span className="text-[13px] text-[var(--text-3)]">Audience</span>
              <span className="text-[13px] text-[var(--fg)]">{preview.audience}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[13px] text-[var(--text-3)]">Reachable</span>
              <span className="text-[13px] text-[var(--fg)]">{Math.max(0, preview.audience - preview.optOuts - preview.suppressed)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[13px] text-[var(--text-3)]">Opted out</span>
              <span className="text-[13px] text-[var(--text-2)]">{preview.optOuts}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[13px] text-[var(--text-3)]">Suppressed</span>
              <span className="text-[13px] text-[var(--text-2)]">{preview.suppressed}</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-[12px] text-[var(--text-4)]">A template render</div>
            <iframe
              title="Sample template render"
              sandbox=""
              srcDoc={`<!doctype html><meta charset="utf-8"><body style="margin:0;background:#1c1c1e">${sample}</body>`}
              className="mt-2 h-44 w-full border border-[var(--divider)] bg-[#1c1c1e]"
            />
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Link href="/admin/email/templates" className="text-[13px] text-[var(--link)]">
              Templates
            </Link>
            <Link href="/admin/email/deliveries" className="text-[13px] text-[var(--link)]">
              Deliveries
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
