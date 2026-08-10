'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib';
import {
  Shield, ShieldCheck, Ban, AlertTriangle, Activity,
  Lock, Key, Eye, BarChart3, ChevronRight, RefreshCw,
  Clock, TrendingUp, Users, FileText,
} from 'lucide-react';

interface SecurityOverview {
  eventsToday: number;
  criticalToday: number;
  activeBlocks: number;
  blockedUsers: number;
  captchaEnabled: boolean;
  rateLimitingEnabled: boolean;
  twoFactorRequired: boolean;
}

export default function SecurityOverview() {
  const [stats, setStats] = useState<SecurityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      apiFetch('/api/admin/security/events?limit=1').then(r => r.ok ? r.json() : null),
      apiFetch('/api/admin/security/blocks?limit=1').then(r => r.ok ? r.json() : null),
      apiFetch('/api/admin/captcha/status').then(r => r.ok ? r.json() : null),
      apiFetch('/api/admin/security/settings').then(r => r.ok ? r.json() : null),
    ]).then(([events, blocks, captcha, settings]) => {
      setStats({
        eventsToday: events?.stats?.today?.total || 0,
        criticalToday: events?.stats?.today?.critical || 0,
        activeBlocks: blocks?.pagination?.total || 0,
        blockedUsers: blocks?.pagination?.total || 0,
        captchaEnabled: captcha?.enabled || false,
        rateLimitingEnabled: settings?.rateLimiting || false,
        twoFactorRequired: settings?.twoFactorRequired || false,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-7 w-40 mb-2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="kpi-card">
              <div className="skeleton h-4 w-24 mb-4" />
              <div className="skeleton h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const QUICK_LINKS = [
    { label: 'Security Events', href: '/admin/security/events', icon: Activity, desc: 'View all security events' },
    { label: 'Blocked Targets', href: '/admin/security/blocks', icon: Ban, desc: 'Manage blocked IPs and users' },
    { label: 'CAPTCHA Settings', href: '/admin/security/captcha', icon: Shield, desc: 'Configure CAPTCHA challenges' },
    { label: 'Rate Limits', href: '/admin/security/rate-limits', icon: BarChart3, desc: 'API rate limiting rules' },
    { label: 'Authentication', href: '/admin/security/authentication', icon: Lock, desc: 'Login and MFA settings' },
    { label: 'Access Control', href: '/admin/security/access-control', icon: Key, desc: 'Role-based access control' },
    { label: 'Audit Log', href: '/admin/security/audit', icon: FileText, desc: 'System audit trail' },
    { label: 'Policies', href: '/admin/security/policies', icon: ShieldCheck, desc: 'Security policies' },
  ];

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Security</h1>
          <p className="page-subtitle">Monitor and manage security settings</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Events Today</span>
            <div className="kpi-card-icon">
              <Activity className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
          </div>
          <div className="kpi-card-value">{stats?.eventsToday?.toLocaleString() || '0'}</div>
          <div className="kpi-card-meta">
            {stats?.criticalToday ? (
              <AlertTriangle className="w-3.5 h-3.5 text-[var(--error)]" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5 text-[var(--success)]" />
            )}
            <span>
              {stats?.criticalToday
                ? `${stats.criticalToday} critical`
                : 'No critical events'}
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Active Blocks</span>
            <div className="kpi-card-icon">
              <Ban className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
          </div>
          <div className="kpi-card-value">{stats?.activeBlocks || '0'}</div>
          <div className="kpi-card-meta">
            <Users className="w-3.5 h-3.5" />
            <span>IPs and users blocked</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Security Features</span>
            <div className="kpi-card-icon">
              <ShieldCheck className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
          </div>
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">CAPTCHA</span>
              <span className={`badge ${stats?.captchaEnabled ? 'badge-success' : 'badge-disabled'}`}>
                {stats?.captchaEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">Rate Limiting</span>
              <span className={`badge ${stats?.rateLimitingEnabled ? 'badge-success' : 'badge-disabled'}`}>
                {stats?.rateLimitingEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">2FA Required</span>
              <span className={`badge ${stats?.twoFactorRequired ? 'badge-success' : 'badge-disabled'}`}>
                {stats?.twoFactorRequired ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Security Tools</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_LINKS.map(link => (
            <button
              key={link.label}
              onClick={() => router.push(link.href)}
              className="flex items-start gap-3 p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-hover)] transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center flex-shrink-0">
                <link.icon className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--text)]">{link.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{link.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
