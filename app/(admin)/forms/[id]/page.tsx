'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib';
import {
  ArrowLeft, FileText, Globe, EyeOff, Users,
  ExternalLink, RefreshCcw,
} from 'lucide-react';

export default function AdminFormDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/admin/forms/${formId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setForm(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [formId]);

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Status</div>
          <div className="text-sm font-medium text-[var(--color-text)]">{form.status}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Visibility</div>
          <div className="text-sm font-medium text-[var(--color-text)] flex items-center gap-2">
            {form.visibility === 'public' ? <Globe className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {form.visibility}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Fields</div>
          <div className="text-sm font-medium text-[var(--color-text)]">{form.fields?.length || 0}</div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Fields</h2>
          <a href={`/f/${form.publicId}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline">
            Open form <ExternalLink className="w-3 h-3" />
          </a>
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
    </div>
  );
}
