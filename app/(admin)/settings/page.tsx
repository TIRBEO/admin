'use client';

import { useRouter } from 'next/navigation';
import { Settings, Globe, Palette, Mail, Bell, Shield, CreditCard, User, Key, Layout, FileText, Database, Users, Link, Smartphone, MessageSquare, BarChart3, Building2, Lock, Monitor, HeartPulse, Scale } from 'lucide-react';

const categories = [
  {
    title: 'General',
    items: [
      { label: 'Brand', desc: 'Logo, colors, and site name', icon: Palette, href: '/admin/settings/brand' },
      { label: 'Theme', desc: 'Light/dark mode and UI preferences', icon: Settings, href: '/admin/settings/theme' },
      { label: 'Language & Region', desc: 'Default language, timezone, date format', icon: Globe, href: '/admin/settings/layout' },
      { label: 'Dashboard', desc: 'Default view, widgets, layout', icon: Layout, href: '/admin/settings/dashboard' },
    ],
  },
  {
    title: 'Communication',
    items: [
      { label: 'Email', desc: 'SMTP, templates, sender configuration', icon: Mail, href: '/admin/settings/email' },
      { label: 'Notifications', desc: 'Channels, triggers, preferences', icon: Bell, href: '/admin/settings/notifications' },
      { label: 'Domains', desc: 'Custom domains and DNS settings', icon: Link, href: '/admin/settings/domains' },
    ],
  },
  {
    title: 'Security',
    items: [
      { label: 'Authentication', desc: 'Password policy, MFA, session', icon: Lock, href: '/admin/security/authentication' },
      { label: 'Roles & Permissions', desc: 'RBAC, access control', icon: Shield, href: '/admin/settings/roles' },
      { label: 'Two-Factor', desc: '2FA enforcement and methods', icon: Shield, href: '/admin/settings/2fa' },
    ],
  },
  {
    title: 'Account & Billing',
    items: [
      { label: 'Accounts', desc: 'Registration, profiles, deletion', icon: Users, href: '/admin/settings/accounts' },
      { label: 'Billing', desc: 'Plans, pricing, invoices', icon: CreditCard, href: '/admin/billing' },
      { label: 'API', desc: 'API keys, rate limits, docs', icon: Key, href: '/admin/settings/api' },
    ],
  },
  {
    title: 'App Config',
    items: [
      { label: 'Accounts App', desc: 'Brand, navbar, footer for accounts.tirbeo.app', icon: Globe, href: '/admin/settings/apps/accounts' },
      { label: 'Dashboard App', desc: 'Brand, navbar, footer for dashboard.tirbeo.app', icon: Layout, href: '/admin/settings/apps/dashboard' },
      { label: 'Forms App', desc: 'Brand, navbar, footer for forms.tirbeo.app', icon: FileText, href: '/admin/settings/apps/forms' },
      { label: 'Support App', desc: 'Brand, navbar, footer for support.tirbeo.app', icon: MessageSquare, href: '/admin/settings/apps/support' },
      { label: 'Global Apps Menu', desc: 'Configure the Tirbeo Apps switcher', icon: Building2, href: '/admin/settings/apps/_apps' },
    ],
  },
  {
    title: 'Landing Page',
    items: [
      { label: 'Hero', desc: 'Hero section content and images', icon: Layout, href: '/admin/settings/landing/hero' },
      { label: 'Navigation', desc: 'Menu items and structure', icon: Layout, href: '/admin/settings/landing/navbar' },
      { label: 'Footer', desc: 'Footer content and links', icon: Layout, href: '/admin/settings/landing/footer' },
      { label: 'SEO', desc: 'Meta tags, sitemap, robots', icon: Globe, href: '/admin/settings/landing/seo' },
      { label: 'FAQ', desc: 'Frequently asked questions', icon: FileText, href: '/admin/settings/landing/faq' },
      { label: 'About', desc: 'About page content', icon: FileText, href: '/admin/settings/landing/about' },
      { label: 'Newsletter', desc: 'Newsletter signup configuration', icon: Mail, href: '/admin/settings/landing/newsletter' },
      { label: 'Subscribers', desc: 'View all waitlist signups', icon: Users, href: '/admin/settings/landing/subscribers' },
      { label: 'Feedback', desc: 'View all user feedback', icon: MessageSquare, href: '/admin/settings/landing/feedback' },
      { label: 'Redirects', desc: 'URL redirects and rewrites', icon: Link, href: '/admin/settings/landing/redirects' },
      { label: 'Preloader', desc: 'Loading screen configuration', icon: Smartphone, href: '/admin/settings/landing/preloader' },
    ],
  },
];

export default function SettingsOverview() {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Settings</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Configure all platform settings</p>
      </div>
      {categories.map(group => (
        <div key={group.title}>
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">{group.title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {group.items.map(item => (
              <button key={item.label} onClick={() => router.push(item.href)}
                className="flex items-start gap-4 p-4  border-2 border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] transition-colors text-left">
                <item.icon className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">{item.label}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
