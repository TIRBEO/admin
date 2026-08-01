'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib';
import {
  FileText, Globe, EyeOff, Users, Search, ExternalLink,
  ChevronLeft,
} from 'lucide-react';

export default function AdminFormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/forms?limit=200')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setForms(data.forms || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = forms.filter((f: any) =>
    f.title?.toLowerCase().includes(search.toLowerCase()) ||
    f.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--color-text)] leading-tight">Forms</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Manage and moderate all forms across the platform</p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search forms..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[var(--color-text-secondary)]">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-secondary)]">No forms found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-tertiary)]">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Visibility</th>
                <th className="px-4 py-3 font-medium text-right">Responses</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f: any) => (
                <tr key={f.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                      <span className="font-medium text-[var(--color-text)]">{f.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {f.user?.displayName || f.user?.email || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                      f.visibility === 'public'
                        ? 'bg-[var(--color-success-surface)] text-[var(--color-success)]'
                        : 'bg-[var(--color-surface-muted)] text-[var(--color-text-tertiary)]'
                    )}>
                      {f.visibility === 'public' ? <Globe className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {f.visibility}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                    {f._count?.responses ?? f.responseCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => router.push(`/admin/forms/${f.id}`)}
                      className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline">
                      View <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
