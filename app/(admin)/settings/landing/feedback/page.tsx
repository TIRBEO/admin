'use client';

import { useEffect, useState } from 'react';
import { AdminSection } from '@tirbeo/ui';
import { apiFetch } from '../../../../lib';
import { Search, MessageSquare, Filter } from 'lucide-react';

type Feedback = {
  id: string;
  message: string;
  email: string | null;
  lang: string | null;
  source: string;
  status: string;
  createdAt: string;
};

export default function FeedbackPage() {
  const [data, setData] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await apiFetch(`/api/admin/feedback?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setData(d.feedback || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [sourceFilter, statusFilter]);

  const filtered = data.filter(f => {
    const matchSearch = !search || f.message.toLowerCase().includes(search.toLowerCase()) || (f.email && f.email.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  const sources = Array.from(new Set(data.map(f => f.source))).sort();
  const statuses = Array.from(new Set(data.map(f => f.status))).sort();

  return (
    <AdminSection title="Feedback" description="All user feedback submissions" tabs={[]} activeTab="" onTabChange={() => {}}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-admin-text-muted)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search feedback..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] text-sm text-[var(--color-admin-text)] outline-none focus:border-[var(--color-admin-accent)] transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--color-admin-text-muted)]" />
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] text-sm text-[var(--color-admin-text)] outline-none focus:border-[var(--color-admin-accent)] transition-colors"
            >
              <option value="all">All sources</option>
              {sources.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] text-sm text-[var(--color-admin-text)] outline-none focus:border-[var(--color-admin-accent)] transition-colors"
            >
              <option value="all">All statuses</option>
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-[var(--color-admin-accent)] border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-admin-text-muted)]">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No feedback found</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-admin-border)]">
              {filtered.map(fb => (
                <div key={fb.id} className="p-4 hover:bg-[var(--color-admin-surface-hover)] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--color-admin-text)] whitespace-pre-wrap">{fb.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {fb.email && (
                          <span className="text-xs text-[var(--color-admin-text-muted)]">{fb.email}</span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-admin-accent)]/10 text-[var(--color-admin-accent)]">
                          {fb.source}
                        </span>
                        <span className="text-xs text-[var(--color-admin-text-muted)]">{new Date(fb.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-xs text-[var(--color-admin-text-muted)]">
          Showing {filtered.length} of {data.length} total feedback entries
        </div>
      </div>
    </AdminSection>
  );
}
