'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib';
import { SettingsPage, SectionCard, Field, Input, Toggle, Toast } from '../shared';

const DEFAULTS = {
  rateLimitPerMinute: 30,
  rateLimitEnabled: true,
  corsOrigins: 'admin.tirbeo.app, api.tirbeo.app',
  requestTimeoutMs: 30000,
  maxBodySizeMb: 10,
  logAllRequests: true,
  logRetentionDays: 30,
  blocklistEnabled: true,
  securityHeadersEnabled: true,
  enableRequestValidation: true,
  enableCsrfProtection: true,
  allowedMethods: 'GET, POST, PUT, PATCH, DELETE',
  apiBaseUrl: 'https://api.tirbeo.app',
  enableCors: true,
  jwtSecret: '',
};

type Config = typeof DEFAULTS;

export default function ApiSettingsPage() {
  const [cfg, setCfg] = useState<Config>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch('/api/admin/site-config?app=api');
    if (res.ok) { const d = await res.json(); if (d?.config) setCfg({ ...DEFAULTS, ...d.config }); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const full = await apiFetch('/api/admin/site-config?app=api').then(r => r.ok ? r.json() : { config: {} });
    const res = await apiFetch('/api/admin/site-config?app=api', {
      method: 'PUT', body: JSON.stringify({ config: { ...(full.config || {}), ...cfg } }),
    });
    if (res.ok) setMsg({ type: 'success', text: 'API settings saved' }); else setMsg({ type: 'error', text: 'Failed to save' });
    setSaving(false); setTimeout(() => setMsg(null), 3000);
  };

  const upd = <K extends keyof Config>(k: K, v: Config[K]) => setCfg(p => ({ ...p, [k]: v }));

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <SettingsPage title="API Gateway Settings" desc="Configure api.tirbeo.app" onSave={save} saving={saving}>
      <Toast msg={msg} onClose={() => setMsg(null)} />

      <SectionCard title="General" desc="Basic API configuration">
        <Field label="API Base URL">
          <Input value={cfg.apiBaseUrl} onChange={e => upd('apiBaseUrl', e.target.value)} placeholder="https://api.tirbeo.app" />
        </Field>
        <Field label="Allowed Methods" desc="Comma-separated HTTP methods">
          <Input value={cfg.allowedMethods} onChange={e => upd('allowedMethods', e.target.value)} />
        </Field>
      </SectionCard>

      <SectionCard title="Rate Limiting" desc="Protect against abuse">
        <Field label="Enable Rate Limiting" horizontal>
          <Toggle checked={cfg.rateLimitEnabled} onChange={v => upd('rateLimitEnabled', v)} />
        </Field>
        <Field label="Requests per Minute" desc="Per IP address">
          <Input type="number" min={1} max={1000} value={cfg.rateLimitPerMinute} disabled={!cfg.rateLimitEnabled}
            onChange={e => upd('rateLimitPerMinute', Number(e.target.value))} />
        </Field>
      </SectionCard>

      <SectionCard title="CORS & Security" desc="Cross-origin and security headers">
        <Field label="Enable CORS" horizontal>
          <Toggle checked={cfg.enableCors} onChange={v => upd('enableCors', v)} />
        </Field>
        <Field label="Allowed Origins" desc="Comma-separated">
          <Input value={cfg.corsOrigins} onChange={e => upd('corsOrigins', e.target.value)} placeholder="admin.tirbeo.app, api.tirbeo.app" />
        </Field>
        <Field label="Security Headers" horizontal>
          <Toggle checked={cfg.securityHeadersEnabled} onChange={v => upd('securityHeadersEnabled', v)} />
        </Field>
        <Field label="CSRF Protection" horizontal>
          <Toggle checked={cfg.enableCsrfProtection} onChange={v => upd('enableCsrfProtection', v)} />
        </Field>
        <Field label="Request Validation" horizontal>
          <Toggle checked={cfg.enableRequestValidation} onChange={v => upd('enableRequestValidation', v)} />
        </Field>
      </SectionCard>

      <SectionCard title="Limits & Timeouts" desc="Request constraints">
        <Field label="Request Timeout" desc="Milliseconds">
          <Input type="number" min={1000} max={120000} value={cfg.requestTimeoutMs} onChange={e => upd('requestTimeoutMs', Number(e.target.value))} />
        </Field>
        <Field label="Max Body Size" desc="Megabytes">
          <Input type="number" min={1} max={50} value={cfg.maxBodySizeMb} onChange={e => upd('maxBodySizeMb', Number(e.target.value))} />
        </Field>
      </SectionCard>

      <SectionCard title="Logging & Blocklist" desc="API monitoring">
        <Field label="Log All Requests" horizontal>
          <Toggle checked={cfg.logAllRequests} onChange={v => upd('logAllRequests', v)} />
        </Field>
        <Field label="Log Retention" desc="Days">
          <Input type="number" min={1} max={90} value={cfg.logRetentionDays} onChange={e => upd('logRetentionDays', Number(e.target.value))} />
        </Field>
        <Field label="Enable Blocklist" horizontal>
          <Toggle checked={cfg.blocklistEnabled} onChange={v => upd('blocklistEnabled', v)} />
        </Field>
      </SectionCard>
    </SettingsPage>
  );
}
