'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSection } from '@tirbeo/ui';
import { apiFetch } from '../../../lib';
import { Shield, Key, Smartphone, Clock, AlertTriangle, Check } from 'lucide-react';

function SettingCard({ title, description, children, action }: { title: string; description?: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-5 mb-4">
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

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-admin-border)]'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  );
}

export default function AuthenticationSettings() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiFetch('/api/admin/settings/auth').then(async r => {
      if (r.ok) { const d = await r.json(); setSettings(d.settings || d.data || d || {}); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
    apiFetch('/api/admin/settings/auth', {
      method: 'PATCH',
      body: JSON.stringify({ [key]: value }),
    }).catch(() => {});
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'authentication', label: 'Authentication' },
    { id: 'access-control', label: 'Access control' },
    { id: 'audit', label: 'Audit log' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <AdminSection title="Authentication" description="Manage authentication methods and policies"
      tabs={tabs} activeTab="authentication" onTabChange={id => router.push(`/admin/security/${id === 'overview' ? '' : id}`)}>
      <div className="max-w-2xl">
        <SettingCard title="Password Policy" description="Configure password requirements and expiration"
          action={<Toggle checked={settings.passwordPolicy ?? true} onChange={v => updateSetting('passwordPolicy', v)} />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Minimum length</span>
              <select value={settings.minPasswordLength || 8}
                onChange={e => updateSetting('minPasswordLength', parseInt(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] text-sm text-[var(--color-admin-text)]">
                {[6,8,10,12,16].map(n => <option key={n} value={n}>{n} characters</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Require special characters</span>
              <Toggle checked={settings.requireSpecial ?? true} onChange={v => updateSetting('requireSpecial', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Require uppercase & lowercase</span>
              <Toggle checked={settings.requireMixedCase ?? true} onChange={v => updateSetting('requireMixedCase', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Password expiration (days)</span>
              <select value={settings.passwordExpiryDays || 90}
                onChange={e => updateSetting('passwordExpiryDays', parseInt(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] text-sm text-[var(--color-admin-text)]">
                {[30,60,90,180,365].map(n => <option key={n} value={n}>{n} days</option>)}
              </select>
            </div>
          </div>
        </SettingCard>

        <SettingCard title="Multi-Factor Authentication" description="Require MFA for users based on role"
          action={<Toggle checked={settings.mfaEnabled ?? false} onChange={v => updateSetting('mfaEnabled', v)} />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Require MFA for admins</span>
              <Toggle checked={settings.mfaRequiredForAdmins ?? true} onChange={v => updateSetting('mfaRequiredForAdmins', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Allow authenticator apps</span>
              <Toggle checked={settings.allowAuthenticator ?? true} onChange={v => updateSetting('allowAuthenticator', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Allow SMS codes</span>
              <Toggle checked={settings.allowSms ?? false} onChange={v => updateSetting('allowSms', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Allow hardware keys (WebAuthn)</span>
              <Toggle checked={settings.allowWebAuthn ?? true} onChange={v => updateSetting('allowWebAuthn', v)} />
            </div>
          </div>
        </SettingCard>

        <SettingCard title="Passkeys" description="Passwordless authentication with passkeys"
          action={<Toggle checked={settings.passkeysEnabled ?? true} onChange={v => updateSetting('passkeysEnabled', v)} />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Allow passkey registration</span>
              <Toggle checked={settings.allowPasskeyRegistration ?? true} onChange={v => updateSetting('allowPasskeyRegistration', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Require platform authenticator</span>
              <Toggle checked={settings.requirePlatformAuthenticator ?? false} onChange={v => updateSetting('requirePlatformAuthenticator', v)} />
            </div>
          </div>
        </SettingCard>

        <SettingCard title="Session Management" description="Configure session timeout and limits"
          action={<Toggle checked={settings.sessionManagement ?? true} onChange={v => updateSetting('sessionManagement', v)} />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Session timeout (minutes)</span>
              <select value={settings.sessionTimeoutMinutes || 60}
                onChange={e => updateSetting('sessionTimeoutMinutes', parseInt(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] text-sm text-[var(--color-admin-text)]">
                {[15,30,60,120,240,480].map(n => <option key={n} value={n}>{n} min</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Max concurrent sessions</span>
              <select value={settings.maxConcurrentSessions || 5}
                onChange={e => updateSetting('maxConcurrentSessions', parseInt(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] text-sm text-[var(--color-admin-text)]">
                {[1,2,3,5,10,0].map(n => <option key={n} value={n}>{n === 0 ? 'Unlimited' : n}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Remember me duration (days)</span>
              <select value={settings.rememberMeDays || 30}
                onChange={e => updateSetting('rememberMeDays', parseInt(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] text-sm text-[var(--color-admin-text)]">
                {[7,14,30,60,90].map(n => <option key={n} value={n}>{n} days</option>)}
              </select>
            </div>
          </div>
        </SettingCard>

        <SettingCard title="Login Protection" description="Brute force protection and rate limiting"
          action={<Toggle checked={settings.loginProtection ?? true} onChange={v => updateSetting('loginProtection', v)} />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Max login attempts</span>
              <select value={settings.maxLoginAttempts || 5}
                onChange={e => updateSetting('maxLoginAttempts', parseInt(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] text-sm text-[var(--color-admin-text)]">
                {[3,5,10,20].map(n => <option key={n} value={n}>{n} attempts</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Lockout duration (minutes)</span>
              <select value={settings.lockoutDurationMinutes || 15}
                onChange={e => updateSetting('lockoutDurationMinutes', parseInt(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] text-sm text-[var(--color-admin-text)]">
                {[5,10,15,30,60].map(n => <option key={n} value={n}>{n} min</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-admin-text)]">Notify on suspicious login</span>
              <Toggle checked={settings.notifySuspiciousLogin ?? true} onChange={v => updateSetting('notifySuspiciousLogin', v)} />
            </div>
          </div>
        </SettingCard>
      </div>
    </AdminSection>
  );
}
