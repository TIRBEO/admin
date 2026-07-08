'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib';

interface AdminConfig {
  panelName: string;
  defaultNewAdminRole: string;
  notifyOnNewUser: boolean;
  auditLogRetentionDays: number;
}

const DEFAULTS: AdminConfig = {
  panelName: 'Tirbeo Admin',
  defaultNewAdminRole: 'editor',
  notifyOnNewUser: true,
  auditLogRetentionDays: 90,
};

export default function AdminSettingsPage() {
  const [cfg, setCfg] = useState<AdminConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch('/api/admin/site-config?app=admin');
    if (res.ok) {
      const data = await res.json();
      if (data?.config) setCfg({ ...DEFAULTS, ...data.config });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const full = await apiFetch('/api/admin/site-config?app=admin').then(r => r.ok ? r.json() : { config: {} });
    const merged = { ...(full.config || {}), ...cfg };
    const res = await apiFetch('/api/admin/site-config?app=admin', {
      method: 'PUT', body: JSON.stringify({ config: merged }),
    });
    if (res.ok) setMsg({ type: 'success', text: 'Saved!' });
    else setMsg({ type: 'error', text: 'Failed to save' });
    setSaving(false);
    setTimeout(() => setMsg(null), 3000);
  };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h2>Admin Panel Settings</h2>
          <p className="desc">Configure admin.tirbeo.app behavior</p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
      {msg && <div className={msg.type}>{msg.text}</div>}
      <div className="card">
        <h3>Branding</h3>
        <label>Panel Name</label>
        <input value={cfg.panelName} onChange={e => setCfg(prev => ({ ...prev, panelName: e.target.value }))} placeholder="Tirbeo Admin" />
      </div>
      <div className="card">
        <h3>Permissions</h3>
        <label>Default Role for New Admins</label>
        <select value={cfg.defaultNewAdminRole} onChange={e => setCfg(prev => ({ ...prev, defaultNewAdminRole: e.target.value }))}>
          <option value="editor">Editor</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="card">
        <h3>Notifications</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
          <input type="checkbox" checked={cfg.notifyOnNewUser} onChange={e => setCfg(prev => ({ ...prev, notifyOnNewUser: e.target.checked }))} style={{ width: 'auto', marginBottom: 0 }} />
          <span style={{ fontSize: 14 }}>Notify on new user registration</span>
        </label>
      </div>
      <div className="card">
        <h3>Data</h3>
        <label>Audit Log Retention (days)</label>
        <input type="number" min={1} max={365} value={cfg.auditLogRetentionDays} onChange={e => setCfg(prev => ({ ...prev, auditLogRetentionDays: Number(e.target.value) }))} />
      </div>
    </div>
  );
}
