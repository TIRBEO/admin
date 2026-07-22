'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib';
import { SettingsPage, SectionCard, Field, Input, Toggle, Toast } from '../shared';

const DEFAULTS = {
  allowSignup: true,
  passwordMinLength: 8,
  sessionDays: 7,
  otpEnabled: true,
  googleOAuthEnabled: true,
  githubOAuthEnabled: false,
  maxLoginAttempts: 5,
  lockoutMinutes: 15,
  requireEmailVerification: true,
  allowPasswordReset: true,
  sessionTimeoutMinutes: 60,
  rateLimitPerMin: 30,
  allowedDomains: '',
  welcomeEmailSubject: 'Welcome to Tirbeo',
  welcomeEmailTemplate: 'Hi {{name}}, welcome to Tirbeo! Get started by exploring your dashboard.',
};

type Config = typeof DEFAULTS;

export default function AccountsSettingsPage() {
  const [cfg, setCfg] = useState<Config>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch('/api/admin/site-config?app=accounts');
    if (res.ok) { const d = await res.json(); if (d?.config) setCfg({ ...DEFAULTS, ...d.config }); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const full = await apiFetch('/api/admin/site-config?app=accounts').then(r => r.ok ? r.json() : { config: {} });
    const res = await apiFetch('/api/admin/site-config?app=accounts', {
      method: 'PUT', body: JSON.stringify({ config: { ...(full.config || {}), ...cfg } }),
    });
    if (res.ok) setMsg({ type: 'success', text: 'Accounts settings saved' }); else setMsg({ type: 'error', text: 'Failed to save' });
    setSaving(false); setTimeout(() => setMsg(null), 3000);
  };

  const upd = <K extends keyof Config>(k: K, v: Config[K]) => setCfg(p => ({ ...p, [k]: v }));

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <SettingsPage title="Accounts Settings" desc="Configure accounts.tirbeo.app authentication" onSave={save} saving={saving}>
      <Toast msg={msg} onClose={() => setMsg(null)} />

      <SectionCard title="Registration" desc="Control who can sign up">
        <Field label="Allow Signup" horizontal>
          <Toggle checked={cfg.allowSignup} onChange={v => upd('allowSignup', v)} />
        </Field>
        <Field label="Allowed Domains" desc="Comma-separated. Leave empty for all.">
          <Input value={cfg.allowedDomains} onChange={e => upd('allowedDomains', e.target.value)} placeholder="e.g. company.com, tirbeo.app" />
        </Field>
        <Field label="Welcome Email Subject">
          <Input value={cfg.welcomeEmailSubject} onChange={e => upd('welcomeEmailSubject', e.target.value)} />
        </Field>
        <Field label="Welcome Email Template" desc="Use {{name}} and {{email}} as placeholders">
          <textarea className="textarea" rows={3} value={cfg.welcomeEmailTemplate} onChange={e => upd('welcomeEmailTemplate', e.target.value)} />
        </Field>
      </SectionCard>

      <SectionCard title="Security" desc="Password and authentication policies">
        <Field label="Min Password Length">
          <Input type="number" min={4} max={64} value={cfg.passwordMinLength} onChange={e => upd('passwordMinLength', Number(e.target.value))} />
        </Field>
        <Field label="Max Login Attempts" desc="Before account lockout">
          <Input type="number" min={1} max={20} value={cfg.maxLoginAttempts} onChange={e => upd('maxLoginAttempts', Number(e.target.value))} />
        </Field>
        <Field label="Lockout Duration" desc="Minutes">
          <Input type="number" min={1} max={120} value={cfg.lockoutMinutes} onChange={e => upd('lockoutMinutes', Number(e.target.value))} />
        </Field>
        <Field label="Require Email Verification" horizontal>
          <Toggle checked={cfg.requireEmailVerification} onChange={v => upd('requireEmailVerification', v)} />
        </Field>
        <Field label="Allow Password Reset" horizontal>
          <Toggle checked={cfg.allowPasswordReset} onChange={v => upd('allowPasswordReset', v)} />
        </Field>
      </SectionCard>

      <SectionCard title="Session" desc="Session and timeout configuration">
        <Field label="Session Duration" desc="Days before forced re-login">
          <Input type="number" min={1} max={90} value={cfg.sessionDays} onChange={e => upd('sessionDays', Number(e.target.value))} />
        </Field>
        <Field label="Session Timeout" desc="Minutes of inactivity">
          <Input type="number" min={5} max={480} value={cfg.sessionTimeoutMinutes} onChange={e => upd('sessionTimeoutMinutes', Number(e.target.value))} />
        </Field>
      </SectionCard>

      <SectionCard title="Authentication Methods" desc="Enable/disable login methods">
        <Field label="Email OTP" horizontal>
          <Toggle checked={cfg.otpEnabled} onChange={v => upd('otpEnabled', v)} />
        </Field>
        <Field label="Google OAuth" horizontal>
          <Toggle checked={cfg.googleOAuthEnabled} onChange={v => upd('googleOAuthEnabled', v)} />
        </Field>
        <Field label="GitHub OAuth" horizontal>
          <Toggle checked={cfg.githubOAuthEnabled} onChange={v => upd('githubOAuthEnabled', v)} />
        </Field>
      </SectionCard>

      <SectionCard title="Rate Limiting" desc="Protect against abuse">
        <Field label="Requests per Minute" desc="Per IP address">
          <Input type="number" min={5} max={200} value={cfg.rateLimitPerMin} onChange={e => upd('rateLimitPerMin', Number(e.target.value))} />
        </Field>
      </SectionCard>
    </SettingsPage>
  );
}
