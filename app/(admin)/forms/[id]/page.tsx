'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib';
import {
  ArrowLeft, FileText, Globe, EyeOff,
  ExternalLink, RefreshCcw, Trash2, Play, Pause,
} from 'lucide-react';

export default function AdminFormDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  const [form, setForm] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const formsOrigin = typeof window !== 'undefined' && window.location.hostname.includes('localhost')
    ? 'http://localhost:3004'
    : 'https://forms.tirbeo.app';

  const load = () => {
    apiFetch(`/api/admin/forms/${formId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setForm(data); setLoading(false); })
      .catch(() => setLoading(false));
    apiFetch(`/api/admin/responses?formId=${formId}&limit=50`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setResponses(data.responses || []); })
      .catch(() => {});
  };

  useEffect(load, [formId]);

  const setStatus = async (status: string) => {
    setBusy(true);
    setError('');
    try {
      const res = await apiFetch(`/api/admin/forms/${formId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { const t = await res.text(); setError(t || 'Failed to update'); }
      else load();
    } catch (e: any) { setError(e.message || 'Failed to update'); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    if (!window.confirm(`Delete form "${form?.title}" and all its responses? This cannot be undone.`)) return;
    setBusy(true);
    setError('');
    try {
      const res = await apiFetch(`/api/admin/forms/${formId}`, { method: 'DELETE' });
      if (!res.ok) { const t = await res.text(); setError(t || 'Failed to delete'); }
      else router.push('/admin/forms');
    } catch (e: any) { setError(e.message || 'Failed to delete'); }
    finally { setBusy(false); }
  };

  if (loading) {
    return <div className="p-12 text-center text-[var(--color-text-secondary)]">Loading...</div>;
  }

  if (!form) {
    return <div className="p-12 text-center text-[var(--color-text-secondary)]">Form not found</div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-[var(--color-surface-muted)]">
          <ArrowLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
        </button>
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--color-text)] leading-tight">{form.title}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {form.user?.displayName || form.user?.email || 'Unknown owner'} • {form._count?.responses || 0} responses
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-[var(--color-error)] bg-[var(--color-error-surface)] text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Status</div>
          <div className="text-sm font-medium text-[var(--color-text)] flex items-center gap-2">
            {form.status === 'published' ? <Globe className="w-4 h-4 text-[var(--color-success)]" /> : <EyeOff className="w-4 h-4" />}
            {form.status}
          </div>
          <button
            onClick={() => setStatus(form.status === 'published' ? 'draft' : 'published')}
            disabled={busy}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[var(--color-border)] text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] disabled:opacity-50"
          >
            {form.status === 'published' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {form.status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
        </div>
        <div className="border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Visibility</div>
          <div className="text-sm font-medium text-[var(--color-text)] flex items-center gap-2">
            {form.visibility === 'public' ? <Globe className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {form.visibility}
          </div>
        </div>
        <div className="border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Fields</div>
          <div className="text-sm font-medium text-[var(--color-text)]">{form.fields?.length || 0}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <a href={`${formsOrigin}/a/${form.publicId}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline">
            Open public form <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <button onClick={remove} disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-error)] text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error-surface)] disabled:opacity-50">
          <Trash2 className="w-3.5 h-3.5" /> Delete form
        </button>
      </div>

      <div className="border-2 border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Fields</h2>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {form.fields?.map((field: any) => (
            <div key={field.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[var(--color-text)]">{field.label}</div>
                <div className="text-xs text-[var(--color-text-tertiary)]">{field.type}</div>
              </div>
              {field.required && (
                <span className="text-xs text-[var(--color-error)]">Required</span>
              )}
            </div>
          ))}
          {(!form.fields || form.fields.length === 0) && (
            <div className="px-4 py-6 text-center text-sm text-[var(--color-text-secondary)]">No fields</div>
          )}
        </div>
      </div>

      <div className="border-2 border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden mt-6">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Responses ({responses.length})</h2>
          <button onClick={load} className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
            <RefreshCcw className="w-3 h-3" /> Refresh
          </button>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {responses.map((r: any) => (
            <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-medium text-[var(--color-text)] truncate">
                  {r.respondentEmail || r.respondentName || 'Anonymous respondent'}
                </div>
                <div className="text-xs text-[var(--color-text-tertiary)]">
                  {new Date(r.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {r._count?.answers !== undefined && (
                  <span className="text-xs text-[var(--color-text-secondary)]">{r._count.answers} answers</span>
                )}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'completed' || r.status === 'submitted' ? 'bg-[var(--color-success-surface)] text-[var(--color-success)]' : 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'}`}>
                  {r.status || 'completed'}
                </span>
              </div>
            </div>
          ))}
          {responses.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-[var(--color-text-secondary)]">No responses yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
