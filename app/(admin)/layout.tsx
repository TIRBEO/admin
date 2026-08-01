'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardShell, type NavSection, type AppLink } from '@tirbeo/ui';
import { apiFetch, API } from '../lib';
import {
  LayoutDashboard, Users, Shield, Settings, Smartphone, Globe,
  BarChart3, CreditCard, UserCircle, FileText, HardDrive,
  Puzzle, BellRing, HeartPulse, MessageSquare, Scale, Palette,
  Mail, Lock, Building2, Key, Network, Monitor, Ban,
} from 'lucide-react';

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Home', icon: LayoutDashboard },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/admin/reporting', label: 'Reporting', icon: FileText },
    ],
  },
  {
    label: 'Directory',
    items: [
      { href: '/admin/directory/users', label: 'Users', icon: Users },
      { href: '/admin/directory/groups', label: 'Groups', icon: Building2 },
      { href: '/admin/directory/ous', label: 'Organizational units', icon: Network },
      { href: '/admin/directory/settings', label: 'Directory settings', icon: Settings },
    ],
  },
  {
    label: 'Security',
    items: [
      { href: '/admin/security', label: 'Overview', icon: Shield },
      { href: '/admin/security/captcha', label: 'CAPTCHA', icon: Shield },
      { href: '/admin/security/events', label: 'Security events', icon: FileText },
      { href: '/admin/security/blocks', label: 'Blocked targets', icon: Ban },
      { href: '/admin/security/captcha/blocks', label: 'Blocked Users', icon: Users },
      { href: '/admin/security/captcha/analytics', label: 'CAPTCHA Analytics', icon: BarChart3 },
      { href: '/admin/security/captcha/logs', label: 'CAPTCHA Logs', icon: FileText },
      { href: '/admin/security/authentication', label: 'Authentication', icon: Lock },
      { href: '/admin/security/access-control', label: 'Access control', icon: Key },
      { href: '/admin/security/policies', label: 'Policies', icon: FileText },
      { href: '/admin/security/audit', label: 'Audit', icon: Monitor },
    ],
  },
  {
    label: 'Management',
    items: [
      { href: '/admin/devices', label: 'Devices', icon: Smartphone },
      { href: '/admin/apps', label: 'Apps', icon: Globe },
      { href: '/admin/data', label: 'Data', icon: HardDrive },
      { href: '/admin/rules', label: 'Rules', icon: Scale },
      { href: '/admin/storage', label: 'Storage', icon: HardDrive },
      { href: '/admin/integrations', label: 'Integrations', icon: Puzzle },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/admin/settings', label: 'All settings', icon: Settings },
      { href: '/admin/settings/brand', label: 'Brand', icon: Palette },
      { href: '/admin/settings/email', label: 'Email', icon: Mail },
      { href: '/admin/settings/notifications', label: 'Notifications', icon: BellRing },
      { href: '/admin/settings/domains', label: 'Domains', icon: Globe },
      { href: '/admin/settings/apps', label: 'App config', icon: Settings },
      { href: '/admin/settings/roles', label: 'Roles & permissions', icon: Shield },
      { href: '/admin/settings/theme', label: 'Theme', icon: Palette },
      { href: '/admin/settings/api', label: 'API', icon: Key },
      { href: '/admin/settings/accounts', label: 'Accounts', icon: UserCircle },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { href: '/admin/health', label: 'System health', icon: HeartPulse },
      { href: '/admin/alerts', label: 'Alert center', icon: BellRing },
      { href: '/admin/support', label: 'Support', icon: MessageSquare },
      { href: '/admin/tickets', label: 'Tickets', icon: MessageSquare },
      { href: '/admin/monitor/audit', label: 'Audit log', icon: FileText },
    ],
  },
];

const APPS: AppLink[] = [
  { id: 'accounts', name: 'Accounts', href: 'https://accounts.tirbeo.app' },
  { id: 'dashboard', name: 'Dashboard', href: 'https://dashboard.tirbeo.app' },
  { id: 'forms', name: 'Forms', href: 'https://forms.tirbeo.app' },
  { id: 'support', name: 'Support', href: 'https://support.tirbeo.app' },
  { id: 'landing', name: 'Website', href: 'https://tirbeo.app' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [branding, setBranding] = useState<{ name: string; logo?: string }>({ name: 'Tirbeo Admin' });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/api/admin/me');
        if (!res.ok) { window.location.href = '/login'; return; }
        const data = await res.json();
        setUser({ name: data.name || 'Admin', email: data.email, role: data.adminRole || 'Admin' });
        fetch(`${API}/api/public/app-config?app=brand`)
          .then(r => r.json())
          .then(d => {
            if (d?.branding) {
              setBranding({ name: d.branding.brandName || 'Tirbeo', logo: d.branding.logoUrl || undefined });
            }
          })
          .catch(() => {});
      } catch { window.location.href = '/login'; return; }
      setLoading(false);
    };
    load();
  }, []);

  const handleNavigate = useCallback((href: string) => { router.push(href); }, [router]);
  const handleLogout = useCallback(async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }, []);

  const getSearchResults = useCallback((query: string) => {
    const results: { label: string; href: string }[] = [];
    const q = query.toLowerCase();
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (item.label.toLowerCase().includes(q)) {
          results.push({ label: `${section.label} › ${item.label}`, href: item.href });
        }
        if (item.children) {
          for (const child of item.children) {
            if (child.label.toLowerCase().includes(q)) {
              results.push({ label: `${section.label} › ${item.label} › ${child.label}`, href: child.href });
            }
          }
        }
      }
    }
    return results;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg,var(--color-admin-bg,#F8F9FA))]">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--color-primary,#1A73E8)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <DashboardShell
      navSections={NAV_SECTIONS}
      apps={APPS}
      brand={{ name: branding.name, logo: branding.logo }}
      user={user}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
      currentPath={pathname}
      onSearch={getSearchResults}
      collapsible
    >
      {children}
    </DashboardShell>
  );
}
