'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib';
import { SettingsPage, SectionCard, Field, Input, Toggle, Select, Toast } from '../shared';

interface EmailConfig {
  provider: string;
  apiKey: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
  enabled: boolean;
}

const DEFAULTS: EmailConfig = {
  provider: 'resend',
  apiKey: '',
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  fromEmail: 'noreply@tirbeo.app',
  fromName: 'Tirbeo',
  enabled: true,
};

export default function EmailSettingsPage() {
  const [cfg, setCfg] = useState<EmailConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      method: 'PUT', body: JSON.stringify(cfg),
    });
    if (res.ok) setMsg({ type: 'success', text: 'Email settings saved' });
    else setMsg({ type: 'error', text: 'Failed to save' });
    setSaving(false); setTimeout(() => setMsg(null), 3000);
  };

  const upd = <K extends keyof EmailConfig>(k: K, v: EmailConfig[K]) => setCfg(p => ({ ...p, [k]: v }));

  const test = async () => {
    if (!testEmail) return;
    setTesting(true); setMsg(null);
    const res = await apiFetch('/api/admin/email/test', {
      method: 'POST', body: JSON.stringify({ to: testEmail }),
    });
    if (res.ok) setMsg({ type: 'success', text: 'Test email sent!' });
    else setMsg({ type: 'error', text: 'Test failed' });
    setTesting(false); setTimeout(() => setMsg(null), 3000);
  };

  if (loading) return <div className="loading">Loading…</div>;

  const isResend = cfg.provider === 'resend';

  return (
    <SettingsPage title="Email Configuration" desc="Configure email sending for OTPs, notifications, and digests" onSave={save} saving={saving}>
      <Toast msg={msg} onClose={() => setMsg(null)} />

      <SectionCard title="Provider" desc="Choose how emails are sent">
        <Field label="Email Provider">
          <Select value={cfg.provider} onChange={e => upd('provider', e.target.value)}>
            <option value="resend">Resend</option>
            <option value="smtp">SMTP (Gmail, Outlook, etc.)</option>
          </Select>
        </Field>

        {isResend ? (
          <Field label="Resend API Key" desc="From https://resend.com/api-keys">
            <Input type="password" value={cfg.apiKey} onChange={e => upd('apiKey', e.target.value)} placeholder="re_..." />
          </Field>
        ) : (
          <>
            <Field label="SMTP Host">
              <Input value={cfg.smtpHost} onChange={e => upd('smtpHost', e.target.value)} placeholder="smtp.gmail.com" />
            </Field>
            <Field label="SMTP Port">
              <Input type="number" value={cfg.smtpPort} onChange={e => upd('smtpPort', Number(e.target.value))} placeholder="587" />
            </Field>
            <Field label="SMTP User">
              <Input value={cfg.smtpUser} onChange={e => upd('smtpUser', e.target.value)} placeholder="user@gmail.com" />
            </Field>
            <Field label="SMTP Password" desc="App password for Gmail">
              <Input type="password" value={cfg.smtpPass} onChange={e => upd('smtpPass', e.target.value)} placeholder="••••••••" />
            </Field>
          </>
        )}
      </SectionCard>

      <SectionCard title="Sender" desc="Default from address and name">
        <Field label="From Email">
          <Input value={cfg.fromEmail} onChange={e => upd('fromEmail', e.target.value)} placeholder="noreply@tirbeo.app" />
        </Field>
        <Field label="From Name">
          <Input value={cfg.fromName} onChange={e => upd('fromName', e.target.value)} placeholder="Tirbeo" />
        </Field>
        <Field label="Enabled" horizontal>
          <Toggle checked={cfg.enabled} onChange={v => upd('enabled', v)} />
        </Field>
      </SectionCard>

      <SectionCard title="Test Email" desc="Send a test to verify configuration">
        <div className="flex gap-2">
          <Input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="test@example.com" />
          <button className="btn btn-outline" onClick={test} disabled={testing || !testEmail}>
            {testing ? 'Sending…' : 'Send Test'}
          </button>
        </div>
      </SectionCard>
    </SettingsPage>
  );
}
