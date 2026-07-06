'use client';
import React, { useState } from 'react';
import { apiFetch } from '../lib';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo">Tirbeo</div>
          <h1>Admin Panel</h1>
          <p>Sign in to manage the platform</p>
        </div>
        {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</p>}
        <div className="login-card">
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>
                <span className="icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
                <input type="email" placeholder="admin@tirbeo.app" value={email} onChange={e => setEmail(e.target.value)} required />
              </label>
            </div>
            <div className="input-group">
              <label>
                <span className="icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="11"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
              </label>
            </div>
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
