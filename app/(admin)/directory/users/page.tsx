'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSection, DataTable, StatusBadge } from '@tirbeo/ui';
import { apiFetch } from '../../../lib';

interface User {
  id: string;
  email: string;
  name?: string;
  adminRole?: string;
  lastActiveAt?: string;
  isSuspended?: boolean;
  isBanned?: boolean;
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    apiFetch('/api/admin/users').then(async r => {
      if (r.ok) { const d = await r.json(); setUsers(d.users || d.data || d || []); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'name', label: 'User', sortable: true, render: (u: User) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[var(--color-primary-surface)] flex items-center justify-center text-[var(--color-primary)] text-xs font-medium">
          {(u.name || u.email)[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-admin-text)]">{u.name || '—'}</p>
          <p className="text-xs text-[var(--color-admin-text-muted)]">{u.email}</p>
        </div>
      </div>
    )},
    { key: 'adminRole', label: 'Role', render: (u: User) => (
      <StatusBadge status={u.adminRole || 'member'} dot={false} />
    )},
    { key: 'status', label: 'Status', render: (u: User) => (
      <StatusBadge status={u.isSuspended ? 'suspended' : u.isBanned ? 'error' : 'active'} />
    )},
    { key: 'lastActiveAt', label: 'Last Active', render: (u: User) => (
      <span className="text-sm text-[var(--color-admin-text-muted)]">
        {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : 'Never'}
      </span>
    )},
  ];

  return (
    <AdminSection title="Users" description="Manage all user accounts" tabs={[]} activeTab="" onTabChange={() => {}}
      actions={
        <button onClick={() => router.push('/admin/directory/users/new')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors">
          Add User
        </button>
      }>
      <DataTable columns={columns} data={users} keyExtractor={u => u.id} onRowClick={u => router.push(`/admin/directory/users/${u.id}`)}
        loading={loading} searchable searchPlaceholder="Search users..." selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds}
        emptyState={
          <div className="p-12 text-center">
            <p className="text-sm text-[var(--color-admin-text-muted)] mb-4">No users found</p>
            <button onClick={() => router.push('/admin/directory/users/new')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium">
              Add your first user
            </button>
          </div>
        } />
    </AdminSection>
  );
}
