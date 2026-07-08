'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib';

interface ApiConfig {
  rateLimitPerMinute: number;
  corsOrigins: string;
  requestTimeoutMs: number;
  rateLimitEnabled: boolean;
  maxBodySizeMb: number;
}

const DEFAULTS: ApiConfig = {
  rateLimitPerMinute: 30,
  corsOrigins: 'admin.tirbeo.app, api.tirbeo.app',
  requestTimeoutMs: 30000,
  rateLimitEnabled: true,
  maxBodySizeMb: 10,
};

export default function ApiSettingsPage() {
  const [cfg, setCfg] = useState<ApiConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch('/api/admin/site-config?app=api');
    if (res.ok) {
      const data = await res.json();
      if (data?.config) setCfg({ ...DEFAULTS, ...data.config });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const full = await apiFetch('/api/admin/site-config?app=api').then(r => r.ok ? r.json() : { config: {} });
    const merged = { ...(full.config || {}), ...cfg };
    const res = await apiFetch('/api/admin/site-config?app=api', {
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
          <h2>API Gateway Settings</h2>
          <p className="desc">Configure api.tirbeo.app behavior</p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
      {msg && <div className={msg.type}>{msg.text}</div>}
      <div className="card">
        <h3>Rate Limiting</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
          <input type="checkbox" checked={cfg.rateLimitEnabled} onChange={e => setCfg(prev => ({ ...prev, rateLimitEnabled: e.target.checked }))} style={{ width: 'auto', marginBottom: 0 }} />
          <span style={{ fontSize: 14 }}>Enable rate limiting</span>
        </label>
        <label>Requests per minute</label>
        <input type="number" min={1} max={1000} value={cfg.rateLimitPerMinute} disabled={!cfg.rateLimitEnabled} onChange={e => setCfg(prev => ({ ...prev, rateLimitPerMinute: Number(e.target.value) }))} />
      </div>
      <div className="card">
        <h3>CORS</h3>
        <label>Allowed Origins (comma-separated)</label>
        <input value={cfg.corsOrigins} onChange={e => setCfg(prev => ({ ...prev, corsOrigins: e.target.value }))} placeholder="admin.tirbeo.app, api.tirbeo.app" />
      </div>
      <div className="card">
        <h3>Limits</h3>
        <label>Request Timeout (ms)</label>
        <input type="number" min={1000} max={120000} value={cfg.requestTimeoutMs} onChange={e => setCfg(prev => ({ ...prev, requestTimeoutMs: Number(e.target.value) }))} />
        <label>Max Body Size (MB)</label>
        <input type="number" min={1} max={50} value={cfg.maxBodySizeMb} onChange={e => setCfg(prev => ({ ...prev, maxBodySizeMb: Number(e.target.value) }))} />
      </div>
    </div>
  );
}
