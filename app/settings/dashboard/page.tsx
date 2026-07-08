'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib';

interface DashboardConfig {
  defaultHome: string;
  itemsPerPage: number;
}

const DEFAULTS: DashboardConfig = {
  defaultHome: 'overview',
  itemsPerPage: 25,
};

export default function DashboardSettingsPage() {
  const [cfg, setCfg] = useState<DashboardConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch('/api/admin/site-config?app=dashboard');
    if (res.ok) {
      const data = await res.json();
      if (data?.config) setCfg({ ...DEFAULTS, ...data.config });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const full = await apiFetch('/api/admin/site-config?app=dashboard').then(r => r.ok ? r.json() : { config: {} });
    const merged = { ...(full.config || {}), ...cfg };
    const res = await apiFetch('/api/admin/site-config?app=dashboard', {
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
          <h2>Dashboard Settings</h2>
          <p className="desc">Configure dashboard.tirbeo.app defaults</p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
      {msg && <div className={msg.type}>{msg.text}</div>}
      <div className="card">
        <h3>General</h3>
        <label>Default Home View</label>
        <select value={cfg.defaultHome} onChange={e => setCfg(prev => ({ ...prev, defaultHome: e.target.value }))}>
          <option value="overview">Overview</option>
          <option value="activity">Activity Feed</option>
          <option value="messages">Messages</option>
        </select>
        <label>Items Per Page</label>
        <input type="number" min={10} max={100} value={cfg.itemsPerPage} onChange={e => setCfg(prev => ({ ...prev, itemsPerPage: Number(e.target.value) }))} />
      </div>
    </div>
  );
}
