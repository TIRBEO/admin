'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSection, DataTable, StatusBadge } from '@tirbeo/ui';
import { apiFetch } from '../../lib';
import { Globe, Plus, ExternalLink } from 'lucide-react';

interface App {
  id: string;
  name: string;
  slug: string;
  description?: string;
  url?: string;
  icon?: string;
  isPublic?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export default function AppsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiFetch('/api/content/apps/admin').then(async r => {
      if (r.ok) { const d = await r.json(); setApps(d.apps || d.data || d || []); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'name', label: 'App', sortable: true, render: (a: App) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-surface)] flex items-center justify-center text-[var(--color-primary)] text-xs font-bold">
          {a.name[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-admin-text)]">{a.name}</p>
          <p className="text-xs text-[var(--color-admin-text-muted)]">{a.slug}</p>
        </div>
      </div>
    )},
    { key: 'description', label: 'Description', render: (a: App) => (
      <span className="text-sm text-[var(--color-admin-text-secondary)]">{a.description || '—'}</span>
    )},
    { key: 'url', label: 'URL', render: (a: App) => a.url ? (
      <a href={a.url} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline">
        {a.url.replace(/^https?:\/\//, '').split('/')[0]}
        <ExternalLink className="w-3 h-3" />
      </a>
    ) : <span className="text-sm text-[var(--color-admin-text-muted)]">—</span>},
    { key: 'isPublic', label: 'Visibility', render: (a: App) => (
      <StatusBadge status={a.isPublic ? 'active' : 'suspended'} label={a.isPublic ? 'Public' : 'Private'} />
    )},
    { key: 'isActive', label: 'Status', render: (a: App) => (
      <StatusBadge status={a.isActive ? 'active' : 'error'} />
    )},
  ];

  return (
    <AdminSection title="Apps" description="Manage registered applications in the platform ecosystem"
      tabs={[]} activeTab="" onTabChange={() => {}}
      actions={
        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors">
          <Plus className="w-4 h-4" /> Register App
        </button>
      }>
      <DataTable columns={columns} data={apps} keyExtractor={a => a.id}
        onRowClick={a => router.push(`/admin/apps/${a.id}`)}
        loading={loading} searchable searchPlaceholder="Search apps..."
        emptyState={
          <div className="p-12 text-center">
            <Globe className="w-12 h-12 mx-auto mb-4 text-[var(--color-admin-text-muted)]" />
            <p className="text-sm text-[var(--color-admin-text-muted)] mb-1">No apps registered</p>
            <p className="text-xs text-[var(--color-admin-text-muted)]">Register your first app to get started</p>
          </div>
        } />
    </AdminSection>
  );
}
