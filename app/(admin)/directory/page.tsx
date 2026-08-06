'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSection } from '@tirbeo/ui';
import { apiFetch } from '../../lib';
import { Users, UserPlus, UserX } from 'lucide-react';

export default function DirectoryOverview() {
  const [stats, setStats] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    apiFetch('/api/admin/stats').then(async r => { if (r.ok) { const d = await r.json(); setStats(d.counts || d); } }).catch(() => {});
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <AdminSection title="Directory" description="Manage users and directory settings"
      tabs={tabs} activeTab="overview" onTabChange={id => router.push(`/admin/directory/${id === 'overview' ? '' : id}`)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[var(--color-admin-text-secondary)]">Total Users</span>
            <Users className="w-4 h-4 text-[var(--color-primary)]" />
          </div>
          <p className="text-2xl font-semibold text-[var(--color-admin-text)]">{stats?.users?.toLocaleString() || '—'}</p>
        </div>
        <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[var(--color-admin-text-secondary)]">Active Users</span>
            <UserPlus className="w-4 h-4 text-[var(--color-success)]" />
          </div>
          <p className="text-2xl font-semibold text-[var(--color-admin-text)]">—</p>
        </div>
        <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[var(--color-admin-text-secondary)]">Suspended</span>
            <UserX className="w-4 h-4 text-[var(--color-error)]" />
          </div>
          <p className="text-2xl font-semibold text-[var(--color-admin-text)]">—</p>
        </div>
      </div>
      <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6">
        <h3 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider mb-4">Quick Links</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <button onClick={() => router.push('/admin/directory/users')}
            className="p-4 rounded-lg border-2 border-[var(--color-admin-border)] hover:bg-[var(--color-admin-surface-hover)] transition-colors text-left">
            <Users className="w-5 h-5 text-[var(--color-primary)] mb-2" />
            <p className="text-sm font-medium text-[var(--color-admin-text)]">Manage Users</p>
            <p className="text-xs text-[var(--color-admin-text-muted)] mt-0.5">Add, edit, and manage user accounts</p>
          </button>

        </div>
      </div>
    </AdminSection>
  );
}
