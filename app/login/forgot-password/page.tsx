'use client';

import { useState, useCallback } from 'react';
import { OTPInput } from '@tirbeo/ui';
import { AuthShell } from '@tirbeo/ui';
import { PasswordStrength } from '@tirbeo/ui';
import { apiPost, ApiError } from '../../lib';
import { BrandLogo } from '../../components/brand-logo';
import { CaptchaWidget } from '../../components/captcha/captcha-widget';
import { Mail, ArrowLeft, ShieldCheck, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Toast } from '../../(admin)/settings/shared';

type Step = 'email' | 'code' | 'password';

export default function AdminForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; text: string } | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [captchaRayId, setCaptchaRayId] = useState('');
  const [captchaForceShow, setCaptchaForceShow] = useState(false);

  const startResendCountdown = useCallback(() => {
    setResendCountdown(60);
    const interval = window.setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) { window.clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleRequest = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Enter your email'); return; }
    if (!captchaRayId) { setError('Complete the security check to continue.'); return; }
    setLoading(true);
    setError('');
    try {
      await apiPost('auth/password-reset/request', { email: email.trim().toLowerCase(), method: 'otp', captchaRayId, adminOnly: true });
      setStep('code');
      setCode('');
      startResendCountdown();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 403 && /captcha/i.test(err.message)) setCaptchaForceShow(true);
        setToast({ type: 'error', text: err.message });
      }
      else setToast({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, [email, captchaRayId, startResendCountdown]);

  const handleVerify = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) { setError('Enter the 6-digit code from your email.'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await apiPost('auth/password-reset/verify', { email: email.trim().toLowerCase(), code });
      setResetToken(data.resetToken);
      setStep('password');
    } catch (err: unknown) {
      if (err instanceof ApiError) setToast({ type: 'error', text: err.message });
      else setToast({ type: 'error', text: 'Invalid or expired code.' });
      setCode('');
    } finally {
      setLoading(false);
    }
  }, [code, email]);

  const handleConfirm = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError('');
    try {
      await apiPost('auth/password-reset/confirm', { resetToken, newPassword });
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) setToast({ type: 'error', text: err.message });
      else setToast({ type: 'error', text: 'Failed to reset password. The code may have expired.' });
    } finally {
      setLoading(false);
    }
  }, [resetToken, newPassword, confirmPassword]);

  const handleResend = useCallback(async () => {
    if (resendCountdown > 0) return;
    setLoading(true);
    setError('');
    try {
      await apiPost('auth/password-reset/request', { email: email.trim().toLowerCase(), method: 'otp', captchaRayId: 'auto' });
      startResendCountdown();
    } catch (err: unknown) {
      if (err instanceof ApiError) setToast({ type: 'error', text: err.message });
      else setToast({ type: 'error', text: 'Could not resend the code.' });
    } finally {
      setLoading(false);
    }
  }, [email, resendCountdown, startResendCountdown]);

  const stepIcon = step === 'email' ? <Mail className="h-7 w-7" /> : step === 'code' ? <ShieldCheck className="h-7 w-7" /> : <KeyRound className="h-7 w-7" />;
  const stepTitle = step === 'email' ? 'Reset your password' : step === 'code' ? 'Enter verification code' : 'Choose a new password';
  const stepSubtitle = step === 'email'
    ? "Enter your admin email and we'll send you a code"
    : step === 'code'
      ? `We sent a 6-digit code to ${email}`
      : `Set a new password for ${email}`;

  if (success) {
    return (
      <AuthShell title="Password updated" subtitle="You can now sign in with your new password">
        <div className="max-w-sm mx-auto text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--primary-surface, var(--bg-elevated))' }}>
            <Mail className="h-7 w-7" style={{ color: 'var(--primary)' }} />
          </div>
          <div className="flex justify-center">
            <BrandLogo height={28} />
          </div>
          <a href="/login" className="btn-primary w-full">
            Back to login
          </a>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={stepTitle} subtitle={stepSubtitle}>
      <div className="max-w-sm mx-auto">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted, var(--bg-elevated))' }}>
          {stepIcon}
        </div>

        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
        {error && (
          <div className="auth-error mb-4">
            <p>{error}</p>
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleRequest} className="space-y-4">
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
            </div>              <CaptchaWidget
              forceShow={captchaForceShow}
              onSuccess={(rayId: string) => { setCaptchaRayId(rayId); setError(''); }}
              onBlocked={(_rayId: string, reason: string) => setToast({ type: 'error', text: `Access blocked: ${reason}` })}
            />
            <button
              type="submit"
              disabled={loading || !email.trim() || !captchaRayId}
              className="btn-primary w-full"
            >
              {loading ? 'Sending...' : 'Send code'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerify} className="space-y-5">
            <OTPInput value={code} onChange={v => { setCode(v); setError(''); }} error={!!error} />
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="btn-primary w-full"
            >
              {loading ? 'Verifying...' : 'Verify code'}
            </button>
            <div className="flex items-center justify-center gap-2 text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Didn&apos;t get a code?</span>
              {resendCountdown > 0 ? (
                <span style={{ color: 'var(--text-secondary)' }}>Resend in {resendCountdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--primary)' }}
                >
                  Resend code
                </button>
              )}
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setStep('email'); setError(''); }}
                className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Use a different email
              </button>
            </div>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="form-group">
              <label htmlFor="new-password" className="form-label">New password</label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setError(''); }}
                  placeholder="At least 8 characters"
                  autoFocus
                  autoComplete="new-password"
                  className="!pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 transition-opacity hover:opacity-60"
                  style={{ color: 'var(--text-muted)' }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={newPassword} />
              {error && <p className="form-error">{error}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password" className="form-label">Confirm password</label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className="!pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 transition-opacity hover:opacity-60"
                  style={{ color: 'var(--text-muted)' }}
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && !newPassword && <p className="form-error">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={loading || !newPassword || newPassword.length < 8 || !confirmPassword}
              className="btn-primary w-full"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}

        <div className="mt-5 text-center">
          <a href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: 'var(--primary)' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back to login
          </a>
        </div>
      </div>
    </AuthShell>
  );
}
