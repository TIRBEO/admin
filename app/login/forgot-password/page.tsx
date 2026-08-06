'use client';

import { useState, useCallback } from 'react';
import { AuthShell } from '@tirbeo/ui';
import { apiPost, ApiError } from '../../lib';
import { BrandLogo } from '../../components/brand-logo';
import { Mail, ArrowLeft } from 'lucide-react';

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Enter your email'); return; }
    setLoading(true);
    setError('');
    try {
      await apiPost('auth/password-reset/request', { email: email.trim() });
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  if (success) {
    return (
      <AuthShell title="Check your email" subtitle={`If an account exists for ${email}, you will receive a password reset link shortly.`}>
        <div className="max-w-sm mx-auto text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--primary-surface, var(--bg-elevated))' }}>
            <Mail className="h-7 w-7" style={{ color: 'var(--primary)' }} />
          </div>
          <div className="flex justify-center">
            <BrandLogo height={28} />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            If an account exists for <strong style={{ color: 'var(--text)' }}>{email}</strong>, you will receive a password reset link shortly.
          </p>
          <a href="/login" className="inline-flex items-center gap-2 text-sm font-medium transition-colors" style={{ color: 'var(--primary)' }}>
            <ArrowLeft className="w-4 h-4" /> Back to login
          </a>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we'll send you a reset link">
      <div className="max-w-sm mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label htmlFor="reset-email" className="form-label">Email</label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="admin@tirbeo.app"
              autoFocus
              autoComplete="email"
              aria-invalid={!!error}
            />
            {error && <p className="form-error">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="btn-primary w-full"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <div className="mt-5 text-center">
          <a href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: 'var(--primary)' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back to login
          </a>
        </div>
      </div>
    </AuthShell>
  );
}
