'use client';

import { useState, useCallback } from 'react';
import { AuthShell } from '@tirbeo/ui';
import { apiPost, ApiError } from '../../lib';
import { BrandLogo } from '../../components/brand-logo';
import { Mail, ArrowLeft } from 'lucide-react';

const THEME = {
  primary: '#1a73e8',
  primaryHover: '#1557b0',
  text: '#202124',
  textSecondary: '#5f6368',
  border: '#dadce0',
  error: '#d93025',
  surface: '#ffffff',
};

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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f0fe]">
            <Mail className="h-7 w-7 text-[#1a73e8]" />
          </div>
          <div className="flex justify-center">
            <BrandLogo height={28} />
          </div>
          <p className="text-sm text-[#5f6368]">
            If an account exists for <strong className="text-[#202124]">{email}</strong>, you will receive a password reset link shortly.
          </p>
          <a href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[#1a73e8] hover:text-[#1557b0] transition-colors">
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
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-[#3c4043] mb-1.5">Email</label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="admin@tirbeo.app"
              autoFocus
              autoComplete="email"
              className="w-full h-11 rounded-lg border border-[#dadce0] bg-white px-3.5 text-sm outline-none transition-all focus:border-[#1a73e8] focus:shadow-[0_0_0_3px_rgba(26,115,232,0.1)]"
              aria-invalid={!!error}
            />
            {error && <p className="text-xs text-[#d93025] mt-1.5">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full h-10 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] active:bg-[#1446a0] text-white text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <div className="mt-5 text-center">
          <a href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1a73e8] hover:text-[#1557b0] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to login
          </a>
        </div>
      </div>
    </AuthShell>
  );
}
