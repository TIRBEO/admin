'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminSection, DataTable, StatusBadge } from '@tirbeo/ui';
import { apiFetch, ApiError } from '../../../lib';

interface AdminRequest {
  id: string;
  status: string;
  fullName: string;
  submittedAt: string;
  notes: string | null;
  reason: string | null;
  referredBy: string | null;
  rejectionReason?: string | null;
  requestedRole?: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    photoUrl: string | null;
    createdAt: string;
  };
}

type Tab = 'pending' | 'approved' | 'rejected' | 'all';

const TABS: { id: Tab; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
];

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'editor', label: 'Editor' },
];

export default function AdminRequestsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId as Tab);
  }, []);
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/admin/requests');
      if (!res.ok) throw new Error('Failed to load requests');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleReview = async (reqId: string, action: 'approve' | 'reject', role?: string, rejectionReason?: string) => {
    setActionLoading(reqId + action);
    try {
      const body: any = { action, role: action === 'approve' ? (role || 'admin') : undefined };
      if (action === 'reject' && rejectionReason) {
        body.notes = rejectionReason;
      }
      const res = await apiFetch('/api/admin/requests/' + reqId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || err?.message || 'Action failed');
      }
      await loadRequests();
    } catch (err: any) {
      setError(err?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = requests.filter(r => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (r: AdminRequest) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[var(--primary-surface)] flex items-center justify-center text-[var(--primary)] text-sm font-medium overflow-hidden">
            {r.user.photoUrl ? (
              <img src={r.user.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (r.user.name || r.user.email)[0]?.toUpperCase() || '?'
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text)]">{r.user.name || r.fullName || '—'}</p>
            <p className="text-xs text-[var(--text-muted)]">{r.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'requestedRole',
      label: 'Requested Role',
      render: (r: AdminRequest) => (
        <span className="text-sm text-[var(--text)]">{r.requestedRole || 'admin'}</span>
      ),
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (r: AdminRequest) => (
        <span className="text-sm text-[var(--text-muted)] max-w-[200px] truncate" title={r.reason || ''}>
          {r.reason || '—'}
        </span>
      ),
    },
    {
      key: 'referredBy',
      label: 'Referred By',
      render: (r: AdminRequest) => (
        <span className="text-sm text-[var(--text-muted)]">{r.referredBy || '—'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r: AdminRequest) => <StatusBadge status={r.status} />,
    },
    {
      key: 'submittedAt',
      label: 'Submitted',
      render: (r: AdminRequest) => (
        <span className="text-sm text-[var(--text-muted)]">
          {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r: AdminRequest) => {
        if (r.status !== 'pending') return <span className="text-xs text-[var(--text-muted)]">—</span>;
        return (
          <div className="flex items-center gap-2">
            <select
              defaultValue="admin"
              className="h-8 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text)] outline-none focus:border-[var(--primary)]"
              id={`role-${r.id}`}
            >
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={() => {
                const select = document.getElementById(`role-${r.id}`) as HTMLSelectElement | null;
                handleReview(r.id, 'approve', select?.value);
              }}
              disabled={actionLoading === r.id + 'approve'}
              className="h-8 px-3 rounded-md bg-[var(--success)] text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              {actionLoading === r.id + 'approve' ? '...' : 'Approve'}
            </button>
            <button
              onClick={() => {
                const reason = prompt('Enter rejection reason (optional):');
                handleReview(r.id, 'reject', undefined, reason || undefined);
              }}
              disabled={actionLoading === r.id + 'reject'}
              className="h-8 px-3 rounded-md bg-[var(--error)] text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              {actionLoading === r.id + 'reject' ? '...' : 'Deny'}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <AdminSection
      title="Admin Requests"
      description="Review and manage admin access requests"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      actions={
        <span className="text-sm text-[var(--text-muted)]">
          {pendingCount > 0 ? `${pendingCount} pending` : 'No pending requests'}
        </span>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--error-surface)] border border-[var(--error)]">
          <p className="text-sm text-[var(--error)]">{error}</p>
        </div>
      )}
      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={r => r.id}
        loading={loading}
        searchable
        searchPlaceholder="Search requests..."
        emptyState={
          <div className="p-12 text-center">
            <p className="text-sm text-[var(--text-muted)]">No requests found</p>
          </div>
        }
      />
    </AdminSection>
  );
}
