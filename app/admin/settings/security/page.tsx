'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib';
import { Shield, AlertTriangle, CheckCircle, Key, Lock, Globe, Users, Clock } from 'lucide-react';

export default function SecuritySettingsPage() {
  const [score, setScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/admin/security/score').then(r => r.ok ? r.json() : null).then(d => { setScore(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const scoreValue = score?.score ?? 72;
  const scoreColor = scoreValue >= 80 ? 'var(--tb-green)' : scoreValue >= 60 ? 'var(--tb-yellow)' : 'var(--tb-red)';

  return (
    <div className="page-stack">
      <div className="page-header">
        <div className="page-header-row">
          <div className="page-header-left">
            <h1 className="page-header-title">Security Settings</h1>
            <p className="page-header-description">Platform security configuration and policies</p>
          </div>
        </div>
      </div>

      {/* Security Score */}
      <div className="card">
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ position: 'relative', width: 80, height: 80 }}>
            <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: 80, height: 80 }}>
              <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--tb-border)" strokeWidth="3" />
              <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={scoreColor} strokeWidth="3"
                strokeDasharray={`${scoreValue}, 100`} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: scoreColor }}>{scoreValue}</div>
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--tb-text-primary)', margin: 0 }}>Security Score</h3>
            <p style={{ fontSize: 13, color: 'var(--tb-text-muted)', margin: 0, marginTop: 4 }}>
              {scoreValue >= 80 ? 'Your platform has strong security' : scoreValue >= 60 ? 'Some security improvements recommended' : 'Critical security improvements needed'}
            </p>
          </div>
        </div>
      </div>

      {/* Security Policies */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card">
          <div style={{ padding: '18px 20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--tb-text-primary)', margin: 0, marginBottom: 14 }}>Authentication</h3>
            {[
              { label: 'Require MFA for Admins', desc: 'Two-factor authentication for admin accounts', enabled: true },
              { label: 'Allow Password Login', desc: 'Allow email/password authentication', enabled: true },
              { label: 'Enforce Strong Passwords', desc: 'Minimum 12 characters, mixed case, numbers', enabled: true },
              { label: 'Allow OAuth Providers', desc: 'Google, GitHub, etc.', enabled: true },
              { label: 'Passkey Support', desc: 'WebAuthn / FIDO2 passkey login', enabled: false },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--tb-border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tb-text-primary)' }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--tb-text-muted)', marginTop: 2 }}>{s.desc}</div>
                </div>
                <div style={{ width: 40, height: 22, borderRadius: 11, background: s.enabled ? 'var(--tb-brand)' : 'var(--tb-border)', padding: 2, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', transform: s.enabled ? 'translateX(18px)' : '', transition: 'transform 150ms' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ padding: '18px 20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--tb-text-primary)', margin: 0, marginBottom: 14 }}>Sessions & Access</h3>
            {[
              { label: 'Session Timeout', value: '8 hours' },
              { label: 'Max Sessions Per User', value: '5' },
              { label: 'IP Allowlist', value: 'Disabled' },
              { label: 'Brute Force Protection', value: 'Enabled' },
              { label: 'Account Lockout Threshold', value: '5 attempts' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--tb-border)' }}>
                <span style={{ fontSize: 13, color: 'var(--tb-text-secondary)' }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--tb-text-primary)' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
