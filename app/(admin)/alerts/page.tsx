'use client';

import { useEffect, useState } from 'react';
import { AdminSection, DataTable, StatusBadge } from '@tirbeo/ui';
import { apiFetch } from '../../lib';
import { BellRing, AlertTriangle, CheckCircle, Clock, Filter } from 'lucide-react';

interface Incident {
  id: string;
  title: string;
  description?: string;
  severity: string;
  status: string;
  services?: any;
  createdAt?: string;
  resolvedAt?: string;
  owner?: { name?: string; email?: string };
}

export default function AlertsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    apiFetch('/api/content/incidents').then(async r => {
      if (r.ok) { const d = await r.json(); setIncidents(d.incidents || d.data || d || []); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? incidents : incidents.filter(i => i.severity === filter || i.status === filter);

  const severityColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'var(--color-error)';
      case 'major': return 'var(--color-warning)';
      case 'minor': return 'var(--color-info)';
      default: return 'var(--color-admin-text-muted)';
    }
  };

  const columns = [
    { key: 'title', label: 'Incident', sortable: true, render: (i: Incident) => (
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: severityColor(i.severity) }} />
        <div>
          <p className="text-sm font-medium text-[var(--color-admin-text)]">{i.title}</p>
          {i.description && <p className="text-xs text-[var(--color-admin-text-muted)] truncate max-w-md">{i.description}</p>}
        </div>
      </div>
    )},
    { key: 'severity', label: 'Severity', render: (i: Incident) => (
      <StatusBadge status={i.severity === 'critical' ? 'error' : i.severity === 'major' ? 'suspended' : 'active'}
        label={i.severity?.charAt(0).toUpperCase() + i.severity?.slice(1)} />
    )},
    { key: 'status', label: 'Status', render: (i: Incident) => (
      <StatusBadge status={i.status === 'resolved' ? 'active' : i.status === 'monitoring' ? 'suspended' : 'error'}
        label={i.status?.charAt(0).toUpperCase() + i.status?.slice(1)} />
    )},
    { key: 'services', label: 'Services', render: (i: Incident) => (
      <span className="text-sm text-[var(--color-admin-text-muted)]">
        {Array.isArray(i.services) ? i.services.join(', ') : i.services || '—'}
      </span>
    )},
    { key: 'createdAt', label: 'Created', render: (i: Incident) => (
      <span className="text-sm text-[var(--color-admin-text-muted)]">
        {i.createdAt ? new Date(i.createdAt).toLocaleDateString() : '—'}
      </span>
    )},
  ];

  const tabs = [
    { id: 'all', label: 'All Incidents' },
    { id: 'active', label: 'Active' },
    { id: 'critical', label: 'Critical' },
    { id: 'major', label: 'Major' },
    { id: 'resolved', label: 'Resolved' },
  ];

  return (
    <AdminSection title="Alert Center" description="View and manage system incidents and alerts"
      tabs={tabs} activeTab={filter} onTabChange={setFilter}>
      <DataTable columns={columns} data={filtered} keyExtractor={i => i.id}
        loading={loading} searchable searchPlaceholder="Search incidents..."
        emptyState={
          <div className="p-12 text-center">
            <BellRing className="w-12 h-12 mx-auto mb-4 text-[var(--color-success)]" />
            <h3 className="text-lg font-medium text-[var(--color-admin-text)] mb-2">All Clear</h3>
            <p className="text-sm text-[var(--color-admin-text-secondary)]">No incidents reported</p>
          </div>
        } />
    </AdminSection>
  );
}
