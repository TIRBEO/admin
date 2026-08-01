'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSection, DataTable, StatusBadge, PageToolbar } from '@tirbeo/ui';
import { apiFetch } from '../../../lib';
import { Plus } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  createdAt: string;
  type?: string;
}

export default function GroupsList() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    apiFetch('/api/admin/groups').then(async r => {
      if (r.ok) { const d = await r.json(); setGroups(d.groups || d.data || d || []); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'name', label: 'Group', sortable: true, render: (g: Group) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-warning-surface)] flex items-center justify-center text-[var(--color-warning)] text-xs font-medium">
          {g.name[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-admin-text)]">{g.name}</p>
          {g.description && <p className="text-xs text-[var(--color-admin-text-muted)]">{g.description}</p>}
        </div>
      </div>
    )},
    { key: 'type', label: 'Type', render: (g: Group) => (
      <StatusBadge status={g.type || 'custom'} dot={false} />
    )},
    { key: 'memberCount', label: 'Members', sortable: true, render: (g: Group) => (
      <span className="text-sm text-[var(--color-admin-text)]">{g.memberCount}</span>
    )},
    { key: 'createdAt', label: 'Created', sortable: true, render: (g: Group) => (
      <span className="text-sm text-[var(--color-admin-text-muted)]">{new Date(g.createdAt).toLocaleDateString()}</span>
    )},
  ];

  return (
    <AdminSection title="Groups" description="Create and manage user groups" tabs={[]} activeTab="" onTabChange={() => {}}
      actions={
        <button onClick={() => router.push('/admin/directory/groups/new')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors">
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      }>
      <DataTable columns={columns} data={groups} keyExtractor={g => g.id} onRowClick={g => router.push(`/admin/directory/groups/${g.id}`)}
        loading={loading} searchable searchPlaceholder="Search groups..." selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds}
        emptyState={
          <div className="p-12 text-center">
            <p className="text-sm text-[var(--color-admin-text-muted)] mb-4">No groups found</p>
            <button onClick={() => router.push('/admin/directory/groups/new')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium">
              Create your first group
            </button>
          </div>
        } />
    </AdminSection>
  );
}
