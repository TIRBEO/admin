'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '../lib';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    fetch(`${API}/api/admin/me`, { credentials: 'include' })
      .then(r => {
        if (r.ok) router.replace('/admin');
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const text = await res.text();
      let d: any = {};
      try { d = JSON.parse(text); } catch { d = { error: text }; }

      if (!res.ok) {
        setError(d.error || d.message || `Login failed (${res.status})`);
        setLoading(false);
        return;
      }

      // 2FA required
      if (d.twoFactorRequired || d.tempToken) {
        setError('Two-factor authentication required. Please use the accounts app to complete 2FA.');
        setLoading(false);
        return;
      }

      // Password change required
      if (d.needsPasswordChange) {
        setError('Password change required. Please change your password first.');
        setLoading(false);
        return;
      }

      // Success — session cookie is set by the API
      if (d.token) localStorage.setItem('auth_token', d.token);
      window.location.href = '/admin';
    } catch (err: any) {
      setError(`Cannot reach API server at ${API}. ${err?.message || ''}`);
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--tb-bg)' }}>
        <Loader2 size={24} style={{ color: 'var(--tb-text-muted)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--tb-bg)' }}>
      <form onSubmit={login} style={{ width: '100%', maxWidth: 380, padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--tb-surface-2)', border: '1px solid var(--tb-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
            <Shield size={26} style={{ color: 'var(--tb-text-primary)' }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--tb-text-primary)', margin: 0 }}>Admin Sign In</h1>
          <p style={{ fontSize: 14, color: 'var(--tb-text-muted)', marginTop: 8 }}>Sign in to access the admin panel</p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'var(--tb-red-soft)', color: 'var(--tb-red)', fontSize: 13, marginBottom: 18, border: '1px solid var(--tb-red-soft)' }}>
            <AlertTriangle size={16} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
            placeholder="admin@tirbeo.com"
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label className="form-label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            disabled={loading}
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading || !email || !password} style={{ width: '100%', height: 42, fontSize: 14 }}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Signing in...
            </span>
          ) : 'Sign in'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--tb-text-muted)' }}>
          API: <span style={{ fontFamily: 'monospace' }}>{API}</span>
        </div>
      </form>
    </div>
  );
}
