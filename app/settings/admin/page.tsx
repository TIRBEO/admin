'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib';
import { SettingsPage, SectionCard, Field, Input, Toggle, Select, Toast, ColorInput } from '../shared';

const DEFAULTS = {
  panelName: 'Tirbeo Admin',
  panelLogo: '',
  panelFavicon: '',
  primaryColor: '#4f7aff',
  defaultNewAdminRole: 'editor',
  notifyOnNewUser: true,
  notifyOnUserDelete: true,
  notifyOnError: true,
  auditLogRetentionDays: 90,
  maintenanceMode: false,
  allowSelfSignup: false,
  require2FAForAdmins: false,
  sessionTimeoutMinutes: 120,
  showUserOnlineStatus: true,
  enableAuditLog: true,
  logRetentionDays: 90,
};

type Config = typeof DEFAULTS;

export default function AdminSettingsPage() {
  const [cfg, setCfg] = useState<Config>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch('/api/admin/site-config?app=admin');
    if (res.ok) { const d = await res.json(); if (d?.config) setCfg({ ...DEFAULTS, ...d.config }); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const full = await apiFetch('/api/admin/site-config?app=admin').then(r => r.ok ? r.json() : { config: {} });
    const res = await apiFetch('/api/admin/site-config?app=admin', {
      method: 'PUT', body: JSON.stringify({ config: { ...(full.config || {}), ...cfg } }),
    });
    if (res.ok) setMsg({ type: 'success', text: 'Admin settings saved' }); else setMsg({ type: 'error', text: 'Failed to save' });
    setSaving(false); setTimeout(() => setMsg(null), 3000);
  };

  const upd = <K extends keyof Config>(k: K, v: Config[K]) => setCfg(p => ({ ...p, [k]: v }));

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <SettingsPage title="Admin Panel Settings" desc="Configure admin.tirbeo.app" onSave={save} saving={saving}>
      <Toast msg={msg} onClose={() => setMsg(null)} />

      <SectionCard title="Branding" desc="Appearance of the admin panel">
        <Field label="Panel Name">
          <Input value={cfg.panelName} onChange={e => upd('panelName', e.target.value)} placeholder="Tirbeo Admin" />
        </Field>
        <Field label="Logo URL" desc="Optional logo image">
          <Input value={cfg.panelLogo} onChange={e => upd('panelLogo', e.target.value)} placeholder="https://tirbeo.app/logo.png" />
        </Field>
        <Field label="Favicon URL">
          <Input value={cfg.panelFavicon} onChange={e => upd('panelFavicon', e.target.value)} placeholder="https://tirbeo.app/favicon.ico" />
        </Field>
        <Field label="Primary Color" desc="Main accent color">
          <ColorInput value={cfg.primaryColor} onChange={v => upd('primaryColor', v)} />
        </Field>
      </SectionCard>

      <SectionCard title="Access Control" desc="Who can access the admin panel">
        <Field label="Default Role for New Admins">
          <Select value={cfg.defaultNewAdminRole} onChange={e => upd('defaultNewAdminRole', e.target.value)}>
            <option value="editor">Editor</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </Select>
        </Field>
        <Field label="Allow Self-Signup" desc="Let users sign up for admin access" horizontal>
          <Toggle checked={cfg.allowSelfSignup} onChange={v => upd('allowSelfSignup', v)} />
        </Field>
        <Field label="Require 2FA for Admins" horizontal>
          <Toggle checked={cfg.require2FAForAdmins} onChange={v => upd('require2FAForAdmins', v)} />
        </Field>
        <Field label="Session Timeout" desc="Minutes of inactivity before logout">
          <Input type="number" min={5} max={480} value={cfg.sessionTimeoutMinutes} onChange={e => upd('sessionTimeoutMinutes', Number(e.target.value))} />
        </Field>
      </SectionCard>

      <SectionCard title="Notifications" desc="Email and in-app notifications">
        <Field label="New User Registration" horizontal>
          <Toggle checked={cfg.notifyOnNewUser} onChange={v => upd('notifyOnNewUser', v)} />
        </Field>
        <Field label="User Deletion" horizontal>
          <Toggle checked={cfg.notifyOnUserDelete} onChange={v => upd('notifyOnUserDelete', v)} />
        </Field>
        <Field label="System Errors" horizontal>
          <Toggle checked={cfg.notifyOnError} onChange={v => upd('notifyOnError', v)} />
        </Field>
      </SectionCard>

      <SectionCard title="Audit & Logging" desc="Track admin activity">
        <Field label="Enable Audit Log" horizontal>
          <Toggle checked={cfg.enableAuditLog} onChange={v => upd('enableAuditLog', v)} />
        </Field>
        <Field label="Show User Online Status" horizontal>
          <Toggle checked={cfg.showUserOnlineStatus} onChange={v => upd('showUserOnlineStatus', v)} />
        </Field>
        <Field label="Log Retention" desc="Days to keep audit logs">
          <Input type="number" min={1} max={365} value={cfg.logRetentionDays} onChange={e => upd('logRetentionDays', Number(e.target.value))} />
        </Field>
      </SectionCard>

      <SectionCard title="Maintenance">
        <Field label="Maintenance Mode" desc="Block non-admin access" horizontal>
          <Toggle checked={cfg.maintenanceMode} onChange={v => upd('maintenanceMode', v)} />
        </Field>
      </SectionCard>
    </SettingsPage>
  );
}
