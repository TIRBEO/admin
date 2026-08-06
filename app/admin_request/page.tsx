'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { AuthShell, OTPInput } from '@tirbeo/ui';
import { apiPost, ApiError, API } from '../lib';
import { BrandLogo } from '../components/brand-logo';
import { Eye, EyeOff, ChevronRight, ExternalLink, Shield, CheckCircle2 } from 'lucide-react';
import { CaptchaWidget } from '../components/captcha/captcha-widget';

type Step = 'welcome' | 'password' | 'mfa' | 'success';

// Theme is now handled by design tokens in globals.css

function getRedirectUrl(): string {
  if (typeof window === 'undefined') return '/';
  const params = new URLSearchParams(window.location.search);
  const redirectTo = params.get('redirect_to') || params.get('redirect');
  if (redirectTo) return redirectTo;
  return '/';
}

// OAuth must go through the API (a relative /api/auth/* URL 404s on this app)
// with an absolute, allow-listed redirect target. Navigation happens on click
// so the origin is built client-side (no SSR/hydration mismatch).

export default function AdminRequestPage() {
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
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [captchaRayId, setCaptchaRayId] = useState('');
  const [captchaForceShow, setCaptchaForceShow] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [reason, setReason] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.opacity = '0';
      contentRef.current.style.transform = direction === 'forward' ? 'translateY(8px)' : 'translateY(-8px)';
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.style.transition = 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
          contentRef.current.style.opacity = '1';
          contentRef.current.style.transform = 'translateY(0)';
        }
      });
    }
  }, [step, direction]);

  const validateEmail = (v: string) => {
    if (!v.trim()) return 'Enter your email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address';
    return '';
  };

  const handleEmailNext = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setFieldErrors({ email: err }); return; }
    setFieldErrors({});
    setError('');
    setDirection('forward');
    setStep('password');
  }, [email]);

  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setFieldErrors({ password: 'Enter a password' }); return; }
    if (password.length < 8) { setFieldErrors({ password: 'Password must be at least 8 characters' }); return; }
    if (!reason.trim()) { setFieldErrors({ reason: 'Please tell us why you want admin access' }); return; }
    setFieldErrors({});
    setLoading(true);
    setError('');
    try {
      const data = await apiPost('auth/signup', {
        email: email.trim(),
        password,
        firstName: email.trim().split('@')[0],
        lastName: '',
        policyAccepted: true,
        adminRequest: true,
      });
      if (data.needs2FA) {
        setTempToken(data.tempToken);
        setDirection('forward');
        setStep('mfa');
      } else {
        const req = await apiPost('admin/requests', {
          fullName: email.trim(),
          reason: reason.trim(),
          referredBy: referredBy.trim() || undefined,
          note: `Referred by: ${referredBy.trim() || 'N/A'}. Reason: ${reason.trim()}`,
        });
        setRequestId(req.id);
        setDirection('forward');
        setStep('success');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409) setError('An account with this email already exists');
        else setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, captchaRayId, reason, referredBy]);

  const handleMfaSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Enter a valid 6-digit code'); return; }
    setLoading(true);
    setError('');
    try {
      await apiPost('auth/verify-2fa', { tempToken, code: otp });
      const req = await apiPost('admin/requests', {
        fullName: email.trim(),
        reason: reason.trim(),
        referredBy: referredBy.trim() || undefined,
        note: `Referred by: ${referredBy.trim() || 'N/A'}. Reason: ${reason.trim()}`,
      });
      setRequestId(req.id);
      setDirection('forward');
      setStep('success');
    } catch (err: unknown) {
      if (err instanceof ApiError) setError(err.message || 'Invalid code');
      else setError('Invalid code');
      setOtp('');
    } finally {
      setLoading(false);
    }
  }, [otp, tempToken, email, reason, referredBy]);

  const handleBackToEmail = useCallback(() => {
    setDirection('back');
    setStep('welcome');
    setError('');
    setFieldErrors({});
    setPassword('');
  }, []);

  const handleOauth = useCallback((provider: string) => {
    if (busy) return;
    setBusy(provider);
    const dest =
      window.location.origin + (getRedirectUrl() === '/' ? '/admin' : getRedirectUrl());
    window.location.href = `${API}/api/auth/${provider}?redirect=${encodeURIComponent(dest)}`;
  }, [busy]);

  const leftContent = (
    <div className="hidden md:flex flex-col justify-center h-full relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Image
        src="/hero-admin.svg"
        alt="Administrator with secure privileged access"
        fill
        className="object-cover opacity-20"
        priority
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, var(--bg), color-mix(in srgb, var(--bg) 80%, transparent) 60%, color-mix(in srgb, var(--bg) 60%, transparent))',
        }}
      />
      <div className="relative flex-1 flex flex-col justify-center p-12 lg:p-16">
        <div className="max-w-lg">
          <BrandLogo
            textClassName="text-[32px] leading-tight font-semibold tracking-tight mb-6 block"
            height={40}
          />
          <h2 className="text-[32px] leading-tight font-semibold tracking-tight mb-4" style={{ color: 'var(--text)' }}>
            Admin Access Request
          </h2>
          <p className="text-lg leading-relaxed mb-10" style={{ color: 'var(--text-secondary)' }}>
            Request administrator access to Tirbeo. Your request will be reviewed by the platform team.
          </p>
          <div className="flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <Shield className="w-5 h-5" style={{ color: 'var(--text)' }} />
            </div>
            <span className="text-sm font-medium">All requests are manually reviewed</span>
          </div>
        </div>
      </div>
      <div className="relative p-8 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
        &copy; {new Date().getFullYear()} Tirbeo. All rights reserved.
      </div>
    </div>
  );

  const darkInputClassName = "w-full h-11 rounded-[14px] border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-200 focus:border-[var(--border-hover)] focus:ring-[3px] focus:ring-[var(--surface)]";
  const labelClassName = "block text-sm font-medium text-[var(--text-secondary)] mb-1.5";
  const errorClassName = "text-xs text-[var(--error)] mt-1.5";
  const primaryButtonClassName = "h-10 px-5 rounded-full bg-[var(--text)] text-[var(--bg)] text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2";

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AuthShell title="Admin Access Request" subtitle="Request administrator access for review">
        <div ref={contentRef} className="min-h-[480px]">
          <div className="mx-auto max-w-md w-full px-4">
            <div className="bg-[var(--bg-surface)] rounded-2xl p-6 shadow-xl">
          {step === 'welcome' && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <BrandLogo className="h-9 w-9 rounded-full object-contain" />
                </div>
                <h1 className="text-[24px] leading-tight font-semibold tracking-tight text-[var(--text)] mb-1">Request admin access</h1>
                <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">Create an account and request admin privileges</p>
              </div>
              <form onSubmit={handleEmailNext} className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <button type="button" onClick={() => handleOauth('google')} disabled={!!busy} className="btn-secondary">
                      <span>Google</span>
                    </button>
                    <button type="button" onClick={() => handleOauth('github')} disabled={!!busy} className="btn-secondary">
                      <span>GitHub</span>
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => handleOauth('discord')} disabled={!!busy} className="btn-secondary">
                      <span>Discord</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[var(--border)]" />
                    <div className="text-xs text-[var(--text-muted)]">Or</div>
                    <div className="flex-1 h-px bg-[var(--border)]" />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className={labelClassName}>Email</label>
                  <input id="email" type="email" name="email" value={email} onChange={e => { setEmail(e.target.value); setFieldErrors({}); }}
                    placeholder="you@example.com" autoFocus autoComplete="email" suppressHydrationWarning
                    className={darkInputClassName}
                    aria-invalid={!!fieldErrors.email} />
                  {fieldErrors.email && <p className={errorClassName}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                    {fieldErrors.email}
                  </p>}
                </div>
                {error && (
                  <div
                    className="p-3 rounded-lg border"
                    style={{
                      borderColor: 'color-mix(in srgb, var(--error) 45%, var(--border))',
                      background: 'color-mix(in srgb, var(--error) 7%, var(--bg-surface))',
                    }}
                  >
                    <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
                  </div>
                )}
                <button type="submit" disabled={loading} className={primaryButtonClassName + " w-full"}>
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
              <div className="text-center pt-2">
                <a href="/login" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
                  Already have an account? Sign in
                </a>
              </div>
            </div>
          )}

          {step === 'password' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)]">
                  <BrandLogo className="h-6 w-6 rounded-full object-contain" />
                </div>
                <div>
                  <h1 className="text-[20px] leading-tight font-semibold tracking-tight text-[var(--text)]">Create password</h1>
                  <p className="text-sm text-[var(--text-secondary)]">{email}</p>
                </div>
              </div>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className={labelClassName}>Password</label>
                  <div className="relative">
                    <input id="password" type={showPassword ? 'text' : 'password'} name="password" value={password}
                      onChange={e => { setPassword(e.target.value); setError(""); setFieldErrors({}); }}
                      placeholder="Create a password" autoFocus autoComplete="new-password" suppressHydrationWarning
                      className={`${darkInputClassName} pr-10`}
                      aria-invalid={!!fieldErrors.password} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className={errorClassName}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                    {fieldErrors.password}
                  </p>}
                </div>
                <div>
                  <label htmlFor="reason" className={labelClassName}>Why do you want admin access? <span style={{ color: 'var(--error)' }}>*</span></label>
                  <textarea id="reason" value={reason} onChange={e => { setReason(e.target.value); setFieldErrors(prev => ({ ...prev, reason: '' })); }}
                    placeholder="Describe your role and why you need admin access..." rows={3}
                    className={`${darkInputClassName} resize-none`}
                    aria-invalid={!!fieldErrors.reason} />
                  {fieldErrors.reason && <p className={errorClassName}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                    {fieldErrors.reason}
                  </p>}
                </div>
                <div>
                  <label htmlFor="referredBy" className={labelClassName}>Who referred you? (optional)</label>
                  <input id="referredBy" type="text" value={referredBy} onChange={e => { setReferredBy(e.target.value); setFieldErrors(prev => ({ ...prev, referredBy: '' })); }}
                    placeholder="Name or email of who suggested you apply" autoComplete="off"
                    className={darkInputClassName} />
                </div>
                {error && (
                  <div
                    className="p-3 rounded-lg border"
                    style={{
                      borderColor: 'color-mix(in srgb, var(--error) 45%, var(--border))',
                      background: 'color-mix(in srgb, var(--error) 7%, var(--bg-surface))',
                    }}
                  >
                    <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
                  </div>
                )}
                <CaptchaWidget
                  autoShow={true}
                  forceShow={captchaForceShow}
                  onSuccess={(rayId: string) => setCaptchaRayId(rayId)}
                  onBlocked={(rayId: string, reason: string) => {
                    setError(`Access blocked: ${reason}. Ray ID: ${rayId}`);
                  }}
                />
                <div className="flex items-center justify-between pt-2">
                  <button type="button" onClick={handleBackToEmail}
                    className="text-sm font-medium transition-colors inline-flex items-center gap-1"
                    style={{ color: 'var(--text-muted)' }}>
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Back
                  </button>
                  <button type="submit" disabled={loading} className={primaryButtonClassName}>
                    {loading ? 'Creating account...' : 'Request access'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'mfa' && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)]">
                  <Shield className="w-6 h-6 text-[var(--text-secondary)]" />
                </div>
                <h1 className="text-[20px] leading-tight font-semibold tracking-tight text-[var(--text)] mb-1">Verify it&apos;s you</h1>
                <p className="text-sm text-[var(--text-secondary)]">Enter the 6-digit code from your authenticator app</p>
              </div>
              <form onSubmit={handleMfaSubmit} className="space-y-4">
                <OTPInput value={otp} onChange={v => { setOtp(v); setError(''); }} />
                {error && (
                  <div
                    className="p-3 rounded-lg border"
                    style={{
                      borderColor: 'color-mix(in srgb, var(--error) 45%, var(--border))',
                      background: 'color-mix(in srgb, var(--error) 7%, var(--bg-surface))',
                    }}
                  >
                    <p className="text-sm text-center" style={{ color: 'var(--error)' }}>{error}</p>
                  </div>
                )}
                <div className="flex justify-center pt-2">
                  <button type="submit" disabled={loading || otp.length !== 6} className={primaryButtonClassName + " w-full max-w-[200px]"}>
                    {loading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                <div className="text-center pt-1">
                  <button type="button" onClick={handleBackToEmail}
                    className="text-sm font-medium transition-colors inline-flex items-center gap-1"
                    style={{ color: 'var(--text-muted)' }}>
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Back to email
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--success-surface)] border border-[var(--success)]">
                  <CheckCircle2 className="w-7 h-7 text-[var(--success)]" />
                </div>
                <h1 className="text-[24px] leading-tight font-semibold tracking-tight text-[var(--text)] mb-2">Request submitted</h1>
                <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                  Your admin access request has been sent for review. We&apos;ll notify you at <strong className="text-[var(--text)]">{email}</strong> once it&apos;s processed.
                </p>
                {requestId && (
                  <p className="text-xs text-[var(--text-muted)] mt-2">Request ID: {requestId}</p>
                )}
              </div>
              <div className="pt-4">
                <a href="/login" className={primaryButtonClassName + " w-full"}>
                  Continue to sign in
                </a>
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
      </AuthShell>
    </div>
  );
}
