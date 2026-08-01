'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSection, DataTable, StatusBadge } from '@tirbeo/ui';
import { apiFetch } from '../../lib';
import { MessageSquare, Plus, AlertCircle } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  priority: string;
  status: string;
  customer?: { name?: string; email?: string };
  assignedTo?: { name?: string; email?: string };
  queue?: { name?: string };
  createdAt?: string;
  updatedAt?: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    apiFetch('/api/support/tickets').then(async r => {
      if (r.ok) { const d = await r.json(); setTickets(d.tickets || d.data || d || []); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  const priorityColor = (p: string) => {
    switch (p) {
      case 'critical': case 'urgent': return 'var(--color-error)';
      case 'high': return 'var(--color-warning)';
      case 'medium': return 'var(--color-info)';
      case 'low': return 'var(--color-success)';
      default: return 'var(--color-admin-text-muted)';
    }
  };

  const columns = [
    { key: 'subject', label: 'Subject', sortable: true, render: (t: Ticket) => (
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: priorityColor(t.priority) }} />
        <div>
          <p className="text-sm font-medium text-[var(--color-admin-text)]">{t.subject}</p>
          <p className="text-xs text-[var(--color-admin-text-muted)]">{t.customer?.name || t.customer?.email || 'Unknown'}</p>
        </div>
      </div>
    )},
    { key: 'priority', label: 'Priority', render: (t: Ticket) => (
      <StatusBadge status={t.priority === 'critical' || t.priority === 'urgent' ? 'error' : t.priority === 'high' ? 'suspended' : t.priority === 'medium' ? 'active' : 'active'}
        label={t.priority?.charAt(0).toUpperCase() + t.priority?.slice(1)} />
    )},
    { key: 'status', label: 'Status', render: (t: Ticket) => (
      <StatusBadge status={t.status === 'open' ? 'active' : t.status === 'in_progress' ? 'suspended' : 'error'}
        label={t.status === 'in_progress' ? 'In Progress' : t.status?.charAt(0).toUpperCase() + t.status?.slice(1)} />
    )},
    { key: 'assignedTo', label: 'Assigned To', render: (t: Ticket) => (
      <span className="text-sm text-[var(--color-admin-text)]">
        {t.assignedTo?.name || t.assignedTo?.email || <span className="text-[var(--color-admin-text-muted)]">Unassigned</span>}
      </span>
    )},
    { key: 'createdAt', label: 'Created', render: (t: Ticket) => (
      <span className="text-sm text-[var(--color-admin-text-muted)]">
        {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
      </span>
    )},
  ];

  const tabs = [
    { id: 'all', label: 'All Tickets' },
    { id: 'open', label: 'Open' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'closed', label: 'Closed' },
  ];

  return (
    <AdminSection title="Support" description="Manage support tickets and customer inquiries"
      tabs={tabs} activeTab={filter} onTabChange={setFilter}
      actions={
        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors">
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      }>
      <DataTable columns={columns} data={filtered} keyExtractor={t => t.id}
        onRowClick={t => router.push(`/admin/support/${t.id}`)}
        loading={loading} searchable searchPlaceholder="Search tickets..."
        emptyState={
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[var(--color-admin-text-muted)]" />
            <h3 className="text-lg font-medium text-[var(--color-admin-text)] mb-2">No tickets found</h3>
            <p className="text-sm text-[var(--color-admin-text-secondary)]">{filter === 'all' ? 'No support tickets yet' : `No ${filter} tickets`}</p>
          </div>
        } />
    </AdminSection>
  );
}
