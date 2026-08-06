'use client';

import { useState, useCallback, useEffect } from 'react';
import { OTPInput } from '@tirbeo/ui';
import { apiPost, ApiError, API } from '../lib';
import { BrandLogo } from '../components/brand-logo';
import { Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';
import { CaptchaWidget } from '../components/captcha/captcha-widget';

type Step = 'welcome' | 'password' | 'mfa';

function getRedirectUrl(): string {
  if (typeof window === 'undefined') return '/';
  const params = new URLSearchParams(window.location.search);
  const redirectTo = params.get('redirect_to') || params.get('redirect');
  if (redirectTo) return redirectTo;
  return '/';
}

// Cookie helpers
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

const THEME_COOKIE = 'tirbeo_theme';

// Theme variables
const darkVars: Record<string, string> = {
  '--bg': '#000000',
  '--text': '#ffffff',
  '--text-secondary': 'rgba(255, 255, 255, 0.7)',
  '--text-muted': 'rgba(255, 255, 255, 0.4)',
  '--border': 'rgba(255, 255, 255, 0.15)',
  '--border-hover': 'rgba(255, 255, 255, 0.3)',
  '--surface': 'rgba(255, 255, 255, 0.05)',
};

const lightVars: Record<string, string> = {
  '--bg': '#FFFFFF',
  '--text': '#000000',
  '--text-secondary': 'rgba(0, 0, 0, 0.7)',
  '--text-muted': 'rgba(0, 0, 0, 0.4)',
  '--border': 'rgba(0, 0, 0, 0.15)',
  '--border-hover': 'rgba(0, 0, 0, 0.3)',
  '--surface': 'rgba(0, 0, 0, 0.05)',
};

function applyTheme(theme: 'dark' | 'light') {
  const root = document.documentElement;
  const vars = theme === 'dark' ? darkVars : lightVars;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  root.style.backgroundColor = vars['--bg'];
  root.style.color = vars['--text'];
}

export default function AdminLoginPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [captchaRayId, setCaptchaRayId] = useState('');
  const [captchaForceShow, setCaptchaForceShow] = useState(false);

  // Initialize theme from cookie
  useEffect(() => {
    const saved = getCookie(THEME_COOKIE) as 'dark' | 'light' | null;
    const initial = saved === 'light' ? 'light' : 'dark';
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  // Apply theme on change
  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
    setCookie(THEME_COOKIE, theme);
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const validateEmail = (v: string) => {
    if (!v.trim()) return 'Enter your email';
    return '';
  };

  const handleEmailNext = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setFieldErrors({ email: err }); return; }
    setFieldErrors({});
    setError('');
    setStep('password');
  }, [email]);

  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setFieldErrors({ password: 'Enter your password' }); return; }
    setFieldErrors({});
    setLoading(true);
    setError('');
    try {
      const data = await apiPost('admin/login', { email: email.trim(), password, captchaRayId });
      if (data.needs2FA) {
        setTempToken(data.tempToken);
        setStep('mfa');
      } else {
        window.location.href = getRedirectUrl();
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) setError('Invalid email or password');
        else if (err.status === 403) setError('Access denied. Admin privileges required.');
        else setError(err.message);
        if (err.status === 403 && /captcha/i.test(err.message)) setCaptchaForceShow(true);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, captchaRayId]);

  const handleMfaSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Enter a valid 6-digit code'); return; }
    setLoading(true);
    setError('');
    try {
      await apiPost('admin/verify-2fa', { tempToken, code: otp });
      window.location.href = getRedirectUrl();
    } catch (err: unknown) {
      if (err instanceof ApiError) setError(err.message || 'Invalid code');
      else setError('Invalid code');
      setOtp('');
    } finally {
      setLoading(false);
    }
  }, [otp, tempToken]);

  const handleBackToEmail = useCallback(() => {
    setStep('welcome');
    setError('');
    setFieldErrors({});
    setPassword('');
  }, []);

  const isDark = theme === 'dark';

  // OAuth links must point at the API (not this app's own origin — a relative
  // /api/auth/* URL 404s here). We navigate on click (client-only) so the
  // redirect target is built from the real origin without SSR/hydration issues.
  const handleOauth = (provider: string) => {
    if (busy) return;
    setBusy(provider);
    const dest =
      window.location.origin + (getRedirectUrl() === '/' ? '/admin' : getRedirectUrl());
    window.location.href = `${API}/api/auth/${provider}?redirect=${encodeURIComponent(dest)}`;
  };

  return (
    <main 
      className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-[10px] transition-all hover:scale-105"
        style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      >
        {isDark ? (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>

      <div className="w-full max-w-[380px] mx-auto">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-3">
          <BrandLogo className="h-8 w-8" />
          <span className="text-[18px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Tirbeo</span>
        </div>

        {/* Welcome Step */}
        {step === 'welcome' && (
          <div className="fade-in">
            <header className="mb-5">
              <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight leading-tight mb-1">Admin sign in</h1>
              <p className="text-[14px] sm:text-[15px]" style={{ color: 'var(--text-secondary)' }}>Continue to Tirbeo Admin Console</p>
            </header>

            <form onSubmit={handleEmailNext} className="space-y-3" noValidate>
              {/* OAuth Buttons */}
              <div className="space-y-2">
                <button type="button" onClick={() => handleOauth('google')} className="btn-secondary" disabled={!!busy}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
                <button type="button" onClick={() => handleOauth('github')} className="btn-secondary" disabled={!!busy}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  Continue with GitHub
                </button>
                <button type="button" onClick={() => handleOauth('discord')} className="btn-secondary" disabled={!!busy}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Continue with Discord
                </button>
              </div>

              <div className="auth-divider"><span>or</span></div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email address</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setFieldErrors({}); }}
                  placeholder="admin@tirbeo.app"
                  autoFocus
                  autoComplete="email"
                  suppressHydrationWarning
                  aria-invalid={!!fieldErrors.email}
                />
                {fieldErrors.email && <p className="form-error">{fieldErrors.email}</p>}
              </div>

              {error && (
                <div className="auth-error">
                  <p>{error}</p>
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading}>
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </form>

            <div className="mt-5 text-center">
              <a href="/admin_request" className="text-[14px] font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--text-secondary)' }}>
                Create admin account
              </a>
            </div>
          </div>
        )}

        {/* Password Step */}
        {step === 'password' && (
          <div className="fade-in">
            <header className="mb-5">
              <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight leading-tight mb-1">Enter password</h1>
              <p className="text-[14px] sm:text-[15px]" style={{ color: 'var(--text-secondary)' }}>Continue with {email}</p>
            </header>

            <form onSubmit={handlePasswordSubmit} className="space-y-3" noValidate>
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); setFieldErrors({}); }}
                    placeholder="Enter your password"
                    autoFocus
                    autoComplete="current-password"
                    suppressHydrationWarning
                    aria-invalid={!!fieldErrors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="form-error">{fieldErrors.password}</p>}
              </div>

              {error && (
                <div className="auth-error">
                  <p>{error}</p>
                </div>
              )}

              <CaptchaWidget
                autoShow={true}
                forceShow={captchaForceShow}
                onSuccess={(rayId: string) => setCaptchaRayId(rayId)}
                onBlocked={(rayId: string, reason: string) => {
                  setError(`Access blocked: ${reason}`);
                }}
              />

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBackToEmail}
                className="text-[14px] font-medium hover:opacity-70 transition-opacity"
                style={{ color: 'var(--text-muted)' }}
              >
                ← Back
              </button>
              <a href="/login/forgot-password" className="text-[14px] font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>
                Forgot password?
              </a>
            </div>
          </div>
        )}

        {/* MFA Step */}
        {step === 'mfa' && (
          <div className="fade-in">
            <div className="flex justify-center mb-5">
              <div
                className="w-12 h-12  flex items-center justify-center"
                style={{ border: '1px solid var(--border)' }}
              >
                <Shield className="w-6 h-6" strokeWidth={1.5} style={{ color: 'var(--text)' }} />
              </div>
            </div>

            <header className="text-center mb-5">
              <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight leading-tight mb-1">Verify it&apos;s you</h1>
              <p className="text-[14px] sm:text-[15px]" style={{ color: 'var(--text-secondary)' }}>Enter the 6-digit code from your authenticator app</p>
            </header>

            <form onSubmit={handleMfaSubmit} className="space-y-3">
              <div className="form-group">
                <OTPInput value={otp} onChange={v => { setOtp(v); setError(''); }} />
              </div>

              {error && (
                <div className="auth-error">
                  <p>{error}</p>
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleBackToEmail}
                className="text-[14px] font-medium hover:opacity-70 transition-opacity"
                style={{ color: 'var(--text-muted)' }}
              >
                ← Back to email
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <a href="https://tirbeo.app" target="_blank" rel="noopener noreferrer" className="text-[12px] hover:underline" style={{ color: 'var(--text-muted)' }}>
            tirbeo.app
          </a>
        </div>
      </div>
    </main>
  );
}
