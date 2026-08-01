'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSection, DataTable, StatusBadge } from '@tirbeo/ui';
import { apiFetch } from '../../lib';
import { CreditCard, Plus, DollarSign, Users, TrendingUp } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency?: string;
  interval?: string;
  description?: string;
  isPublic?: boolean;
  isFree?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  features?: any;
  limits?: any;
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      apiFetch('/api/content/plans/admin').then(r => r.ok ? r.json() : null),
      apiFetch('/api/admin/stats').then(r => r.ok ? r.json() : null),
    ]).then(([plansData, statsData]) => {
      if (plansData) setPlans(plansData.plans || plansData.data || plansData || []);
      if (statsData) setStats(statsData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'name', label: 'Plan', sortable: true, render: (p: Plan) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-surface)] flex items-center justify-center text-[var(--color-primary)] text-xs font-bold">
          {p.name[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-admin-text)]">{p.name}</p>
          <p className="text-xs text-[var(--color-admin-text-muted)]">{p.slug}</p>
        </div>
      </div>
    )},
    { key: 'price', label: 'Price', render: (p: Plan) => (
      <span className="text-sm font-medium text-[var(--color-admin-text)]">
        {p.isFree ? 'Free' : `${p.currency || 'USD'} ${(p.price / 100).toFixed(2)}/${p.interval || 'month'}`}
      </span>
    )},
    { key: 'isPublic', label: 'Visibility', render: (p: Plan) => (
      <StatusBadge status={p.isPublic ? 'active' : 'suspended'} label={p.isPublic ? 'Public' : 'Hidden'} />
    )},
    { key: 'isActive', label: 'Status', render: (p: Plan) => (
      <StatusBadge status={p.isActive ? 'active' : 'error'} />
    )},
    { key: 'sortOrder', label: 'Sort Order', render: (p: Plan) => (
      <span className="text-sm text-[var(--color-admin-text-muted)]">{p.sortOrder ?? '—'}</span>
    )},
  ];

  if (loading) {
    return (
      <div className="p-6 lg:p-8 animate-pulse space-y-4">
        <div className="h-8 w-48 bg-[var(--color-admin-surface-hover)] rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-[var(--color-admin-surface-hover)] rounded-xl" />)}
        </div>
        <div className="h-64 bg-[var(--color-admin-surface-hover)] rounded-xl" />
      </div>
    );
  }

  return (
    <AdminSection title="Billing" description="Manage subscription plans, pricing, and billing"
      tabs={[]} activeTab="" onTabChange={() => {}}
      actions={
        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors">
          <Plus className="w-4 h-4" /> Create Plan
        </button>
      }>
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--color-admin-text-secondary)] uppercase tracking-wider">Active Plans</span>
            <CreditCard className="w-4 h-4 text-[var(--color-primary)]" />
          </div>
          <p className="text-xl font-semibold text-[var(--color-admin-text)]">{plans.filter(p => p.isActive !== false).length}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--color-admin-text-secondary)] uppercase tracking-wider">Total Subscribers</span>
            <Users className="w-4 h-4 text-[var(--color-info)]" />
          </div>
          <p className="text-xl font-semibold text-[var(--color-admin-text)]">{stats.subscriptions || stats.totalSubscriptions || '—'}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--color-admin-text-secondary)] uppercase tracking-wider">MRR</span>
            <TrendingUp className="w-4 h-4 text-[var(--color-success)]" />
          </div>
          <p className="text-xl font-semibold text-[var(--color-admin-text)]">{stats.mrr ? `$${(stats.mrr / 100).toLocaleString()}` : '—'}</p>
        </div>
      </div>

      <DataTable columns={columns} data={plans} keyExtractor={p => p.id}
        onRowClick={p => router.push(`/admin/billing/${p.id}`)}
        loading={loading} searchable searchPlaceholder="Search plans..."
        emptyState={
          <div className="p-12 text-center">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-[var(--color-admin-text-muted)]" />
            <p className="text-sm text-[var(--color-admin-text-muted)] mb-1">No billing plans configured</p>
            <p className="text-xs text-[var(--color-admin-text-muted)]">Create your first plan to start accepting payments</p>
          </div>
        } />
    </AdminSection>
  );
}
