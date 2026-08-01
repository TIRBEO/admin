'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import { SettingsPage, SectionCard, Field, Input, Toggle, Select, Toast } from '../shared';

interface EmailConfig {
  id?: string;
  provider: string;
  resendApiKey?: string;
  resendDomain?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  defaultFromEmail?: string;
  defaultFromName?: string;
  welcomeFromEmail?: string;
  welcomeFromName?: string;
  otpFromEmail?: string;
  otpFromName?: string;
  resetFromEmail?: string;
  resetFromName?: string;
  notifyFromEmail?: string;
  notifyFromName?: string;
  alertFromEmail?: string;
  alertFromName?: string;
  formsFromEmail?: string;
  formsFromName?: string;
  customDomain?: string;
  dkimEnabled?: boolean;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULTS: EmailConfig = {
  provider: 'resend',
  resendApiKey: '',
  resendDomain: 'send.tirbeo.app',
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  defaultFromEmail: 'noreply@send.tirbeo.app',
  defaultFromName: 'Tirbeo',
  welcomeFromEmail: '',
  welcomeFromName: '',
  otpFromEmail: '',
  otpFromName: '',
  resetFromEmail: '',
  resetFromName: '',
  notifyFromEmail: '',
  notifyFromName: '',
  alertFromEmail: 'alerts@send.tirbeo.app',
  alertFromName: 'Tirbeo Alerts',
  formsFromEmail: 'forms@send.tirbeo.app',
  formsFromName: 'Tirbeo Forms',
  customDomain: '',
  dkimEnabled: false,
  enabled: true,
};

const EMAIL_TYPES = [
  { key: 'default', label: 'Default (Transactional)', desc: 'Welcome, OTP, password reset, magic link' },
  { key: 'welcome', label: 'Welcome Email', desc: 'Sent after successful signup' },
  { key: 'otp', label: 'OTP / Verification', desc: 'Login OTP, email verification codes' },
  { key: 'reset', label: 'Password Reset', desc: 'Password reset emails' },
  { key: 'notify', label: 'Notifications / Digest', desc: 'Notification digests and user notifications' },
  { key: 'alert', label: 'Admin Alerts', desc: 'System alerts and admin notifications' },
  { key: 'forms', label: 'Forms', desc: 'Form submission notifications and confirmations' },
] as const;

export default function EmailSettingsPage() {
  const [cfg, setCfg] = useState<EmailConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);
  const [testingType, setTestingType] = useState<string>('default');

  const load = useCallback(async () => {
    const res = await apiFetch('/api/admin/email/config');
    if (res.ok) {
      const d = await res.json();
      if (d?.id) setCfg({ ...DEFAULTS, ...d });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const res = await apiFetch('/api/admin/email/config', {
      method: 'PUT',
      body: JSON.stringify(cfg),
    });
    if (res.ok) {
      setMsg({ type: 'success', text: 'Email settings saved successfully' });
      await load();
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed to save' }));
      setMsg({ type: 'error', text: err.error || 'Failed to save' });
    }
    setSaving(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const upd = <K extends keyof EmailConfig>(k: K, v: EmailConfig[K]) => setCfg(p => ({ ...p, [k]: v }));

  const test = async () => {
    if (!testEmail) return;
    setTesting(true); setMsg(null);
    const res = await apiFetch('/api/admin/email/test', {
      method: 'POST',
      body: JSON.stringify({ to: testEmail, templateName: testingType }),
    });
    if (res.ok) setMsg({ type: 'success', text: `Test ${testingType} email sent!` });
    else {
      const err = await res.json().catch(() => ({ error: 'Test failed' }));
      setMsg({ type: 'error', text: err.error || 'Test failed' });
    }
    setTesting(false);
    setTimeout(() => setMsg(null), 3000);
  };

  if (loading) return <div className="loading">Loading…</div>;

  const isResend = cfg.provider === 'resend';
  const typeConfig = EMAIL_TYPES.find(t => t.key === testingType) || EMAIL_TYPES[0];

  return (
    <SettingsPage title="Email Configuration" desc="Configure email sending, domains, and per-email-type from addresses" onSave={save} saving={saving}>
      <Toast msg={msg} onClose={() => setMsg(null)} />

      <SectionCard title="Email Provider" desc="Choose how Tirbeo sends emails">
        <Field label="Provider">
          <Select value={cfg.provider} onChange={e => upd('provider', e.target.value)}>
            <option value="resend">Resend (recommended)</option>
            <option value="smtp">SMTP (Gmail, Outlook, custom)</option>
          </Select>
        </Field>

        {isResend ? (
          <>
            <Field label="Resend API Key" desc="Create at resend.com/api-keys">
              <Input
                type={showSecrets ? 'text' : 'password'}
                value={cfg.resendApiKey || ''}
                onChange={e => upd('resendApiKey', e.target.value)}
                placeholder="re_..."
              />
            </Field>
            <Field label="Sending Domain" desc="Domain verified in Resend (e.g., send.tirbeo.app)">
              <Input
                value={cfg.resendDomain || ''}
                onChange={e => upd('resendDomain', e.target.value)}
                placeholder="send.tirbeo.app"
              />
            </Field>
          </>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="SMTP Host" desc="e.g., smtp.gmail.com">
                <Input value={cfg.smtpHost || ''} onChange={e => upd('smtpHost', e.target.value)} placeholder="smtp.gmail.com" />
              </Field>
              <Field label="SMTP Port" desc="Usually 587 (TLS) or 465 (SSL)">
                <Input type="number" value={cfg.smtpPort || 587} onChange={e => upd('smtpPort', Number(e.target.value))} placeholder="587" />
              </Field>
            </div>
            <Field label="SMTP Username" desc="Often your full email address">
              <Input value={cfg.smtpUser || ''} onChange={e => upd('smtpUser', e.target.value)} placeholder="user@gmail.com" />
            </Field>
            <Field label="SMTP Password" desc="App password or SMTP credential">
              <Input
                type={showSecrets ? 'text' : 'password'}
                value={cfg.smtpPass || ''}
                onChange={e => upd('smtpPass', e.target.value)}
                placeholder="••••••••"
              />
            </Field>
          </>
        )}
      </SectionCard>

      <SectionCard title="Custom Domain & DKIM" desc="Configure your sending domain and authentication">
        <Field label="Custom Domain" desc="Override the sending domain (must be verified in Resend)">
          <Input
            value={cfg.customDomain || ''}
            onChange={e => upd('customDomain', e.target.value)}
            placeholder="send.tirbeo.app"
          />
        </Field>
        <Field label="DKIM Enabled" horizontal>
          <Toggle checked={cfg.dkimEnabled || false} onChange={v => upd('dkimEnabled', v)} />
        </Field>
      </SectionCard>

      <SectionCard title="Sender Identities" desc="Default from address and name used across all emails">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Default From Email">
            <Input value={cfg.defaultFromEmail || ''} onChange={e => upd('defaultFromEmail', e.target.value)} placeholder="noreply@send.tirbeo.app" />
          </Field>
          <Field label="Default From Name">
            <Input value={cfg.defaultFromName || ''} onChange={e => upd('defaultFromName', e.target.value)} placeholder="Tirbeo" />
          </Field>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            id="show-secrets"
            type="checkbox"
            checked={showSecrets}
            onChange={e => setShowSecrets(e.target.checked)}
          />
          <label htmlFor="show-secrets" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Show secrets / API keys</label>
        </div>
      </SectionCard>

      <SectionCard title="Per-Email-Type From Addresses" desc="Override sender for specific email categories">
        {EMAIL_TYPES.map(type => (
          <div key={type.key} style={{ marginBottom: 16, padding: 16, background: 'var(--bg-canvas)', borderRadius: 12, border: '1px solid var(--border-default)' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{type.label}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{type.desc}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="From Email">
                <Input
                  value={
type.key === 'default' ? (cfg.defaultFromEmail || '') :
                     type.key === 'welcome' ? (cfg.welcomeFromEmail || '') :
                     type.key === 'otp' ? (cfg.otpFromEmail || '') :
                     type.key === 'reset' ? (cfg.resetFromEmail || '') :
                     type.key === 'notify' ? (cfg.notifyFromEmail || '') :
                     type.key === 'alert' ? (cfg.alertFromEmail || '') :
                     type.key === 'forms' ? (cfg.formsFromEmail || '') : ''
                   }
                   onChange={e => {
                     const key = type.key === 'default' ? 'defaultFromEmail' :
                       type.key === 'welcome' ? 'welcomeFromEmail' :
                       type.key === 'otp' ? 'otpFromEmail' :
                       type.key === 'reset' ? 'resetFromEmail' :
                       type.key === 'notify' ? 'notifyFromEmail' :
                       type.key === 'alert' ? 'alertFromEmail' :
                       type.key === 'forms' ? 'formsFromEmail' : 'defaultFromEmail' as keyof EmailConfig;
                     upd(key, e.target.value);
                   }}
                   placeholder={
                     type.key === 'alert' ? 'alerts@send.tirbeo.app' :
                     type.key === 'forms' ? 'forms@send.tirbeo.app' :
                     type.key === 'default' ? 'noreply@send.tirbeo.app' : ''
                   }
                />
              </Field>
              <Field label="From Name">
                <Input
                  value={
type.key === 'default' ? (cfg.defaultFromName || '') :
                     type.key === 'welcome' ? (cfg.welcomeFromName || '') :
                     type.key === 'otp' ? (cfg.otpFromName || '') :
                     type.key === 'reset' ? (cfg.resetFromName || '') :
                     type.key === 'notify' ? (cfg.notifyFromName || '') :
                     type.key === 'alert' ? (cfg.alertFromName || '') :
                     type.key === 'forms' ? (cfg.formsFromName || '') : ''
                   }
                   onChange={e => {
                     const key = type.key === 'default' ? 'defaultFromName' :
                       type.key === 'welcome' ? 'welcomeFromName' :
                       type.key === 'otp' ? 'otpFromName' :
                       type.key === 'reset' ? 'resetFromName' :
                       type.key === 'notify' ? 'notifyFromName' :
                       type.key === 'alert' ? 'alertFromName' :
                       type.key === 'forms' ? 'formsFromName' : 'defaultFromName' as keyof EmailConfig;
                     upd(key, e.target.value);
                   }}
                   placeholder={type.key === 'alert' ? 'Tirbeo Alerts' :
                     type.key === 'forms' ? 'Tirbeo Forms' : 'Tirbeo'}
                />
              </Field>
            </div>
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Global Toggle" desc="Enable or disable all outgoing emails">
        <Field label="Email Sending" horizontal>
          <Toggle checked={cfg.enabled} onChange={v => upd('enabled', v)} />
        </Field>
      </SectionCard>

      <SectionCard title="Test Email" desc="Send a test email using the current configuration">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <Input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="test@example.com" />
          </div>
          <Select
            value={testingType}
            onChange={e => setTestingType(e.target.value)}
            style={{ width: 200 }}
          >
            {EMAIL_TYPES.map(t => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </Select>
          <button className="btn btn-outline" onClick={test} disabled={testing || !testEmail}>
            {testing ? 'Sending…' : 'Send Test'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          Testing: <strong>{typeConfig.label}</strong> — {typeConfig.desc}
        </p>
      </SectionCard>
    </SettingsPage>
  );
}
