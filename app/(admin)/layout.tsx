'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardShell, type NavSection, type AppLink } from '@tirbeo/ui';
import { useThemeToggle } from '@tirbeo/theme';
import { apiFetch, API } from '../lib';
import {
  LayoutDashboard, Users, Shield, Settings, Smartphone, Globe,
  BarChart3, UserCircle, FileText,
  Puzzle, BellRing, HeartPulse, MessageSquare, Scale, Palette,
  Mail, Lock, Key, Monitor, Ban, UserCheck, Sun, Moon, Activity,
} from 'lucide-react';

// Theme toggle component for the header
function ThemeToggle() {
  const { isDark, toggle } = useThemeToggle();
  
  // Apply theme classes to root element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.classList.toggle('light', !isDark);
  }, [isDark]);
  
  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-hover)]"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

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
      { href: '/admin/directory/settings', label: 'Directory settings', icon: Settings },
    ],
  },
  {
    label: 'Security',
    items: [
      { href: '/admin/security', label: 'Overview', icon: Shield },
      { href: '/admin/security/audit-dashboard', label: 'Audit Dashboard', icon: BarChart3 },
      { href: '/admin/security/captcha', label: 'CAPTCHA', icon: Shield },
      { href: '/admin/security/events', label: 'Security events', icon: FileText },
      { href: '/admin/security/blocks', label: 'Blocked targets', icon: Ban },
      { href: '/admin/security/captcha/blocks', label: 'Blocked Users', icon: Users },
      { href: '/admin/security/captcha/analytics', label: 'CAPTCHA Analytics', icon: BarChart3 },
      { href: '/admin/security/captcha/logs', label: 'CAPTCHA Logs', icon: FileText },
      { href: '/admin/security/authentication', label: 'Authentication', icon: Lock },
      { href: '/admin/security/access-control', label: 'Access control', icon: Key },
      { href: '/admin/security/rate-limits', label: 'Rate Limits', icon: BarChart3 },
      { href: '/admin/security/maintenance-history', label: 'Maintenance History', icon: FileText },
      { href: '/admin/security/policies', label: 'Policies', icon: FileText },
      { href: '/admin/security/audit', label: 'Audit', icon: Monitor },
    ],
  },
  {
    label: 'Management',
    items: [
      { href: '/admin/devices', label: 'Devices', icon: Smartphone },
      { href: '/admin/apps', label: 'Apps', icon: Globe },
      { href: '/admin/forms', label: 'Forms', icon: FileText },
      { href: '/admin/rules', label: 'Rules', icon: Scale },
      { href: '/admin/integrations', label: 'Integrations', icon: Puzzle },
      { href: '/admin/settings/requests', label: 'Admin Requests', icon: UserCheck },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/admin/settings', label: 'All settings', icon: Settings },
      { href: '/admin/settings/brand', label: 'Brand', icon: Palette },
      { href: '/admin/settings/email', label: 'Email', icon: Mail },
      { href: '/admin/settings/notifications', label: 'Notifications', icon: BellRing },
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
      { href: '/admin/activity', label: 'Activity', icon: Activity },
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
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent" />
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
      headerActions={<ThemeToggle />}
    >
      {children}
    </DashboardShell>
  );
}
