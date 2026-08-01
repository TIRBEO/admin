'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { AuthShell, OTPInput } from '@tirbeo/ui';
import { apiPost, ApiError } from '../lib';
import { BrandLogo } from '../components/brand-logo';
import { Eye, EyeOff, ChevronRight, ExternalLink, Shield } from 'lucide-react';
import { CaptchaWidget } from '../components/captcha/captcha-widget';

type Step = 'welcome' | 'password' | 'mfa';

const THEME = {
  primary: '#022B22',
  primaryHover: '#033d33',
  primaryLight: '#e8f0fe',
  text: '#202124',
  textSecondary: '#5f6368',
  textTertiary: '#80868b',
  border: '#dadce0',
  borderFocus: '#022B22',
  error: '#d93025',
  success: '#188038',
  surface: '#ffffff',
  background: '#f8f9fa',
};

function getRedirectUrl(): string {
  if (typeof window === 'undefined') return '/';
  const params = new URLSearchParams(window.location.search);
  const redirectTo = params.get('redirect_to') || params.get('redirect');
  if (redirectTo) return redirectTo;
  return '/';
}

export default function AdminLoginPage() {
  const [step, setStep] = useState<Step>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [captchaRayId, setCaptchaRayId] = useState('');
  const [captchaForceShow, setCaptchaForceShow] = useState(false);
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
    if (!password) { setFieldErrors({ password: 'Enter your password' }); return; }
    setFieldErrors({});
    setLoading(true);
    setError('');
    try {
      const data = await apiPost('admin/login', { email: email.trim(), password, captchaRayId });
      if (data.needs2FA) {
        setTempToken(data.tempToken);
        setDirection('forward');
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
    setDirection('back');
    setStep('welcome');
    setError('');
    setFieldErrors({});
    setPassword('');
  }, []);

  const leftContent = (
    <div className="flex flex-col justify-center h-full bg-[#022B22] relative overflow-hidden">
      <Image
        src="/hero-admin.svg"
        alt="Administrator with secure privileged access"
        fill
        className="object-cover opacity-50"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#022B22] via-[#022B22]/70 to-[#022B22]/40" />
      <div className="relative flex-1 flex flex-col justify-center p-12 lg:p-16">
        <div className="max-w-lg">
          <BrandLogo textClassName="text-[32px] leading-tight font-semibold tracking-tight text-white mb-6 block" height={40} />
          <h2 className="text-[32px] leading-tight font-semibold tracking-tight text-white mb-4">
            Admin Console
          </h2>
          <p className="text-lg text-white/80 leading-relaxed mb-10">
            Secure privileged access for Tirbeo administrators. Manage users, configure settings, and oversee platform operations.
          </p>
          <div className="flex items-center gap-3 text-white/70">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium">Restricted to authorized personnel only</span>
          </div>
        </div>
      </div>
      <div className="relative p-8 text-white/40 text-sm font-medium">
        &copy; {new Date().getFullYear()} Tirbeo. All rights reserved.
      </div>
    </div>
  );

  const inputClassName = "w-full h-11 rounded-lg border border-[#dadce0] bg-white px-3.5 text-sm text-[#202124] placeholder:text-[#80868b] outline-none transition-all duration-200";
  const inputFocusClassName = "focus:border-[#022B22] focus:ring-[3px] focus:ring-[#022B22]/5 hover:border-[#9aa0a6]";
  const labelClassName = "block text-sm font-medium text-[#3c4043] mb-1.5";
  const errorClassName = "text-xs text-[#d93025] mt-1.5";
  const primaryButtonClassName = "h-10 px-5 rounded-lg bg-[#022B22] hover:bg-[#033d33] active:bg-[#044a38] text-white text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-sm hover:shadow-md";

  return (
    <AuthShell title="Admin Console" subtitle="Secure access for administrators" variant="split" leftContent={leftContent} image={{ src: "/hero-admin.svg", alt: "Administrator with secure privileged access" }}>
      <div ref={contentRef} className="min-h-[480px]">
        {step === 'welcome' && (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#022B22]/5 border border-[#022B22]/10">
                <BrandLogo className="h-9 w-9 rounded-full object-contain" />
              </div>
              <h1 className="text-[24px] leading-tight font-semibold tracking-tight text-[#202124] mb-1">Admin sign in</h1>
              <p className="text-[15px] text-[#5f6368] leading-relaxed">Continue to Tirbeo Admin Console</p>
            </div>
            <form onSubmit={handleEmailNext} className="space-y-4">
              <div>
                <label htmlFor="email" className={labelClassName}>Email</label>
                <input id="email" type="email" value={email} onChange={e => { setEmail(e.target.value); setFieldErrors({}); }}
                  placeholder="admin@tirbeo.app" autoFocus autoComplete="email"
                  className={`${inputClassName} ${inputFocusClassName}`}
                  aria-invalid={!!fieldErrors.email} />
                {fieldErrors.email && <p className={errorClassName}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                  {fieldErrors.email}
                </p>}
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                  <p className="text-sm text-[#d93025]">{error}</p>
                </div>
              )}
              <button type="submit" disabled={loading} className={primaryButtonClassName + " w-full"}>
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
            <div className="text-center pt-2">
              <a href="https://tirbeo.app" target="_blank" rel="noopener noreferrer"
                className="text-sm font-medium text-[#022B22] hover:text-[#033d33] transition-colors inline-flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Tirbeo Home
              </a>
            </div>
          </div>
        )}

        {step === 'password' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#022B22]/5 border border-[#022B22]/10">
                <BrandLogo className="h-6 w-6 rounded-full object-contain" />
              </div>
              <div>
                <h1 className="text-[20px] leading-tight font-semibold tracking-tight text-[#202124]">Welcome back</h1>
                <p className="text-sm text-[#5f6368]">{email}</p>
              </div>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className={labelClassName}>Password</label>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); setFieldErrors({}); }}
                    placeholder="Enter your password" autoFocus autoComplete="current-password"
                    className={`${inputClassName} ${inputFocusClassName} pr-10`}
                    aria-invalid={!!fieldErrors.password} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6368] hover:text-[#202124] transition-colors"
                    tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && <p className={errorClassName}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                  {fieldErrors.password}
                </p>}
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                  <p className="text-sm text-[#d93025]">{error}</p>
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
                  className="text-sm font-medium text-[#5f6368] hover:text-[#202124] transition-colors inline-flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Not you?
                </button>
                <button type="submit" disabled={loading} className={primaryButtonClassName}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
              <div className="text-center pt-2">
                <a href="/login/forgot-password" className="text-sm font-medium text-[#022B22] hover:text-[#033d33] transition-colors">
                  Forgot password?
                </a>
              </div>
            </form>
          </div>
        )}

        {step === 'mfa' && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#022B22]/5 border border-[#022B22]/10">
                <Shield className="w-6 h-6 text-[#022B22]" />
              </div>
              <h1 className="text-[20px] leading-tight font-semibold tracking-tight text-[#202124] mb-1">Verify it&apos;s you</h1>
              <p className="text-sm text-[#5f6368]">Enter the 6-digit code from your authenticator app</p>
            </div>
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <OTPInput value={otp} onChange={v => { setOtp(v); setError(''); }} />
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                  <p className="text-sm text-[#d93025] text-center">{error}</p>
                </div>
              )}
              <div className="flex justify-center pt-2">
                <button type="submit" disabled={loading || otp.length !== 6} className={primaryButtonClassName + " w-full max-w-[200px]"}>
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
              <div className="text-center pt-1">
                <button type="button" onClick={handleBackToEmail}
                  className="text-sm font-medium text-[#5f6368] hover:text-[#202124] transition-colors inline-flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Back to email
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
