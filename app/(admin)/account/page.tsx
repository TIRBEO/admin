'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSection, StatusBadge } from '@tirbeo/ui';
import { apiFetch } from '../../lib';
import { UserCircle, Mail, Shield, Calendar, Edit, Save } from 'lucide-react';

export default function AccountPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    apiFetch('/api/admin/me').then(async r => {
      if (r.ok) { const d = await r.json(); setProfile(d); setName(d.name || ''); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const r = await apiFetch('/api/admin/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
    if (r.ok) {
      setProfile((prev: any) => ({ ...prev, name }));
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 animate-pulse space-y-4">
        <div className="h-8 w-48 bg-[var(--color-admin-surface-hover)] rounded" />
        <div className="max-w-2xl">
          <div className="h-64 bg-[var(--color-admin-surface-hover)] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <AdminSection title="My Account" description="Manage your admin profile and preferences"
      tabs={[]} activeTab="" onTabChange={() => {}}>
      <div className="max-w-2xl">
        {saved && (
          <div className="flex items-center gap-1.5 mb-4 px-4 py-2 rounded-lg bg-[var(--color-success-surface)] text-xs text-[var(--color-success)]">
            <Save className="w-3.5 h-3.5" /> Profile updated
          </div>
        )}

        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6 mb-4">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-[var(--color-primary-surface)] flex items-center justify-center text-[var(--color-primary)] text-xl font-bold">
              {(profile?.name || profile?.email || 'A')[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-admin-text)]">{profile?.name || 'Admin'}</h3>
                  <p className="text-sm text-[var(--color-admin-text-secondary)]">{profile?.email}</p>
                </div>
                {editing ? (
                  <div className="flex items-center gap-2">
                    <button onClick={handleSave}
                      className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors">
                      Save
                    </button>
                    <button onClick={() => setEditing(false)}
                      className="px-4 py-2 rounded-lg border border-[var(--color-admin-border)] text-sm font-medium text-[var(--color-admin-text-secondary)] hover:bg-[var(--color-admin-surface-hover)] transition-colors">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-admin-border)] text-sm text-[var(--color-admin-text-secondary)] hover:bg-[var(--color-admin-surface-hover)] transition-colors">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
              </div>
            </div>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-admin-text)] mb-1">Display Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] text-sm text-[var(--color-admin-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
              </div>
            </div>
          ) : (
            <dl className="space-y-4">
              {[
                { label: 'Email', value: profile?.email, icon: Mail },
                { label: 'Admin Role', value: profile?.adminRole, icon: Shield },
                { label: 'Joined', value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—', icon: Calendar },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-[var(--color-admin-border)] last:border-0">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-[var(--color-admin-text-muted)]" />
                    <span className="text-sm text-[var(--color-admin-text-secondary)]">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-[var(--color-admin-text)]">{item.label === 'Admin Role' ? <StatusBadge status={item.value || 'admin'} dot={false} /> : item.value}</span>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Quick links */}
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6">
          <h3 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Change Password', href: '/settings/2fa' },
              { label: 'Notification Preferences', href: '/settings/notifications' },
              { label: 'Security Settings', href: '/admin/security' },
              { label: 'Theme Preferences', href: '/admin/settings/theme' },
            ].map(link => (
              <button key={link.label} onClick={() => router.push(link.href)}
                className="p-3 rounded-lg border border-[var(--color-admin-border)] text-left text-sm text-[var(--color-admin-text)] hover:bg-[var(--color-admin-surface-hover)] transition-colors">
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AdminSection>
  );
}
