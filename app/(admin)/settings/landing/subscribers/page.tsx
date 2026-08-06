'use client';

import { useEffect, useState } from 'react';
import { AdminSection } from '@tirbeo/ui';
import { apiFetch } from '../../../../lib';
import { Search, Mail, Filter } from 'lucide-react';

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  source: string;
  status: string;
  createdAt: string;
};

export default function SubscribersPage() {
  const [data, setData] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/subscribers');
      if (res.ok) {
        const d = await res.json();
        setData(d.subscribers || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = data.filter(s => {
    const matchSearch = !search || s.email.toLowerCase().includes(search.toLowerCase()) || (s.name && s.name.toLowerCase().includes(search.toLowerCase()));
    const matchSource = sourceFilter === 'all' || s.source === sourceFilter;
    return matchSearch && matchSource;
  });

  const sources = Array.from(new Set(data.map(s => s.source))).sort();

  return (
    <AdminSection title="Subscribers" description="All waitlist and newsletter signups" tabs={[]} activeTab="" onTabChange={() => {}}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-admin-text-muted)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by email or name..."
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
          </div>
        </div>

        <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-[var(--color-admin-accent)] border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-admin-text-muted)]">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No subscribers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-admin-border)]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-admin-text-muted)] uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-admin-text-muted)] uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-admin-text-muted)] uppercase tracking-wider">Source</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-admin-text-muted)] uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-admin-text-muted)] uppercase tracking-wider">Signed Up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-admin-border)]">
                  {filtered.map(sub => (
                    <tr key={sub.id} className="hover:bg-[var(--color-admin-surface-hover)] transition-colors">
                      <td className="px-4 py-3 text-[var(--color-admin-text)] font-medium">{sub.email}</td>
                      <td className="px-4 py-3 text-[var(--color-admin-text-secondary)]">{sub.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-admin-accent)]/10 text-[var(--color-admin-accent)]">
                          {sub.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-admin-text-secondary)]">{sub.status}</td>
                      <td className="px-4 py-3 text-[var(--color-admin-text-secondary)]">{new Date(sub.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="text-xs text-[var(--color-admin-text-muted)]">
          Showing {filtered.length} of {data.length} total subscribers
        </div>
      </div>
    </AdminSection>
  );
}
