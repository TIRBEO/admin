'use client';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib';

function MailIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>; }
function LockIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="11"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
function UserIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }

type Mode = 'loading' | 'setup' | 'login';

export default function AdminLoginPage() {
  const [mode, setMode] = useState<Mode>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch('/api/admin/check-setup')
      .then(r => r.json())
      .then(d => setMode(d.setupRequired ? 'setup' : 'login'))
      .catch(() => setMode('login'));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      window.location.href = '/';
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });
      await apiFetch('/api/admin/seed', {
        method: 'POST',
        body: JSON.stringify({ email, adminRole: 'super_admin' }),
      });
      window.location.href = '/';
    } catch {
      setError('Setup failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'loading') {
    return (
      <div className="login-page">
        <div className="login-container" style={{ textAlign: 'center' }}>
          <div className="logo" style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Tirbeo</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 16 }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo">Tirbeo</div>
          <h1>{mode === 'setup' ? 'Setup Admin' : 'Admin Panel'}</h1>
          <p>{mode === 'setup' ? 'Create the first admin account' : 'Sign in to manage the platform'}</p>
        </div>
        <div className="glass-card">
          <div>
            {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</p>}
            <form onSubmit={mode === 'setup' ? handleSetup : handleLogin}>
              {mode === 'setup' && (
                <div className="glass-input-wrapper">
                  <div>
                    <span className="input-icon"><UserIcon /></span>
                    <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                </div>
              )}
              <div className="glass-input-wrapper">
                <div>
                  <span className="input-icon"><MailIcon /></span>
                  <input type="email" placeholder="admin@tirbeo.app" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="glass-input-wrapper">
                <div>
                  <span className="input-icon"><LockIcon /></span>
                  <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
              </div>
              <button type="submit" className="signin-btn" disabled={loading}>
                <div>{loading ? 'Please wait…' : mode === 'setup' ? 'Create Admin Account' : 'Sign In'}</div>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
