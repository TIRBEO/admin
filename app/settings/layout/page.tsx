'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib';

interface LayoutConfig {
  sidebarPosition: 'left' | 'right';
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light' | 'system';
  compactMode: boolean;
  animationsEnabled: boolean;
  showBreadcrumbs: boolean;
  accentColor: string;
}

const DEFAULT_LAYOUT: LayoutConfig = {
  sidebarPosition: 'left',
  sidebarCollapsed: false,
  theme: 'system',
  compactMode: false,
  animationsEnabled: true,
  showBreadcrumbs: true,
  accentColor: '#4f7aff',
};

export default function LayoutSettingsPage() {
  const [cfg, setCfg] = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/layout-config');
      if (res.ok) {
        const data = await res.json();
        if (data?.config) setCfg({ ...DEFAULT_LAYOUT, ...data.config });
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const res = await apiFetch('/api/admin/layout-config', {
        method: 'PUT',
        body: JSON.stringify({ config: cfg }),
      });
      if (res.ok) setMsg({ type: 'success', text: 'Layout settings saved' });
      else setMsg({ type: 'error', text: 'Failed to save' });
    } catch { setMsg({ type: 'error', text: 'Network error' }); }
    finally { setSaving(false); setTimeout(() => setMsg(null), 3000); }
  };

  const update = (patch: Partial<LayoutConfig>) => {
    setCfg(prev => ({ ...prev, ...patch }));
    if (patch.theme !== undefined) {
      const t = patch.theme === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : patch.theme;
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem('tirbeo-theme', t);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('tirbeo-theme');
    if (stored) document.documentElement.setAttribute('data-theme', stored);
  }, []);

  if (loading) return <div className="settings-page"><p className="loading">Loading…</p></div>;

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <div>
          <h2>Layout & Appearance</h2>
          <p className="desc">Customize the admin panel layout, theme, and behavior</p>
        </div>
      </div>
      {msg && <div className={`toast toast-${msg.type}`}>{msg.text}<button className="toast-close" onClick={() => setMsg(null)}>×</button></div>}

      <div className="section-card">
        <div className="section-card-inner">
          <h3 style={{ marginBottom: 4, fontSize: 14, fontWeight: 600 }}>Sidebar</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Configure sidebar position and behavior</p>

          <div className="field">
            <div className="field-label">Sidebar Position</div>
            <select className="select" value={cfg.sidebarPosition} onChange={e => update({ sidebarPosition: e.target.value as 'left' | 'right' })}>
              <option value="left">Left (Default)</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div className="field-horizontal">
            <div className="field-label" style={{ flex: 1 }}>Collapsed by Default</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label className="toggle-wrap">
                <input type="checkbox" className="toggle" checked={cfg.sidebarCollapsed} onChange={e => update({ sidebarCollapsed: e.target.checked })} />
                <span className="toggle-knob"></span>
              </label>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>Start with sidebar collapsed</span>
            </div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-inner">
          <h3 style={{ marginBottom: 4, fontSize: 14, fontWeight: 600 }}>Theme</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Appearance settings</p>

          <div className="field">
            <div className="field-label">Theme</div>
            <select className="select" value={cfg.theme} onChange={e => update({ theme: e.target.value as 'dark' | 'light' | 'system' })}>
              <option value="system">System</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          <div className="field-horizontal">
            <div className="field-label" style={{ flex: 1 }}>Enable Animations</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label className="toggle-wrap">
                <input type="checkbox" className="toggle" checked={cfg.animationsEnabled} onChange={e => update({ animationsEnabled: e.target.checked })} />
                <span className="toggle-knob"></span>
              </label>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>Smooth transitions and micro-interactions</span>
            </div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-inner">
          <h3 style={{ marginBottom: 4, fontSize: 14, fontWeight: 600 }}>Density & Layout</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Adjust visual density and layout options</p>

          <div className="field-horizontal">
            <div className="field-label" style={{ flex: 1 }}>Compact Mode</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label className="toggle-wrap">
                <input type="checkbox" className="toggle" checked={cfg.compactMode} onChange={e => update({ compactMode: e.target.checked })} />
                <span className="toggle-knob"></span>
              </label>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>Reduce padding and spacing for more content</span>
            </div>
          </div>

          <div className="field-horizontal">
            <div className="field-label" style={{ flex: 1 }}>Show Breadcrumbs</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label className="toggle-wrap">
                <input type="checkbox" className="toggle" checked={cfg.showBreadcrumbs} onChange={e => update({ showBreadcrumbs: e.target.checked })} />
                <span className="toggle-knob"></span>
              </label>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>Display breadcrumb navigation on pages</span>
            </div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-inner">
          <h3 style={{ marginBottom: 4, fontSize: 14, fontWeight: 600 }}>Accent Color</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Customize the primary accent color</p>

          <div className="field-horizontal">
            <div className="field-label" style={{ flex: 1 }}>Accent Color</div>
            <div className="color-input-group" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={cfg.accentColor} onChange={e => update({ accentColor: e.target.value })} className="color-swatch" />
              <input className="input" value={cfg.accentColor} onChange={e => update({ accentColor: e.target.value })} style={{ flex: 1 }} />
            </div>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}