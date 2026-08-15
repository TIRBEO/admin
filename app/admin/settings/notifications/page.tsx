'use client';
import { useState } from 'react';
import { Bell, Mail, Globe, Shield, Users, Settings, Send, CheckCircle } from 'lucide-react';

interface NotificationPref { category: string; email: boolean; push: boolean; inApp: boolean; icon: any; }

const DEFAULT_PREFS: NotificationPref[] = [
  { category: 'Security Alerts', email: true, push: true, inApp: true, icon: Shield },
  { category: 'User Activity', email: false, push: false, inApp: true, icon: Users },
  { category: 'System Events', email: true, push: true, inApp: true, icon: Settings },
  { category: 'Content Updates', email: false, push: false, inApp: true, icon: Globe },
  { category: 'Support Tickets', email: true, push: true, inApp: true, icon: Bell },
  { category: 'Maintenance', email: true, push: true, inApp: true, icon: Settings },
];

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPref[]>(DEFAULT_PREFS);

  const togglePref = (category: string, channel: 'email' | 'push' | 'inApp') => {
    setPrefs(prev => prev.map(p => p.category === category ? { ...p, [channel]: !p[channel] } : p));
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title">Notifications</h1>
            <p className="page-header-description">Configure notification channels and delivery preferences</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-primary btn-sm"><Send size={13} /> Send Test</button>
          </div>
        </div>
      </div>

      {/* Delivery Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Emails Sent Today', value: '24', color: 'var(--tb-brand)' },
          { label: 'Push Sent Today', value: '12', color: 'var(--tb-green)' },
          { label: 'In-App Active', value: '89', color: 'var(--tb-yellow)' },
          { label: 'Delivery Rate', value: '98.2%', color: 'var(--tb-green)' },
        ].map(k => (
          <div key={k.label} className="kpi">
            <div className="kpi-header"><span className="kpi-label">{k.label}</span><div style={{ width: 7, height: 7, borderRadius: '50%', background: k.color }} /></div>
            <div className="kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Notification Preferences Table */}
      <div className="card">
        <div className="card-header"><span className="card-title">Notification Categories</span></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="dashboard-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Category</th>
                <th style={{ width: 100, textAlign: 'center' }}><Mail size={14} style={{ verticalAlign: -2 }} /> Email</th>
                <th style={{ width: 100, textAlign: 'center' }}><Globe size={14} style={{ verticalAlign: -2 }} /> Push</th>
                <th style={{ width: 100, textAlign: 'center' }}><Bell size={14} style={{ verticalAlign: -2 }} /> In-App</th>
              </tr>
            </thead>
            <tbody>
              {prefs.map(pref => {
                const Icon = pref.icon;
                return (
                  <tr key={pref.category}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon size={16} style={{ color: 'var(--tb-text-icon-muted)' }} />
                        <span style={{ fontWeight: 500, color: 'var(--tb-text-primary)' }}>{pref.category}</span>
                      </div>
                    </td>
                    {(['email', 'push', 'inApp'] as const).map(channel => (
                      <td key={channel} style={{ textAlign: 'center' }}>
                        <button onClick={() => togglePref(pref.category, channel)}
                          style={{ width: 20, height: 20, borderRadius: 5, background: pref[channel] ? 'var(--tb-brand)' : 'var(--tb-border)', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          {pref[channel] && <CheckCircle size={12} style={{ color: 'white' }} />}
                        </button>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
