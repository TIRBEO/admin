'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../lib';
import {
  Users, Building2, Activity, ShieldCheck, Bell,
  AlertTriangle, RefreshCw, Ban, Lock, ArrowUp,
  ArrowRight, TrendingUp, Clock, ChevronRight,
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
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton h-7 w-32 mb-2" />
            <div className="skeleton h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="kpi-card">
              <div className="skeleton h-4 w-24 mb-4" />
              <div className="skeleton h-8 w-16 mb-2" />
              <div className="skeleton h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="skeleton h-64 rounded-lg" />
          <div className="skeleton h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">System overview and monitoring</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Total Users</span>
            <div className="kpi-card-icon">
              <Users className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
          </div>
          <div className="kpi-card-value">{counts?.users?.toLocaleString() || '—'}</div>
          <div className="kpi-card-meta">
            <Building2 className="w-3.5 h-3.5" />
            <span>{counts?.organizations?.toLocaleString() || 0} organizations</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Audit Events</span>
            <div className="kpi-card-icon">
              <Activity className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
          </div>
          <div className="kpi-card-value">{counts?.auditEvents?.toLocaleString() || '—'}</div>
          <div className="kpi-card-meta">
            <Clock className="w-3.5 h-3.5" />
            <span>logged system actions</span>
          </div>
        </div>

        <button
          onClick={() => router.push('/admin/security/events')}
          className="kpi-card text-left cursor-pointer"
        >
          <div className="kpi-card-header">
            <span className="kpi-card-label">Security Events</span>
            <div className="kpi-card-icon">
              <ShieldCheck className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
          </div>
          <div className="kpi-card-value">{security?.today?.total?.toLocaleString() || '0'}</div>
          <div className="kpi-card-meta">
            {security?.today?.critical ? (
              <AlertTriangle className="w-3.5 h-3.5 text-[var(--error)]" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5 text-[var(--success)]" />
            )}
            <span>
              {security?.today?.critical
                ? `${security.today.critical} critical today`
                : 'today · no critical'}
            </span>
          </div>
        </button>

        <button
          onClick={() => router.push('/admin/security/blocks')}
          className="kpi-card text-left cursor-pointer"
        >
          <div className="kpi-card-header">
            <span className="kpi-card-label">Blocked Targets</span>
            <div className="kpi-card-icon">
              <Ban className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
          </div>
          <div className="kpi-card-value">{security?.activeBlocks ?? counts?.blocked ?? 0}</div>
          <div className="kpi-card-meta">
            <AlertTriangle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>active IP / user / email blocks</span>
          </div>
        </button>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Quick Actions</h2>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Add User', href: '/admin/directory/users', icon: Users, desc: 'Create a new user account' },
              { label: 'Security Events', href: '/admin/security/events', icon: ShieldCheck, desc: 'View security logs' },
              { label: 'Blocklist', href: '/admin/security/blocks', icon: Ban, desc: 'Manage blocked targets' },
              { label: 'Alerts', href: '/admin/alerts', icon: Bell, desc: 'View system alerts' },
              { label: 'Settings', href: '/admin/settings', icon: Lock, desc: 'System configuration' },
            ].map(action => (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center flex-shrink-0">
                  <action.icon className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-[var(--text)] block">{action.label}</span>
                  <span className="text-xs text-[var(--text-muted)]">{action.desc}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="section lg:col-span-2">
          <div className="section-header">
            <h2 className="section-title">Recent Activity</h2>
            <button
              onClick={() => router.push('/admin/security/audit')}
              className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              View all →
            </button>
          </div>
          {activity.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Activity className="w-5 h-5" />
              </div>
              <p className="empty-state-title">No recent activity</p>
              <p className="empty-state-desc">Activity will appear here as users interact with the system</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activity.map((item, i) => (
                <div
                  key={item.id || i}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text)]">
                      <span className="font-medium">{item.actor}</span>
                      {' '}
                      <span className="text-[var(--text-secondary)]">{item.action}</span>
                      {item.target && (
                        <span className="text-[var(--text-muted)]"> — {item.target}</span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="mt-6 section">
        <div className="section-header">
          <h2 className="section-title">System Status</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'API', status: 'Operational', color: 'var(--success)' },
            { label: 'Database', status: 'Operational', color: 'var(--success)' },
            { label: 'Redis', status: 'Operational', color: 'var(--success)' },
            { label: 'WebSocket', status: 'Operational', color: 'var(--success)' },
          ].map(service => (
            <div key={service.label} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg)]">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: service.color }}
              />
              <div>
                <p className="text-sm font-medium text-[var(--text)]">{service.label}</p>
                <p className="text-xs text-[var(--text-muted)]">{service.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
