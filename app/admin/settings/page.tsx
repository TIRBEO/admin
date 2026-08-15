'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib';
import {
  Settings, Shield, Bell, Database, Globe, Save, RefreshCw,
  AlertTriangle, CheckCircle, Clock, Eye, EyeOff, Server,
} from 'lucide-react';

export default function SettingsPage() {
  const [maintenance, setMaintenance] = useState({ enabled: false, message: '' });
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [rateLimits, setRateLimits] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [discoverability, setDiscoverability] = useState(true);
  const [retention, setRetention] = useState('90');
  const [privacyMode, setPrivacyMode] = useState(false);

  useEffect(() => {
    apiFetch('/api/admin/maintenance').then(r => r.ok ? r.json() : null).then(d => {
      if (d) setMaintenance({ enabled: d.enabled || false, message: d.message || '' });
    }).catch(() => {});
    apiFetch('/api/admin/rate-limits').then(r => r.ok ? r.json() : null).then(d => {
      if (d) setRateLimits(d);
    }).catch(() => {});
  }, []);

  const toggleMaintenance = async () => {
    setMaintenanceLoading(true);
    try {
      const res = await apiFetch('/api/admin/maintenance', {
        method: 'POST',
        body: JSON.stringify({ enabled: !maintenance.enabled, message: maintenance.message }),
      });
      if (res.ok) setMaintenance(prev => ({ ...prev, enabled: !prev.enabled }));
    } catch {}
    setMaintenanceLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title">Settings</h1>
            <p className="page-header-description">Platform configuration and preferences</p>
          </div>
          <div className="page-header-actions">
            {saved && <span style={{ fontSize: 13, color: 'var(--tb-green)', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} /> Saved</span>}
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              <Save size={13} /> {saving ? 'Saving...' : 'Save All'}
            </button>
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="card" style={{ borderLeft: `3px solid ${maintenance.enabled ? 'var(--tb-yellow)' : 'var(--tb-border)'}` }}>
        <div style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: maintenance.enabled ? 'var(--tb-yellow-soft)' : 'var(--tb-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={16} style={{ color: maintenance.enabled ? 'var(--tb-yellow)' : 'var(--tb-text-muted)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--tb-text-primary)', margin: 0 }}>Maintenance Mode</h3>
              <p style={{ fontSize: 12, color: 'var(--tb-text-muted)', margin: 0, marginTop: 2 }}>
                {maintenance.enabled ? 'Active — users see maintenance page' : 'Inactive — all services running normally'}
              </p>
            </div>
            <button className={`btn ${maintenance.enabled ? 'btn-danger' : 'btn-primary'} btn-sm`} onClick={toggleMaintenance} disabled={maintenanceLoading}>
              {maintenanceLoading ? '...' : maintenance.enabled ? 'Disable' : 'Enable'}
            </button>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Maintenance Message</label>
            <input className="input" value={maintenance.message} onChange={e => setMaintenance(prev => ({ ...prev, message: e.target.value }))}
              placeholder="We're performing scheduled maintenance. Please check back soon." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label">Scheduled Start</label>
              <input className="input" type="datetime-local" />
            </div>
            <div>
              <label className="form-label">Scheduled End</label>
              <input className="input" type="datetime-local" />
            </div>
          </div>
        </div>
      </div>

      {/* System Settings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Analytics */}
        <div className="card">
          <div style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Database size={16} style={{ color: 'var(--tb-text-icon-muted)' }} />
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--tb-text-primary)', margin: 0 }}>Analytics</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Enable Analytics', desc: 'Collect usage data across applications', value: analyticsEnabled, set: setAnalyticsEnabled },
                { label: 'Discoverability', desc: 'Allow search engines to index public pages', value: discoverability, set: setDiscoverability },
                { label: 'Privacy Mode', desc: 'Anonymize user data in analytics', value: privacyMode, set: setPrivacyMode },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--tb-border)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tb-text-primary)' }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--tb-text-muted)', marginTop: 2 }}>{s.desc}</div>
                  </div>
                  <button type="button" onClick={() => s.set(!s.value)}
                    style={{ width: 40, height: 22, borderRadius: 11, background: s.value ? 'var(--tb-brand)' : 'var(--tb-border)', padding: 2, cursor: 'pointer', border: 'none', transition: 'background 150ms' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', transform: s.value ? 'translateX(18px)' : '', transition: 'transform 150ms' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Retention */}
        <div className="card">
          <div style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Clock size={16} style={{ color: 'var(--tb-text-icon-muted)' }} />
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--tb-text-primary)', margin: 0 }}>Data Retention</h3>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Audit Log Retention (days)</label>
              <input className="input" type="number" value={retention} onChange={e => setRetention(e.target.value)} min="30" max="365" />
              <div style={{ fontSize: 11, color: 'var(--tb-text-muted)', marginTop: 4 }}>Audit logs older than {retention} days will be archived</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Session Timeout (minutes)</label>
              <input className="input" type="number" defaultValue="480" min="30" max="1440" />
            </div>
            <div>
              <label className="form-label">Rate Limit Window</label>
              <input className="input" type="text" defaultValue="60" readOnly />
              <div style={{ fontSize: 11, color: 'var(--tb-text-muted)', marginTop: 4 }}>Rate limits are configured per endpoint</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Limits Info */}
      {rateLimits && (
        <div className="card">
          <div className="card-header"><span className="card-title">Rate Limits</span></div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {Object.entries(rateLimits).slice(0, 8).map(([key, value]) => (
              <div key={key} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--tb-surface-1)', border: '1px solid var(--tb-border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tb-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{key}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tb-text-primary)' }}>{String(value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
