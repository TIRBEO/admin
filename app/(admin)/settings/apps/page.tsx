'use client';
import { useRouter } from 'next/navigation';
import { Settings, Globe, Layout, FileText } from 'lucide-react';

const apps = [
  { id: 'accounts', label: 'Accounts App', desc: 'Brand, navbar, footer for accounts.tirbeo.app', icon: Globe },
  { id: 'dashboard', label: 'Dashboard App', desc: 'Brand, navbar, footer for dashboard.tirbeo.app', icon: Layout },
  { id: 'forms', label: 'Forms App', desc: 'Brand, navbar, footer for forms.tirbeo.app', icon: FileText },
  { id: '_apps', label: 'Global Apps Menu', desc: 'Configure the Tirbeo Apps switcher across all dashboards', icon: Globe },
];

export default function AppsOverview() {
  const router = useRouter();
  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-semibold text-[var(--color-admin-text)] mb-2">App Settings</h1>
      <p className="text-sm text-[var(--color-admin-text-muted)] mb-6">Configure brand, navbar, and footer for each app</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map(app => (
          <button key={app.id} onClick={() => router.push(`/admin/settings/apps/${app.id}`)}
            className="flex items-start gap-4 p-5 rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] hover:bg-[var(--color-admin-surface-hover)] transition-colors text-left">
            <app.icon className="w-6 h-6 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-base font-medium text-[var(--color-admin-text)]">{app.label}</p>
              <p className="text-sm text-[var(--color-admin-text-muted)] mt-1">{app.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
