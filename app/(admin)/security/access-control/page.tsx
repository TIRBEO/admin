'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSection, DataTable, StatusBadge, PageToolbar } from '@tirbeo/ui';
import { apiFetch } from '../../../lib';
import { Shield, Plus, Check, X } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description?: string;
  permissionCount: number;
  userCount: number;
  isSystem?: boolean;
}

const defaultPermissions = [
  { category: 'Users', permissions: ['users.read', 'users.create', 'users.edit', 'users.delete', 'users.suspend'] },
  { category: 'Content', permissions: ['content.read', 'content.create', 'content.edit', 'content.delete', 'content.moderate'] },
  { category: 'Settings', permissions: ['settings.read', 'settings.edit', 'settings.security'] },
  { category: 'Billing', permissions: ['billing.read', 'billing.edit', 'billing.refund'] },
  { category: 'Analytics', permissions: ['analytics.read', 'analytics.export'] },
];

function PermissionsEditor({ roleId, initialPermissions }: { roleId: string; initialPermissions: string[] }) {
  const [perms, setPerms] = useState<string[]>(initialPermissions);

  const togglePermission = (perm: string) => {
    const next = perms.includes(perm) ? perms.filter(p => p !== perm) : [...perms, perm];
    setPerms(next);
    apiFetch(`/api/admin/roles/${roleId}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify({ permissions: next }),
    }).catch(() => {});
  };

  return (
    <div className="space-y-4">
      {defaultPermissions.map(group => (
        <div key={group.category}>
          <h4 className="text-xs font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider mb-2">{group.category}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {group.permissions.map(perm => {
              const enabled = perms.includes(perm);
              return (
                <button key={perm} onClick={() => togglePermission(perm)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    enabled
                      ? 'bg-[var(--color-primary-surface)] border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'border-[var(--color-admin-border)] text-[var(--color-admin-text-secondary)] hover:bg-[var(--color-admin-surface-hover)]'
                  }`}>
                  {enabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {perm.split('.').pop()}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AccessControl() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    apiFetch('/api/admin/roles').then(async r => {
      if (r.ok) { const d = await r.json(); setRoles(d.roles || d.data || d || []); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedRole) {
      apiFetch(`/api/admin/roles/${selectedRole}`).then(async r => {
        if (r.ok) { const d = await r.json(); setRolePermissions(d.permissions || []); }
      }).catch(() => {});
    }
  }, [selectedRole]);

  const columns = [
    { key: 'name', label: 'Role', sortable: true, render: (r: Role) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-surface)] flex items-center justify-center text-[var(--color-primary)] text-xs font-medium">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-admin-text)]">{r.name}</p>
          {r.description && <p className="text-xs text-[var(--color-admin-text-muted)]">{r.description}</p>}
        </div>
      </div>
    )},
    { key: 'type', label: 'Type', render: (r: Role) => (
      <StatusBadge status={r.isSystem ? 'system' : 'custom'} dot={false} />
    )},
    { key: 'permissionCount', label: 'Permissions', render: (r: Role) => (
      <span className="text-sm text-[var(--color-admin-text)]">{r.permissionCount}</span>
    )},
    { key: 'userCount', label: 'Users', render: (r: Role) => (
      <span className="text-sm text-[var(--color-admin-text)]">{r.userCount}</span>
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
    <AdminSection title="Access Control" description="Manage roles and permissions"
      tabs={tabs} activeTab="access-control" onTabChange={id => router.push(`/admin/security/${id === 'overview' ? '' : id}`)}
      actions={
        <button onClick={() => router.push('/admin/security/access-control/new')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors">
          <Plus className="w-4 h-4" />
          Create Role
        </button>
      }>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider mb-3">Roles</h3>
          <DataTable columns={columns} data={roles} keyExtractor={r => r.id}
            onRowClick={r => setSelectedRole(r.id)}
            loading={loading}
            emptyState={
              <div className="p-12 text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-[var(--color-admin-text-muted)]" />
                <p className="text-sm text-[var(--color-admin-text-muted)]">No roles defined</p>
              </div>
            } />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider mb-3">
            Permissions {selectedRole ? `— ${roles.find(r => r.id === selectedRole)?.name || ''}` : ''}
          </h3>
          <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-5">
            {selectedRole ? (
              <PermissionsEditor roleId={selectedRole} initialPermissions={rolePermissions} />
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-[var(--color-admin-text-muted)]">Select a role to edit permissions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminSection>
  );
}
