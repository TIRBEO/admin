'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib';

interface AccountsConfig {
  sessionDays: number;
  otpEnabled: boolean;
  googleOAuthEnabled: boolean;
  passwordMinLength: number;
  allowSignup: boolean;
}

const DEFAULTS: AccountsConfig = {
  sessionDays: 7,
  otpEnabled: true,
  googleOAuthEnabled: true,
  passwordMinLength: 8,
  allowSignup: true,
};

export default function AccountsSettingsPage() {
  const [cfg, setCfg] = useState<AccountsConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch('/api/admin/site-config?app=accounts');
    if (res.ok) {
      const data = await res.json();
      if (data?.config) setCfg({ ...DEFAULTS, ...data.config });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const full = await apiFetch('/api/admin/site-config?app=accounts').then(r => r.ok ? r.json() : { config: {} });
    const merged = { ...(full.config || {}), ...cfg };
    const res = await apiFetch('/api/admin/site-config?app=accounts', {
      method: 'PUT', body: JSON.stringify({ config: merged }),
    });
    if (res.ok) setMsg({ type: 'success', text: 'Saved!' });
    else setMsg({ type: 'error', text: 'Failed to save' });
    setSaving(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const update = <K extends keyof AccountsConfig>(key: K, val: AccountsConfig[K]) =>
    setCfg(prev => ({ ...prev, [key]: val }));

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h2>Accounts Settings</h2>
          <p className="desc">Configure authentication for accounts.tirbeo.app</p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
      {msg && <div className={msg.type}>{msg.text}</div>}

      <div className="card">
        <h3>Session</h3>
        <label>Session Duration (days)</label>
        <input type="number" min={1} max={90} value={cfg.sessionDays} onChange={e => update('sessionDays', Number(e.target.value))} />
      </div>

      <div className="card">
        <h3>Authentication Methods</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
          <input type="checkbox" checked={cfg.otpEnabled} onChange={e => update('otpEnabled', e.target.checked)} style={{ width: 'auto', marginBottom: 0 }} />
          <span style={{ fontSize: 14 }}>Email OTP verification</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
          <input type="checkbox" checked={cfg.googleOAuthEnabled} onChange={e => update('googleOAuthEnabled', e.target.checked)} style={{ width: 'auto', marginBottom: 0 }} />
          <span style={{ fontSize: 14 }}>Google OAuth login</span>
        </label>
      </div>

      <div className="card">
        <h3>Security</h3>
        <label>Minimum Password Length</label>
        <input type="number" min={4} max={64} value={cfg.passwordMinLength} onChange={e => update('passwordMinLength', Number(e.target.value))} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
          <input type="checkbox" checked={cfg.allowSignup} onChange={e => update('allowSignup', e.target.checked)} style={{ width: 'auto', marginBottom: 0 }} />
          <span style={{ fontSize: 14 }}>Allow new user registration</span>
        </label>
      </div>
    </div>
  );
}
