'use client';
import React, { useState, useCallback } from 'react';
import { API } from '../lib';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        window.location.href = '/';
      } else {
        const text = await res.text();
        setError(text || 'Invalid credentials');
      }
    } catch (err: any) {
      setError(err?.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  return (
    <div className="login-wrapper">
      <div className="login-split">
        {/* Left: White Illustration Column */}
        <div className="login-brand-col">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />

          <div className="brand-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="#022b22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            tirbeo
          </div>

          <div className="illustration">
            <svg width="180" height="180" viewBox="0 0 180 180" fill="none" style={{ marginBottom: 32, opacity: 0.85 }}>
              {/* Dashboard/admin illustration */}
              <rect x="20" y="30" width="140" height="120" rx="12" fill="#F0FDF4" stroke="#569578" strokeWidth="1.5"/>
              <rect x="30" y="45" width="50" height="8" rx="4" fill="#275d46" opacity="0.6"/>
              <rect x="30" y="60" width="120" height="1" fill="#569578" opacity="0.2"/>
              <rect x="30" y="72" width="35" height="50" rx="6" fill="#569578" opacity="0.15"/>
              <rect x="72" y="72" width="35" height="50" rx="6" fill="#275d46" opacity="0.15"/>
              <rect x="114" y="72" width="35" height="50" rx="6" fill="#569578" opacity="0.1"/>
              <rect x="35" y="80" width="25" height="4" rx="2" fill="#569578" opacity="0.4"/>
              <rect x="35" y="90" width="20" height="3" rx="1.5" fill="#6b8a7a" opacity="0.3"/>
              <rect x="77" y="80" width="25" height="4" rx="2" fill="#275d46" opacity="0.4"/>
              <rect x="77" y="90" width="18" height="3" rx="1.5" fill="#6b8a7a" opacity="0.3"/>
              <rect x="119" y="80" width="25" height="4" rx="2" fill="#569578" opacity="0.3"/>
              <rect x="119" y="90" width="22" height="3" rx="1.5" fill="#6b8a7a" opacity="0.3"/>
              <circle cx="150" cy="25" r="8" fill="#569578" opacity="0.2"/>
              <circle cx="15" cy="80" r="6" fill="#275d46" opacity="0.15"/>
            </svg>
            <h2>Admin Control Center</h2>
            <p>Manage your platform, users, routes, and configurations with full administrative control.</p>
          </div>

          <div className="copyright">&copy; 2026 Tirbeo. All rights reserved.</div>
        </div>

        {/* Right: Dark Green Form Column */}
        <div className="login-form-col">
          <div className="login-panel">
            <h2>Admin Login</h2>
            <p className="sub">Sign in to access the admin dashboard</p>

            {error && (
              <div className="login-error-banner">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label>Email</label>
                <div className={`login-input-wrap${error ? ' has-error' : ''}`}>
                  <span className="login-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </span>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="login-input" placeholder="admin@tirbeo.app" required autoFocus
                  />
                </div>
              </div>

              <div className="login-field">
                <label>Password</label>
                <div className={`login-input-wrap${error ? ' has-error' : ''}`}>
                  <span className="login-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="login-input" placeholder="Enter your password" required minLength={8}
                  />
                  <button
                    type="button" className="login-toggle-vis"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="login-options">
                <label className="login-remember">
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                  <span className="login-checkbox" />
                  Remember me
                </label>
                <button type="button" className="login-link-btn">Forgot password?</button>
              </div>

              <button type="submit" disabled={loading} className="login-btn-primary">
                {loading ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4"/>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>Sign In</>
                )}
              </button>
            </form>

            <div className="login-footer-text">
              Need help? <a href="mailto:support@tirbeo.app">Contact Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
