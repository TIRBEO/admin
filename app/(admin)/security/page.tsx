'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSection, StatusBadge } from '@tirbeo/ui';
import { apiFetch } from '../../lib';
import { Shield, Key, Users, FileText, Activity } from 'lucide-react';

export default function SecurityOverview() {
  const [score, setScore] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    apiFetch('/api/admin/security/score').then(async r => {
      if (r.ok) { const d = await r.json(); setScore(d.score ?? d); }
    }).catch(() => {});
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'authentication', label: 'Authentication' },
    { id: 'access-control', label: 'Access control' },
    { id: 'audit', label: 'Audit log' },
    { id: 'settings', label: 'Settings' },
  ];

  const scoreColor = score !== null ? (score >= 80 ? 'var(--color-success)' : score >= 50 ? 'var(--color-warning)' : 'var(--color-error)') : 'var(--color-admin-text-muted)';

  return (
    <AdminSection title="Security" description="Manage security settings, authentication, and access control"
      tabs={tabs} activeTab="overview" onTabChange={id => router.push(`/admin/security/${id === 'overview' ? '' : id}`)}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6 text-center lg:col-span-1">
          <div className="w-20 h-20 rounded-full border-4 mx-auto mb-3 flex items-center justify-center" style={{ borderColor: scoreColor }}>
            <span className="text-2xl font-bold" style={{ color: scoreColor }}>{score !== null ? score : '—'}</span>
          </div>
          <p className="text-xs font-medium text-[var(--color-admin-text-secondary)] uppercase tracking-wider">Security Score</p>
          <p className="text-xs text-[var(--color-admin-text-muted)] mt-1">
            {score !== null ? (score >= 80 ? 'Good' : score >= 50 ? 'Needs improvement' : 'Critical') : 'Loading...'}
          </p>
        </div>
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[var(--color-admin-text-secondary)]">Active Sessions</span>
              <Activity className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
            <p className="text-2xl font-semibold text-[var(--color-admin-text)]">—</p>
          </div>
          <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[var(--color-admin-text-secondary)]">MFA Enabled</span>
              <Key className="w-4 h-4 text-[var(--color-success)]" />
            </div>
            <p className="text-2xl font-semibold text-[var(--color-admin-text)]">—%</p>
          </div>
          <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[var(--color-admin-text-secondary)]">Recent Alerts</span>
              <Shield className="w-4 h-4 text-[var(--color-error)]" />
            </div>
            <p className="text-2xl font-semibold text-[var(--color-admin-text)]">—</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => router.push('/admin/security/authentication')}
          className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-5 hover:bg-[var(--color-admin-surface-hover)] transition-colors text-left">
          <Key className="w-5 h-5 text-[var(--color-primary)] mb-3" />
          <p className="text-sm font-medium text-[var(--color-admin-text)]">Authentication</p>
          <p className="text-xs text-[var(--color-admin-text-muted)] mt-1">Password policy, MFA, passkeys</p>
        </button>
        <button onClick={() => router.push('/admin/security/access-control')}
          className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-5 hover:bg-[var(--color-admin-surface-hover)] transition-colors text-left">
          <Users className="w-5 h-5 text-[var(--color-warning)] mb-3" />
          <p className="text-sm font-medium text-[var(--color-admin-text)]">Access Control</p>
          <p className="text-xs text-[var(--color-admin-text-muted)] mt-1">Roles, permissions, policies</p>
        </button>
        <button onClick={() => router.push('/admin/security/audit')}
          className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-5 hover:bg-[var(--color-admin-surface-hover)] transition-colors text-left">
          <FileText className="w-5 h-5 text-[var(--color-info)] mb-3" />
          <p className="text-sm font-medium text-[var(--color-admin-text)]">Audit Log</p>
          <p className="text-xs text-[var(--color-admin-text-muted)] mt-1">View security events and changes</p>
        </button>
        <button onClick={() => router.push('/admin/security/settings')}
          className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-5 hover:bg-[var(--color-admin-surface-hover)] transition-colors text-left">
          <Shield className="w-5 h-5 text-[var(--color-admin-text-muted)] mb-3" />
          <p className="text-sm font-medium text-[var(--color-admin-text)]">Settings</p>
          <p className="text-xs text-[var(--color-admin-text-muted)] mt-1">Security preferences</p>
        </button>
      </div>
    </AdminSection>
  );
}
