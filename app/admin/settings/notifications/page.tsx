'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import {
  Bell, Mail, Globe, Shield, Users, Settings, Send, CheckCircle,
  RefreshCw, AlertCircle, BarChart3,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────
interface AdminPrefs {
  email: boolean;
  push: boolean;
  forms: boolean;
  product: boolean;
  support: boolean;
  formsEmail: boolean;
  formsPush: boolean;
  productEmail: boolean;
  productPush: boolean;
  supportEmail: boolean;
  supportPush: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  digestEnabled: boolean;
  digestFrequency: 'daily' | 'weekly' | 'monthly';
  weeklySummary: boolean;
  [key: string]: any;
}

interface BroadcastResult {
  sent: number;
  failed: number;
  message?: string;
}

// ─── Categories & Channels ───────────────────────────────────────
const CATEGORIES = [
  { key: 'forms', label: 'Forms', icon: BarChart3, color: 'var(--tb-blue)' },
  { key: 'product', label: 'Product Updates', icon: Settings, color: 'var(--tb-brand)' },
  { key: 'support', label: 'Support Tickets', icon: Bell, color: 'var(--tb-green)' },
] as const;

const CHANNELS = [
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'push', label: 'Push', icon: Bell },
] as const;

// ─── Page ────────────────────────────────────────────────────────
export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<AdminPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<BroadcastResult | null>(null);

  const loadPrefs = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/notifications/prefs');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPrefs(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPrefs(); }, [loadPrefs]);

  const savePref = useCallback(async (key: string, value: any) => {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    try {
      const res = await apiFetch('/api/admin/notifications/prefs', {
        method: 'PUT',
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setPrefs(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
      await loadPrefs(); // revert
    } finally {
      setSaving(false);
    }
  }, [prefs, loadPrefs]);

  const handleBroadcast = useCallback(async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setBroadcasting(true);
    setBroadcastResult(null);
    try {
      const res = await apiFetch('/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({ title: broadcastTitle, body: broadcastMessage }),
      });
      const data = await res.json();
      setBroadcastResult(data);
      if (res.ok) {
        setBroadcastTitle('');
        setBroadcastMessage('');
      }
    } catch (e: any) {
      setBroadcastResult({ sent: 0, failed: 1, message: e?.message || 'Failed to broadcast' });
    } finally {
      setBroadcasting(false);
    }
  }, [broadcastTitle, broadcastMessage]);

  const handleTestEmail = useCallback(async () => {
    try {
      const res = await apiFetch('/api/email/test', { method: 'POST' });
      const data = await res.json();
      setBroadcastResult({ sent: data.success ? 1 : 0, failed: data.success ? 0 : 1, message: data.message || (data.success ? 'Test email sent' : 'Failed to send test email') });
    } catch (e: any) {
      setBroadcastResult({ sent: 0, failed: 1, message: e?.message || 'Failed' });
    }
  }, []);

  if (loading || !prefs) {
    return (
      <div className="page-stack">
        <div className="page-header">
          <h1 className="page-header-title">Notifications</h1>
        </div>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--tb-text-muted)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={20} /> Notifications
            </h1>
            <p className="page-header-description">Configure notification channels and send broadcasts</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-ghost btn-sm" onClick={loadPrefs}><RefreshCw size={13} /></button>
            <button className="btn btn-secondary btn-sm" onClick={handleTestEmail}><Mail size={13} /> Test Email</button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* ── Notification Matrix ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Your Notification Preferences</span>
          <span style={{ fontSize: 12, color: 'var(--tb-text-muted)' }}>
            {saving ? 'Saving...' : saved ? '✓ Saved' : ''}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--tb-border)' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 500, color: 'var(--tb-text-muted)' }}>Category</th>
                {CHANNELS.map(ch => (
                  <th key={ch.key} style={{ textAlign: 'center', padding: '10px 14px', fontWeight: 500, color: 'var(--tb-text-muted)' }}>
                    <ch.icon size={13} style={{ verticalAlign: -2, marginRight: 4 }} />{ch.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Global toggles */}
              <tr style={{ borderBottom: '1px solid var(--tb-border)', background: 'var(--tb-surface-1)' }}>
                <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--tb-text-primary)' }}>
                  <Users size={13} style={{ marginRight: 6, verticalAlign: -2 }} /> All Channels
                </td>
                {CHANNELS.map(ch => (
                  <td key={ch.key} style={{ textAlign: 'center', padding: '10px 14px' }}>
                    <button
                      onClick={() => savePref(ch.key, !prefs[ch.key])}
                      style={{
                        width: 20, height: 20, borderRadius: 5,
                        background: prefs[ch.key] ? 'var(--tb-brand)' : 'var(--tb-border)',
                        border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {prefs[ch.key] && <CheckCircle size={12} style={{ color: 'white' }} />}
                    </button>
                  </td>
                ))}
              </tr>

              {/* Category-specific toggles */}
              {CATEGORIES.map(cat => (
                <tr key={cat.key} style={{ borderBottom: '1px solid var(--tb-border)' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <cat.icon size={14} style={{ color: cat.color }} />
                      <span style={{ fontWeight: 500, color: 'var(--tb-text-primary)' }}>{cat.label}</span>
                    </div>
                  </td>
                  {CHANNELS.map(ch => {
                    const prefKey = `${cat.key}${ch.key[0].toUpperCase()}${ch.key.slice(1)}`;
                    return (
                      <td key={ch.key} style={{ textAlign: 'center', padding: '10px 14px' }}>
                        <button
                          onClick={() => savePref(prefKey, !prefs[prefKey])}
                          style={{
                            width: 20, height: 20, borderRadius: 5,
                            background: prefs[prefKey] ? 'var(--tb-brand)' : 'var(--tb-border)',
                            border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {prefs[prefKey] && <CheckCircle size={12} style={{ color: 'white' }} />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Quiet Hours ── */}
      <div className="card">
        <div className="card-header"><span className="card-title">Quiet Hours</span></div>
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={prefs.quietHoursEnabled} onChange={e => savePref('quietHoursEnabled', e.target.checked)} />
            Enable quiet hours (suppress email/push)
          </label>
          {prefs.quietHoursEnabled && (
            <>
              <input type="time" value={prefs.quietHoursStart} onChange={e => savePref('quietHoursStart', e.target.value)}
                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--tb-border)', background: 'var(--tb-bg)', color: 'var(--tb-text)', fontSize: 13 }} />
              <span style={{ fontSize: 13, color: 'var(--tb-text-muted)' }}>to</span>
              <input type="time" value={prefs.quietHoursEnd} onChange={e => savePref('quietHoursEnd', e.target.value)}
                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--tb-border)', background: 'var(--tb-bg)', color: 'var(--tb-text)', fontSize: 13 }} />
            </>
          )}
        </div>
      </div>

      {/* ── Digest ── */}
      <div className="card">
        <div className="card-header"><span className="card-title">Email Digest</span></div>
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={prefs.digestEnabled} onChange={e => savePref('digestEnabled', e.target.checked)} />
            Send periodic email digest of unread notifications
          </label>
          {prefs.digestEnabled && (
            <div style={{ display: 'flex', gap: 8, paddingLeft: 24 }}>
              {(['daily', 'weekly', 'monthly'] as const).map(f => (
                <button key={f} onClick={() => savePref('digestFrequency', f)}
                  style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: '1px solid',
                    borderColor: prefs.digestFrequency === f ? 'var(--tb-brand)' : 'var(--tb-border)',
                    background: prefs.digestFrequency === f ? 'var(--tb-brand)' : 'transparent',
                    color: prefs.digestFrequency === f ? 'white' : 'var(--tb-text)',
                  }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Broadcast ── */}
      <div className="card">
        <div className="card-header"><span className="card-title">Send Broadcast Notification</span></div>
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="text"
            placeholder="Notification title"
            value={broadcastTitle}
            onChange={e => setBroadcastTitle(e.target.value)}
            maxLength={120}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--tb-border)', background: 'var(--tb-bg)', color: 'var(--tb-text)', fontSize: 13 }}
          />
          <textarea
            placeholder="Notification body (sent to all users as in-app notification)"
            value={broadcastMessage}
            onChange={e => setBroadcastMessage(e.target.value)}
            rows={3}
            maxLength={2000}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--tb-border)', background: 'var(--tb-bg)', color: 'var(--tb-text)', fontSize: 13, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleBroadcast}
              disabled={broadcasting || !broadcastTitle.trim() || !broadcastMessage.trim()}
            >
              <Send size={13} /> {broadcasting ? 'Sending...' : 'Broadcast to All Users'}
            </button>
            {broadcastResult && (
              <span style={{ fontSize: 12, color: broadcastResult.failed > 0 ? 'var(--tb-red)' : 'var(--tb-green)' }}>
                {broadcastResult.message || `${broadcastResult.sent} sent, ${broadcastResult.failed} failed`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
