'use client';

import { useRouter } from 'next/navigation';
import { AdminSection } from '@tirbeo/ui';
import { Database, Download, Upload, RefreshCw, Trash2, FileSpreadsheet, Archive, BarChart3 } from 'lucide-react';

export default function DataPage() {
  const router = useRouter();

  const sections = [
    {
      title: 'Data Management',
      items: [
        { label: 'Export Data', description: 'Export users, analytics, and reports', icon: Download, color: 'var(--color-primary)' },
        { label: 'Import Data', description: 'Bulk import users and records', icon: Upload, color: 'var(--color-info)' },
        { label: 'Data Sync', description: 'Configure data synchronization', icon: RefreshCw, color: 'var(--color-success)' },
        { label: 'Archive', description: 'Archive old data and records', icon: Archive, color: 'var(--color-warning)' },
      ],
    },
    {
      title: 'Database',
      items: [
        { label: 'Tables', description: 'View and manage database tables', icon: Database, color: 'var(--color-primary)' },
        { label: 'Backups', description: 'Manage database backups', icon: FileSpreadsheet, color: 'var(--color-info)' },
        { label: 'Query Console', description: 'Run SQL queries', icon: BarChart3, color: 'var(--color-success)' },
        { label: 'Cleanup', description: 'Remove orphaned and stale data', icon: Trash2, color: 'var(--color-error)' },
      ],
    },
  ];

  return (
    <AdminSection title="Data" description="Manage data, imports, exports, and database operations"
      tabs={[]} activeTab="" onTabChange={() => {}}>
      <div className="space-y-8">
        {sections.map(group => (
          <div key={group.title}>
            <h3 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider mb-3">{group.title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {group.items.map(item => (
                <button key={item.label}
                  className="flex items-start gap-4 p-4 rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] hover:bg-[var(--color-admin-surface-hover)] transition-colors text-left">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}18` }}>
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-admin-text)]">{item.label}</p>
                    <p className="text-xs text-[var(--color-admin-text-muted)] mt-0.5">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminSection>
  );
}
