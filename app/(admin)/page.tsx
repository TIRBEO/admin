'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../lib';
import {
  Users, Building2, Activity, ShieldCheck, Bell,
  AlertTriangle, RefreshCw, Ban, Lock, ArrowUp,
} from 'lucide-react';

interface Counts {
  users: number;
  organizations: number;
  routes: number;
  auditEvents: number;
  blocked: number;
}

interface SecurityStats {
  today: { total: number; critical: number };
  total: number;
  activeBlocks: number;
}

interface ActivityItem {
  id: string;
  action: string;
  actor: string;
  target?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [security, setSecurity] = useState<SecurityStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      apiFetch('/api/admin/stats').then(r => r.ok ? r.json() : null),
      apiFetch('/api/admin/security/events?limit=1').then(r => r.ok ? r.json() : null),
      apiFetch('/api/admin/activity').then(r => r.ok ? r.json() : null),
    ]).then(([statsData, securityData, activityData]) => {
      if (statsData) setCounts(statsData.counts || statsData);
      if (securityData?.stats) setSecurity(securityData.stats);
      if (activityData) setActivity(activityData.logs?.slice(0, 8) || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[var(--color-admin-surface-hover)] rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-[var(--color-admin-surface-hover)] rounded-xl" />)}
        </div>
        <div className="h-64 bg-[var(--color-admin-surface-hover)] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--color-admin-text)]">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--color-admin-text-secondary)]">System overview and monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-admin-border)] text-sm font-medium text-[var(--color-admin-text-secondary)] hover:bg-[var(--color-admin-surface-hover)] transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[var(--color-admin-text-secondary)]">Total Users</span>
            <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-surface)] flex items-center justify-center">
              <Users className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-[var(--color-admin-text)]">{counts?.users?.toLocaleString() || '—'}</p>
          <div className="flex items-center gap-1 mt-2">
            <Building2 className="w-3.5 h-3.5 text-[var(--color-admin-text-muted)]" />
            <span className="text-xs text-[var(--color-admin-text-muted)]">{counts?.organizations?.toLocaleString() || 0} organizations</span>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[var(--color-admin-text-secondary)]">Audit Events</span>
            <div className="w-9 h-9 rounded-lg bg-[var(--color-success-surface)] flex items-center justify-center">
              <Activity className="w-4 h-4 text-[var(--color-success)]" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-[var(--color-admin-text)]">{counts?.auditEvents?.toLocaleString() || '—'}</p>
          <div className="flex items-center gap-1 mt-2">
            <Lock className="w-3.5 h-3.5 text-[var(--color-admin-text-muted)]" />
            <span className="text-xs text-[var(--color-admin-text-muted)]">logged system actions</span>
          </div>
        </div>

        <button onClick={() => router.push('/admin/security/events')}
          className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-5 text-left hover:shadow-sm hover:bg-[var(--color-admin-surface-hover)] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[var(--color-admin-text-secondary)]">Security Events</span>
            <div className="w-9 h-9 rounded-lg bg-[var(--color-warning-surface)] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[var(--color-warning)]" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-[var(--color-admin-text)]">{security?.today?.total?.toLocaleString() || 0}</p>
          <div className="flex items-center gap-1 mt-2">
            {security?.today?.critical ? (
              <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-error)]" />
            ) : (
              <ArrowUp className="w-3.5 h-3.5 text-[var(--color-success)]" />
            )}
            <span className="text-xs text-[var(--color-admin-text-muted)]">
              {security?.today?.critical ? `${security.today.critical} critical today` : 'today · no critical'}
            </span>
          </div>
        </button>

        <button onClick={() => router.push('/admin/security/blocks')}
          className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-5 text-left hover:shadow-sm hover:bg-[var(--color-admin-surface-hover)] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[var(--color-admin-text-secondary)]">Blocked Targets</span>
            <div className="w-9 h-9 rounded-lg bg-[var(--color-error-surface)] flex items-center justify-center">
              <Ban className="w-4 h-4 text-[var(--color-error)]" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-[var(--color-admin-text)]">{security?.activeBlocks ?? counts?.blocked ?? 0}</p>
          <div className="flex items-center gap-1 mt-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-error)]" />
            <span className="text-xs text-[var(--color-admin-text-muted)]">active IP / user / email blocks</span>
          </div>
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6">
          <h2 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Add User', href: '/admin/directory/users', icon: Users, color: 'var(--color-primary)' },
              { label: 'Security Events', href: '/admin/security/events', icon: ShieldCheck, color: 'var(--color-warning)' },
              { label: 'Blocklist', href: '/admin/security/blocks', icon: Ban, color: 'var(--color-error)' },
              { label: 'Alerts', href: '/admin/alerts', icon: Bell, color: 'var(--color-success)' },
            ].map(action => (
              <button key={action.label} onClick={() => router.push(action.href)}
                className="flex items-center gap-4 p-4 rounded-lg border border-[var(--color-admin-border)] hover:bg-[var(--color-admin-surface-hover)] transition-colors text-left">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: action.color + '18' }}>
                  <action.icon className="w-5 h-5" style={{ color: action.color }} />
                </div>
                <span className="text-sm font-medium text-[var(--color-admin-text)]">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider">Recent Activity</h2>
            <button onClick={() => router.push('/admin/security/audit')} className="text-xs font-medium text-[var(--color-primary)] hover:underline">View all</button>
          </div>
          {activity.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 mx-auto mb-2 text-[var(--color-admin-text-muted)]" />
              <p className="text-sm text-[var(--color-admin-text-muted)]">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activity.map((item, i) => (
                <div key={item.id || i} className="flex items-start gap-4 p-2 rounded-lg hover:bg-[var(--color-admin-surface-hover)] transition-colors">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-admin-text)] truncate">
                      {item.actor} <span className="text-[var(--color-admin-text-secondary)]">{item.action}</span>
                      {item.target && <span className="text-[var(--color-admin-text-muted)]"> — {item.target}</span>}
                    </p>
                    <p className="text-xs text-[var(--color-admin-text-muted)] mt-0.5">
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
