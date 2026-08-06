'use client';

import { useEffect, useState } from 'react';
import { AdminSection } from '@tirbeo/ui';
import { apiFetch } from '../../../lib';
import { Users, Globe, RefreshCw, Shield, Check, X } from 'lucide-react';

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-admin-border)]'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  );
}

function SettingCard({ title, description, children, action }: { title: string; description?: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-5 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-[var(--color-admin-text)]">{title}</h3>
          {description && <p className="text-xs text-[var(--color-admin-text-muted)] mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export default function DirectorySettings() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch('/api/admin/site-config?app=accounts').then(async r => {
      if (r.ok) { const d = await r.json(); setSettings(d.config || d.data || d || {}); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    apiFetch('/api/admin/site-config', {
      method: 'PUT',
      body: JSON.stringify({ app: 'accounts', config: { ...settings, [key]: value } }),
    }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 animate-pulse space-y-4">
        <div className="h-8 w-48 bg-[var(--color-admin-surface-hover)] rounded" />
        <div className="h-6 w-64 bg-[var(--color-admin-surface-hover)] rounded" />
        <div className="h-64 bg-[var(--color-admin-surface-hover)] " />
      </div>
    );
  }

  return (
    <AdminSection title="Directory Settings" description="Configure directory and user provisioning settings"
      tabs={[]} activeTab="" onTabChange={() => {}}>
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-[var(--color-success)]">
              <Check className="w-3 h-3" /> Settings saved
            </span>
          )}
        </div>

        <SettingCard title="User Provisioning" description="Automatic user provisioning and deprovisioning"
          action={<Toggle checked={settings.autoProvisioning ?? true} onChange={v => updateSetting('autoProvisioning', v)} />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Auto-create users on first login</span>
              <Toggle checked={settings.autoCreateUsers ?? true} onChange={v => updateSetting('autoCreateUsers', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Welcome email for new users</span>
              <Toggle checked={settings.welcomeEmail ?? true} onChange={v => updateSetting('welcomeEmail', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Suspend inactive accounts after (days)</span>
              <select value={settings.inactiveSuspendDays || 90}
                onChange={e => updateSetting('inactiveSuspendDays', parseInt(e.target.value))}
                className="px-3 py-1.5 rounded-lg border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] text-sm text-[var(--color-admin-text)]">
                {[30, 60, 90, 180, 365].map(n => <option key={n} value={n}>{n} days</option>)}
              </select>
            </div>
          </div>
        </SettingCard>

        <SettingCard title="Directory Schema" description="Configure user profile fields and attributes"
          action={<Toggle checked={settings.customSchema ?? false} onChange={v => updateSetting('customSchema', v)} />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Require phone number</span>
              <Toggle checked={settings.requirePhone ?? false} onChange={v => updateSetting('requirePhone', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Allow custom attributes</span>
              <Toggle checked={settings.customAttributes ?? true} onChange={v => updateSetting('customAttributes', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Max custom attributes per user</span>
              <select value={settings.maxCustomAttributes || 20}
                onChange={e => updateSetting('maxCustomAttributes', parseInt(e.target.value))}
                className="px-3 py-1.5 rounded-lg border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] text-sm text-[var(--color-admin-text)]">
                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </SettingCard>

        <SettingCard title="LDAP / SCIM Integration" description="Synchronize with external identity providers"
          action={<Toggle checked={settings.ldapSync ?? false} onChange={v => updateSetting('ldapSync', v)} />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">SCIM provisioning</span>
              <Toggle checked={settings.scimEnabled ?? false} onChange={v => updateSetting('scimEnabled', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Auto-sync interval (minutes)</span>
              <select value={settings.syncIntervalMinutes || 60}
                onChange={e => updateSetting('syncIntervalMinutes', parseInt(e.target.value))}
                className="px-3 py-1.5 rounded-lg border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] text-sm text-[var(--color-admin-text)]">
                {[15, 30, 60, 120, 360, 720].map(n => <option key={n} value={n}>{n} min</option>)}
              </select>
            </div>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[var(--color-admin-border)] text-sm text-[var(--color-admin-text-secondary)] hover:bg-[var(--color-admin-surface-hover)]">
              <RefreshCw className="w-3.5 h-3.5" /> Sync Now
            </button>
          </div>
        </SettingCard>

        <SettingCard title="Groups & OU Settings" description="Configure group and organizational unit behavior"
          action={<Toggle checked={settings.groupsEnabled ?? true} onChange={v => updateSetting('groupsEnabled', v)} />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Allow nested groups</span>
              <Toggle checked={settings.nestedGroups ?? true} onChange={v => updateSetting('nestedGroups', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Max group depth</span>
              <select value={settings.maxGroupDepth || 5}
                onChange={e => updateSetting('maxGroupDepth', parseInt(e.target.value))}
                className="px-3 py-1.5 rounded-lg border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] text-sm text-[var(--color-admin-text)]">
                {[3, 5, 10].map(n => <option key={n} value={n}>{n} levels</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Auto-assign new users to default group</span>
              <select value={settings.defaultGroup || 'none'}
                onChange={e => updateSetting('defaultGroup', e.target.value)}
                className="px-3 py-1.5 rounded-lg border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] text-sm text-[var(--color-admin-text)]">
                <option value="none">No auto-assign</option>
                <option value="all-users">All Users</option>
                <option value="members">Members</option>
              </select>
            </div>
          </div>
        </SettingCard>
      </div>
    </AdminSection>
  );
}
