'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSection, DataTable, StatusBadge, PageToolbar } from '@tirbeo/ui';
import { apiFetch } from '../../../lib';

interface AuditEvent {
  id: string;
  action: string;
  actor: string;
  target?: string;
  category: string;
  ip?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export default function AuditLog() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  const fetchEvents = (p: number, q: string) => {
    setLoading(true);
    const query = new URLSearchParams({ page: String(p), limit: '25' });
    if (q) query.set('search', q);
    apiFetch(`/api/admin/audit?${query}`).then(async r => {
      if (r.ok) {
        const d = await r.json();
        setEvents(d.events || d.data || d || []);
        setTotalPages(d.totalPages || d.pages || 1);
        setTotal(d.total || 0);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchEvents(page, search); }, [page]);

  const handleSearch = (q: string) => {
    setSearch(q);
    setPage(1);
    fetchEvents(1, q);
  };

  const handleExport = () => {
    apiFetch('/api/admin/audit/export').then(async r => {
      if (r.ok) {
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }).catch(() => {});
  };

  const columns = [
    { key: 'action', label: 'Action', sortable: true, render: (e: AuditEvent) => (
      <span className="text-sm font-medium text-[var(--color-admin-text)]">{e.action}</span>
    )},
    { key: 'actor', label: 'Actor', render: (e: AuditEvent) => (
      <span className="text-sm text-[var(--color-admin-text)]">{e.actor}</span>
    )},
    { key: 'category', label: 'Category', render: (e: AuditEvent) => (
      <StatusBadge status={e.category} dot={false} />
    )},
    { key: 'target', label: 'Target', render: (e: AuditEvent) => (
      <span className="text-sm text-[var(--color-admin-text-muted)]">{e.target || '—'}</span>
    )},
    { key: 'ip', label: 'IP', render: (e: AuditEvent) => (
      <span className="text-sm text-[var(--color-admin-text-muted)] font-mono">{e.ip || '—'}</span>
    )},
    { key: 'createdAt', label: 'Timestamp', sortable: true, render: (e: AuditEvent) => (
      <span className="text-sm text-[var(--color-admin-text-muted)]">{new Date(e.createdAt).toLocaleString()}</span>
    )},
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'authentication', label: 'Authentication' },
    { id: 'access-control', label: 'Access control' },
    { id: 'audit', label: 'Audit log' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <AdminSection title="Audit Log" description="View security events and administrative changes"
      tabs={tabs} activeTab="audit" onTabChange={id => router.push(`/admin/security/${id === 'overview' ? '' : id}`)}>
      <DataTable columns={columns} data={events} keyExtractor={e => e.id}
        loading={loading}
        searchable searchPlaceholder="Search audit log..." onSearch={handleSearch}
        selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds}
        page={page} totalPages={totalPages} onPageChange={setPage} total={total}
        bulkActions={
          <button onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-admin-border)] text-xs font-medium text-[var(--color-admin-text-secondary)] hover:bg-[var(--color-admin-surface-hover)]">
            Export Selected
          </button>
        }
        emptyState={
          <div className="p-12 text-center">
            <p className="text-sm text-[var(--color-admin-text-muted)]">No audit events found</p>
          </div>
        } />
    </AdminSection>
  );
}
