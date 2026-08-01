'use client';

import { useEffect, useState } from 'react';
import { DataTable, AdminSection, StatusBadge } from '@tirbeo/ui';
import { apiFetch } from '../../lib';
import { Smartphone, Monitor, AlertTriangle } from 'lucide-react';

interface DeviceSession {
  id: string;
  deviceName?: string;
  userAgent?: string;
  ipAddress?: string;
  location?: string;
  lastUsedAt?: string;
  createdAt?: string;
  status?: string;
  user?: { name?: string; email?: string };
}

export default function DevicesPage() {
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    apiFetch('/api/admin/activity').then(async r => {
      if (r.ok) { const d = await r.json(); setSessions(d.sessions || d.data || []); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'device', label: 'Device', sortable: true, render: (s: DeviceSession) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-surface)] flex items-center justify-center">
          <Smartphone className="w-4 h-4 text-[var(--color-primary)]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-admin-text)]">{s.deviceName || 'Unknown Device'}</p>
          <p className="text-xs text-[var(--color-admin-text-muted)]">{s.userAgent?.slice(0, 60) || '—'}</p>
        </div>
      </div>
    )},
    { key: 'user', label: 'User', render: (s: DeviceSession) => (
      <span className="text-sm text-[var(--color-admin-text)]">{s.user?.name || s.user?.email || '—'}</span>
    )},
    { key: 'ipAddress', label: 'IP Address', render: (s: DeviceSession) => (
      <span className="text-sm text-[var(--color-admin-text-muted)]">{s.ipAddress || '—'}</span>
    )},
    { key: 'location', label: 'Location', render: (s: DeviceSession) => (
      <span className="text-sm text-[var(--color-admin-text-muted)]">{s.location || '—'}</span>
    )},
    { key: 'lastUsedAt', label: 'Last Active', render: (s: DeviceSession) => (
      <span className="text-sm text-[var(--color-admin-text-muted)]">
        {s.lastUsedAt ? new Date(s.lastUsedAt).toLocaleDateString() : '—'}
      </span>
    )},
    { key: 'status', label: 'Status', render: (s: DeviceSession) => (
      <StatusBadge status={s.status || 'active'} />
    )},
  ];

  return (
    <AdminSection title="Devices" description="Manage active user sessions and connected devices"
      tabs={[]} activeTab="" onTabChange={() => {}}
      actions={
        selectedIds.size > 0 && (
          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-error)] text-white text-sm font-medium hover:opacity-90 transition-opacity">
            <AlertTriangle className="w-4 h-4" /> Revoke ({selectedIds.size})
          </button>
        )
      }>
      <DataTable columns={columns} data={sessions} keyExtractor={s => s.id}
        loading={loading} searchable searchPlaceholder="Search devices..."
        selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds}
        emptyState={
          <div className="p-12 text-center">
            <Monitor className="w-12 h-12 mx-auto mb-4 text-[var(--color-admin-text-muted)]" />
            <p className="text-sm text-[var(--color-admin-text-muted)]">No active device sessions found</p>
          </div>
        } />
    </AdminSection>
  );
}
