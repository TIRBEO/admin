'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSection, DataTable, StatusBadge } from '@tirbeo/ui';
import { apiFetch } from '../../lib';
import { Scale, Plus, ToggleLeft, ToggleRight } from 'lucide-react';

interface Rule {
  id: string;
  name: string;
  description?: string;
  type?: string;
  priority?: number;
  isActive?: boolean;
  conditions?: number;
  actions?: string;
  createdAt?: string;
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiFetch('/api/admin/routes').then(async r => {
      if (r.ok) { const d = await r.json(); setRules(d.rules || d.data || d || []); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'name', label: 'Rule', sortable: true, render: (r: Rule) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-surface)] flex items-center justify-center">
          <Scale className="w-4 h-4 text-[var(--color-primary)]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-admin-text)]">{r.name}</p>
          {r.description && <p className="text-xs text-[var(--color-admin-text-muted)] truncate max-w-xs">{r.description}</p>}
        </div>
      </div>
    )},
    { key: 'type', label: 'Type', render: (r: Rule) => (
      <StatusBadge status={r.type === 'route' ? 'active' : 'suspended'} label={r.type || '—'} dot={false} />
    )},
    { key: 'priority', label: 'Priority', render: (r: Rule) => (
      <span className="text-sm text-[var(--color-admin-text)]">{r.priority ?? '—'}</span>
    )},
    { key: 'isActive', label: 'Status', render: (r: Rule) => (
      <div className="flex items-center gap-2">
        {r.isActive ? <ToggleRight className="w-4 h-4 text-[var(--color-success)]" /> : <ToggleLeft className="w-4 h-4 text-[var(--color-admin-text-muted)]" />}
        <StatusBadge status={r.isActive ? 'active' : 'suspended'} />
      </div>
    )},
    { key: 'createdAt', label: 'Created', render: (r: Rule) => (
      <span className="text-sm text-[var(--color-admin-text-muted)]">
        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
      </span>
    )},
  ];

  return (
    <AdminSection title="Rules" description="Define and manage business rules and routing policies"
      tabs={[]} activeTab="" onTabChange={() => {}}
      actions={
        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors">
          <Plus className="w-4 h-4" /> Create Rule
        </button>
      }>
      <DataTable columns={columns} data={rules} keyExtractor={r => r.id}
        onRowClick={r => router.push(`/admin/rules/${r.id}`)}
        loading={loading} searchable searchPlaceholder="Search rules..."
        emptyState={
          <div className="p-12 text-center">
            <Scale className="w-12 h-12 mx-auto mb-4 text-[var(--color-admin-text-muted)]" />
            <p className="text-sm text-[var(--color-admin-text-muted)] mb-1">No rules configured</p>
            <p className="text-xs text-[var(--color-admin-text-muted)]">Rules determine how requests are processed and routed</p>
          </div>
        } />
    </AdminSection>
  );
}
