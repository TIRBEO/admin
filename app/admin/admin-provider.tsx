'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminShell, { type NavSection } from '../components/admin-shell';
import { apiFetch } from '../lib';
import {
  LayoutDashboard, BarChart3, FileText, Users, Shield, Settings,
  Activity, Globe, Key, Bell, Code,
  Zap, Lock, FileWarning,
  Server, HeartPulse, Webhook, Rocket,
} from 'lucide-react';

const NAV_SECTIONS: NavSection[] = [
  { label: 'Command', items: [
    { href: '/admin', label: 'Command Center', icon: LayoutDashboard },
  ]},
  { label: 'Platform', items: [
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: process.env.NEXT_PUBLIC_FORMS_URL || 'https://forms.tirbeo.app', label: 'Forms', icon: Zap },
  ]},

  { label: 'Access', items: [
    { href: '/admin/access/permissions', label: 'Permissions', icon: Lock },
  ]},
  { label: 'Operations', items: [
    { href: '/admin/operations/activity', label: 'Activity', icon: Activity },
    { href: '/admin/operations/audit', label: 'Audit Logs', icon: FileWarning },
    { href: '/admin/operations/logs', label: 'System Logs', icon: Server },
    { href: '/admin/operations/health', label: 'Health', icon: HeartPulse },
  ]},
  { label: 'Analytics', items: [
    { href: '/admin/analytics', label: 'Overview', icon: BarChart3 },
  ]},
  { label: 'Developer', items: [
    { href: '/admin/developer/api', label: 'API', icon: Code },
    { href: '/admin/developer/webhooks', label: 'Webhooks', icon: Webhook },
    { href: '/admin/developer/keys', label: 'API Keys', icon: Key },
    { href: '/admin/developer/query-performance', label: 'Query Perf', icon: Activity },
  ]},
  { label: 'Settings', items: [
    { href: '/admin/settings', label: 'Platform', icon: Settings },
    { href: '/admin/settings/security', label: 'Security', icon: Shield },
    { href: '/admin/settings/notifications', label: 'Notifications', icon: Bell },
    { href: '/admin/settings/product-updates', label: 'Product Updates', icon: Rocket },
  ]},
];

export default function AdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/admin/me').then(r => {
      if (!r.ok) return null;
      return r.json();
    }).then(d => {
      if (d) setUser({ name: d.name || 'Admin', email: d.email, role: d.adminRole || 'admin' });
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = useCallback(async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/login';
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--tb-bg)' }}>
        <div style={{ width: 24, height: 24, border: '2px solid var(--tb-border)', borderTopColor: 'var(--tb-text-primary)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    );
  }

  return (
    <AdminShell navSections={NAV_SECTIONS} brand={{ name: 'Tirbeo Admin' }} user={user} onLogout={handleLogout}>
      {children}
    </AdminShell>
  );
}
