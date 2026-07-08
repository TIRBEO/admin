'use client';
import React, { useState } from 'react';
import { apiFetch } from '../lib';

export default function AdminLoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body: Record<string, string> = { email, password };
      if (mode === 'signup') body.name = name || email.split('@')[0];
      await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
      window.location.href = '/';
    } catch {
      setError(mode === 'login' ? 'Invalid email or password' : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(m => (m === 'login' ? 'signup' : 'login'));
    setError('');
  };

  return (
    <div className="login-page">
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,122,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,122,255,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="login-container">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #4f7aff 0%, #3b6aff 100%)',
            marginBottom: 16, boxShadow: '0 8px 24px rgba(79,122,255,0.25)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', marginBottom: 4 }}>Tirbeo Admin</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {mode === 'login' ? 'Sign in to manage the platform' : 'Create your admin account'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 16, padding: 28,
        }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
              padding: '10px 14px', borderRadius: 8,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
              color: '#f87171', fontSize: 13,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Name</label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)', borderRadius: 10,
                  transition: 'border-color 0.15s',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input type="text" placeholder="Your name (optional)" value={name} onChange={e => setName(e.target.value)}
                    style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#fff' }} />
                </div>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Email</label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)', borderRadius: 10,
                transition: 'border-color 0.15s',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <input type="email" placeholder="admin@tirbeo.app" value={email} onChange={e => setEmail(e.target.value)} required
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#fff' }} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Password</label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)', borderRadius: 10,
                transition: 'border-color 0.15s',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="11"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input type={showPassword ? 'text' : 'password'} placeholder="Password (min 8 chars)" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#fff' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPassword
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px 16px', border: 'none', borderRadius: 10,
              background: loading ? 'var(--accent-subtle)' : 'linear-gradient(135deg, #4f7aff 0%, #3b6aff 100%)',
              color: loading ? 'var(--accent)' : '#fff',
              fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(79,122,255,0.3)',
              transition: 'all 0.15s', letterSpacing: '0.2px',
            }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Please wait…
                </span>
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button type="button" onClick={toggleMode} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: 'var(--text-muted)',
            }}>
              {mode === 'login' ? (
                <>No account? <span style={{ color: 'var(--accent)', fontWeight: 500 }}>Create one</span></>
              ) : (
                <>Already have one? <span style={{ color: 'var(--accent)', fontWeight: 500 }}>Sign in</span></>
              )}
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 280, margin: '20px auto 0' }}>
          First account is auto-promoted to super_admin.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-card .input-group label:focus-within { border-color: var(--accent) !important; box-shadow: 0 0 0 3px rgba(79,122,255,0.08) !important; }
      `}</style>
    </div>
  );
}
