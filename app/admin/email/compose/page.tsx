import Link from "next/link";
import { Mail } from "lucide-react";

import { Metric, PageHeader, PageState, Panel, Pill } from "@/components/page-header";
import { getTemplate, previewBroadcast, sampleRender } from "@/lib/mock";
import { MOCK_ERROR, present, readState } from "@/lib/load-state";

type Params = Record<string, string | string[] | undefined>;

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const state = readState(params);
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
  const load = present(state, preview);

  const field =
    "w-full rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-[13px] text-[var(--fg)] placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:outline-none";

  return (
    <>
      <PageHeader
        title="Compose"
        description="One message, written by hand. The audience is computed before anything is sent, because the number that surprises an operator is the number that ends up in a mailbox."
        state={state}
        params={params}
      />

      <PageState load={load} rows={4} empty="No account is reachable — an audience of zero is a config problem, not a quiet day." />

      {load.status !== "ready" ? null : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="flex flex-col gap-4">
            {template ? (
              <Panel title="Rendering a template">
                <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
                  <code>{template.slug}</code> — {template.label ?? "no label"}. A template send
                  takes its body from the registry, so the text below is what the variables land in.
                </p>
                <p className="mt-2 text-[12px] text-[var(--muted)]">
                  Subject from the template: {template.subject}
                </p>
              </Panel>
            ) : null}

            <Panel title="Message" hint="The form has no endpoint to post to, so it writes itself into the URL instead — every keystroke of this preview is a query parameter.">
              <form action="/admin/email/compose" method="get" className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="subject" className="text-[12px] font-medium tracking-[-0.01em] text-[var(--muted)]">
                    Subject
                  </label>
                  <input id="subject" name="subject" defaultValue={subject} className={field} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="segment" className="text-[12px] font-medium tracking-[-0.01em] text-[var(--muted)]">
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
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="body" className="text-[12px] font-medium tracking-[-0.01em] text-[var(--muted)]">
                    Body
                  </label>
                  <textarea id="body" name="body" rows={5} defaultValue={body} className={`${field} resize-y`} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="btn btn-secondary">
                    Recalculate
                  </button>
                  <button type="submit" name="state" value="preview" className="btn btn-quiet">
                    Preview only
                  </button>
                  <button type="button" className="btn btn-primary" disabled title={MOCK_ERROR}>
                    <Mail size={13} aria-hidden />
                    Send to {load.data.audience}
                  </button>
                </div>
              </form>
            </Panel>

            <Panel
              title="Rendered"
              hint="Text only, in a sandboxed frame — this screen does not execute anything a composer typed."
            >
              <iframe
                title="Rendered message"
                sandbox=""
                srcDoc={`<!doctype html><meta charset="utf-8"><body style="margin:0;font:15px/1.5 -apple-system,system-ui,sans-serif;color:#171717;background:#fff"><div style="max-width:34rem;margin:0 auto;padding:20px"><p style="margin:0 0 12px;font-weight:600">${escapeHtml(subject)}</p><p style="margin:0;white-space:pre-wrap">${escapeHtml(body)}</p></div></body>`}
                className="h-56 w-full rounded-[12px] border border-[var(--border)] bg-white"
              />
            </Panel>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Audience" value={load.data.audience} hint={segment} />
              <Metric
                label="Reachable"
                value={Math.max(0, load.data.audience - load.data.optOuts - load.data.suppressed)}
                hint="after opt-outs and policy"
                tone="success"
              />
              <Metric label="Opted out" value={load.data.optOuts} hint="preference, not policy" />
              <Metric
                label="Suppressed"
                value={load.data.suppressed}
                hint="restricted accounts"
                tone={load.data.suppressed > 0 ? "warn" : "default"}
              />
            </div>

            <Panel title="Throttle" hint="A broadcast is spread so the provider sees a normal day.">
              <ul className="flex h-24 items-end gap-1.5" role="img" aria-label="Send spread by hour">
                {load.data.throttle.map((h) => {
                  const max = Math.max(...load.data.throttle.map((x) => x.count), 1);
                  return (
                    <li key={h.label} className="flex flex-1 flex-col items-center gap-1.5">
                      <div
                        className="w-full rounded-t-[3px] bg-[var(--accent-solid)] opacity-80"
                        style={{ height: `${Math.max(4, Math.round((h.count / max) * 100))}%` }}
                        title={`${h.label}: ${h.count}`}
                      />
                      <span className="text-[10px] tabular-nums text-[var(--muted)]">{h.label}</span>
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <Panel title="A template render" hint="What a real send looks like once the registry is involved.">
              <iframe
                title="Sample template render"
                sandbox=""
                srcDoc={`<!doctype html><meta charset="utf-8"><body style="margin:0">${sample}</body>`}
                className="h-44 w-full rounded-[12px] border border-[var(--border)] bg-white"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/admin/email/templates" className="btn btn-quiet btn-sm">
                  Templates
                </Link>
                <Link href="/admin/email/deliveries" className="btn btn-quiet btn-sm">
                  What happened to the last send
                </Link>
              </div>
            </Panel>

            <Pill tone="warn">Nothing on this screen can send mail.</Pill>
          </div>
        </div>
      )}
    </>
  );
}

/** The composer's text is rendered back to its author. It is escaped rather
    than trusted: a console that is public until auth returns must not turn a
    query parameter into markup. */
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
