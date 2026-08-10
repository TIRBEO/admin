'use client';

import { useRouter } from 'next/navigation';
import {
  Settings, Palette, Mail, Bell, Key, Shield, Globe,
  Users, Image, Code, Layout, Monitor, FileText,
  ChevronRight, Palette as ThemeIcon,
} from 'lucide-react';

interface SettingGroup {
  label: string;
  items: SettingItem[];
}

interface SettingItem {
  label: string;
  description: string;
  href: string;
  icon: any;
}

const SETTING_GROUPS: SettingGroup[] = [
  {
    label: 'General',
    items: [
      { label: 'Brand', description: 'Logo, name, and branding', href: '/admin/settings/brand', icon: Image },
      { label: 'Theme', description: 'Colors, fonts, and appearance', href: '/admin/settings/theme', icon: Palette },
      { label: 'Layout', description: 'Sidebar and navigation', href: '/admin/settings/layout', icon: Layout },
      { label: 'Dashboard', description: 'Dashboard widgets and layout', href: '/admin/settings/dashboard', icon: Monitor },
    ],
  },
  {
    label: 'Communication',
    items: [
      { label: 'Email', description: 'SMTP, templates, and delivery', href: '/admin/settings/email', icon: Mail },
      { label: 'Notifications', description: 'Alerts and notification prefs', href: '/admin/settings/notifications', icon: Bell },
    ],
  },
  {
    label: 'Security',
    items: [
      { label: 'Roles & Permissions', description: 'User roles and access control', href: '/admin/settings/roles', icon: Shield },
      { label: 'API Keys', description: 'Manage API credentials', href: '/admin/settings/api', icon: Key },
      { label: 'Accounts', description: 'OAuth and SSO settings', href: '/admin/settings/accounts', icon: Users },
    ],
  },
  {
    label: 'Applications',
    items: [
      { label: 'App Config', description: 'Per-app configuration', href: '/admin/settings/apps', icon: Globe },
      { label: 'Landing Page', description: 'Website content and SEO', href: '/admin/settings/landing', icon: FileText },
    ],
  },
];

export default function SettingsOverview() {
  const router = useRouter();

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage system configuration and preferences</p>
      </div>

      {/* Setting Groups */}
      <div className="space-y-8">
        {SETTING_GROUPS.map(group => (
          <div key={group.label}>
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              {group.label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.items.map(item => (
                <button
                  key={item.label}
                  onClick={() => router.push(item.href)}
                  className="flex items-start gap-4 p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-hover)] transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text)]">{item.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
