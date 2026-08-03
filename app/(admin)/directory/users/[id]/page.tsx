'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { EntityPage, StatusBadge, DataTable } from '@tirbeo/ui';
import { apiFetch } from '../../../../lib';
import { Shield, Users, Key, Activity, Settings, AlertTriangle } from 'lucide-react';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    apiFetch(`/api/admin/users/${id}`).then(async r => {
      if (r.ok) { const d = await r.json(); setUser(d.user || d.data || d); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'access', label: 'Access', icon: Shield },
    { id: 'roles', label: 'Roles', icon: Users },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'security', label: 'Security', icon: Key },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-[var(--color-admin-surface-hover)] rounded" />
        <div className="h-6 w-48 bg-[var(--color-admin-surface-hover)] rounded" />
        <div className="h-64 bg-[var(--color-admin-surface-hover)] rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 lg:p-8">
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[var(--color-error)]" />
          <h3 className="text-lg font-medium text-[var(--color-admin-text)] mb-2">User not found</h3>
          <p className="text-sm text-[var(--color-admin-text-secondary)] mb-4">The user you are looking for does not exist or has been removed.</p>
          <button onClick={() => router.push('/admin/directory/users')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium">
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  const statusColor = user.isSuspended ? 'var(--color-error)' : user.isBanned ? 'var(--color-error)' : 'var(--color-success)';
  const statusLabel = user.isSuspended ? 'Suspended' : user.isBanned ? 'Banned' : 'Active';

  return (
    <EntityPage title={user.name || user.email || 'Unknown User'} subtitle={user.email}
      status={{ label: statusLabel, color: statusColor }}
      tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}
      breadcrumbs={[
        { label: 'Directory', href: '/admin/directory' },
        { label: 'Users', href: '/admin/directory/users' },
        { label: user.name || user.email || id },
      ]}
      onNavigate={router.push}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(`/admin/directory/users/${id}/edit`)}
            className="px-4 py-2 rounded-lg border border-[var(--color-admin-border)] text-sm font-medium text-[var(--color-admin-text-secondary)] hover:bg-[var(--color-admin-surface-hover)] transition-colors">
            Edit
          </button>
          <button onClick={() => {/* suspend handler */}}
            className="px-4 py-2 rounded-lg bg-[var(--color-error)] text-white text-sm font-medium hover:opacity-90 transition-opacity">
            {user.isSuspended ? 'Unsuspend' : 'Suspend'}
          </button>
        </div>
      }>
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6">
              <h3 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider mb-4">User Information</h3>
              <dl className="space-y-4">
                <div className="flex justify-between"><dt className="text-sm text-[var(--color-admin-text-muted)]">Name</dt><dd className="text-sm text-[var(--color-admin-text)]">{user.name || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-sm text-[var(--color-admin-text-muted)]">Email</dt><dd className="text-sm text-[var(--color-admin-text)]">{user.email}</dd></div>
                <div className="flex justify-between"><dt className="text-sm text-[var(--color-admin-text-muted)]">Role</dt><dd className="text-sm"><StatusBadge status={user.adminRole || 'member'} dot={false} /></dd></div>
                <div className="flex justify-between"><dt className="text-sm text-[var(--color-admin-text-muted)]">Joined</dt><dd className="text-sm text-[var(--color-admin-text)]">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-sm text-[var(--color-admin-text-muted)]">Last Active</dt><dd className="text-sm text-[var(--color-admin-text)]">{user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'Never'}</dd></div>
              </dl>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6">
              <h3 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button onClick={() => setActiveTab('security')} className="w-full p-3 rounded-lg border border-[var(--color-admin-border)] text-left text-sm hover:bg-[var(--color-admin-surface-hover)] transition-colors">
                  <Shield className="w-4 h-4 inline mr-2 text-[var(--color-primary)]" />Manage Security
                </button>
                <button onClick={() => setActiveTab('roles')} className="w-full p-3 rounded-lg border border-[var(--color-admin-border)] text-left text-sm hover:bg-[var(--color-admin-surface-hover)] transition-colors">
                  <Key className="w-4 h-4 inline mr-2 text-[var(--color-warning)]" />Assign Roles
                </button>
                <button onClick={() => setActiveTab('activity')} className="w-full p-3 rounded-lg border border-[var(--color-admin-border)] text-left text-sm hover:bg-[var(--color-admin-surface-hover)] transition-colors">
                  <Activity className="w-4 h-4 inline mr-2 text-[var(--color-info)]" />View Activity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'access' && (
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6">
          <p className="text-sm text-[var(--color-admin-text-muted)]">Access management content</p>
        </div>
      )}
      {activeTab === 'roles' && (
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6">
          <p className="text-sm text-[var(--color-admin-text-muted)]">Role assignments content</p>
        </div>
      )}
      {activeTab === 'groups' && (
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6">
          <p className="text-sm text-[var(--color-admin-text-muted)]">Group memberships content</p>
        </div>
      )}
      {activeTab === 'security' && (
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6">
          <p className="text-sm text-[var(--color-admin-text-muted)]">Security settings content</p>
        </div>
      )}
      {activeTab === 'activity' && (
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6">
          <p className="text-sm text-[var(--color-admin-text-muted)]">Activity log content</p>
        </div>
      )}
    </EntityPage>
  );
}
