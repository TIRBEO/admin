'use client';
import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib';
import { SettingsPage, SectionCard, Field, Toast } from '../shared';

type SetupData = {
  secret: string;
  uri: string;
  recoveryCodes: string[];
};

export default function TwoFactorAuthPage() {
  const [status, setStatus] = useState<{ enabled: boolean; hasSecret: boolean; remainingRecoveryCodes: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecovery, setShowRecovery] = useState(false);
  const [step, setStep] = useState<'idle' | 'setup' | 'verify' | 'done'>('idle');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/2fa');
      if (res.ok) setStatus(await res.json());
    } catch { setStatus({ enabled: false, hasSecret: false, remainingRecoveryCodes: 0 }); }
    setLoading(false);
  };

  useEffect(() => { loadStatus(); }, []);

  const handleSetup = async () => {
    setBusy(true); setMsg(null);
    try {
      const res = await apiFetch('/api/admin/2fa', {
        method: 'POST',
        body: JSON.stringify({ _action: 'setup' }),
      });
      if (!res.ok) { const t = await res.text(); throw new Error(t); }
      const data: SetupData = await res.json();
      setSetupData(data);
      setStep('setup');
    } catch (e: any) { setMsg({ type: 'error', text: e.message || 'Setup failed' }); }
    setBusy(false);
  };

  const handleVerify = async () => {
    if (totpCode.length !== 6) return;
    setBusy(true); setMsg(null);
    try {
      const res = await apiFetch('/api/admin/2fa', {
        method: 'POST',
        body: JSON.stringify({ _action: 'verify', token: totpCode }),
      });
      if (!res.ok) { const t = await res.text(); throw new Error(t); }
      setMsg({ type: 'success', text: '2FA enabled successfully' });
      setStep('done');
      setRecoveryCodes(setupData?.recoveryCodes || []);
      setShowRecovery(true);
      loadStatus();
    } catch (e: any) { setMsg({ type: 'error', text: e.message || 'Verification failed' }); }
    setBusy(false);
  };

  const handleDisable = async () => {
    if (!disableCode && !disablePassword) return;
    setBusy(true); setMsg(null);
    try {
      const body: Record<string, string> = { _action: 'disable' };
      if (disableCode) body.token = disableCode;
      else body.password = disablePassword;
      const res = await apiFetch('/api/admin/2fa', { method: 'POST', body: JSON.stringify(body) });
      if (!res.ok) { const t = await res.text(); throw new Error(t); }
      setMsg({ type: 'success', text: '2FA disabled' });
      setDisableCode('');
      setDisablePassword('');
      setRecoveryCodes([]);
      setShowRecovery(false);
      setStep('idle');
      setSetupData(null);
      setTotpCode('');
      loadStatus();
    } catch (e: any) { setMsg({ type: 'error', text: e.message || 'Disable failed' }); }
    setBusy(false);
  };

  const handleRegenCodes = async () => {
    setBusy(true); setMsg(null);
    try {
      const res = await apiFetch('/api/admin/2fa', {
        method: 'POST',
        body: JSON.stringify({ _action: 'regenerate-codes' }),
      });
      if (!res.ok) throw new Error('Failed to regenerate');
      const data = await res.json();
      setRecoveryCodes(data.recoveryCodes);
      setShowRecovery(true);
      loadStatus();
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
    setBusy(false);
  };

  if (loading) return <div className="loading" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>;

  const qrUrl = setupData?.uri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.uri)}`
    : '';

  return (
    <SettingsPage title="Two-Factor Authentication" desc="Add an extra layer of security to your admin account">
      <Toast msg={msg} onClose={() => setMsg(null)} />

      {status?.enabled ? (
        <>
          <SectionCard title="2FA is Active" desc="Your account is protected with time-based one-time passwords">
            <Field label="Status" horizontal>
              <span className={`badge badge-${status.enabled ? 'success' : 'warning'}`} style={{ fontSize: 12 }}>
                {status.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </Field>
            <Field label="Remaining Recovery Codes" horizontal>
              <span>{status.remainingRecoveryCodes}</span>
            </Field>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-outline" onClick={handleRegenCodes} disabled={busy}>
                Regenerate Recovery Codes
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Disable Two-Factor Authentication" desc="Provide either your current 2FA code or password to disable">
            <Field label="2FA Code">
              <input className="input" type="text" placeholder="000000" maxLength={6} value={disableCode}
                onChange={e => { setDisableCode(e.target.value); setDisablePassword(''); }}
                style={{ width: 140, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 18, letterSpacing: 4 }} />
            </Field>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, margin: '8px 0' }}>— or —</div>
            <Field label="Password">
              <input className="input" type="password" placeholder="Your password" value={disablePassword}
                onChange={e => { setDisablePassword(e.target.value); setDisableCode(''); }} />
            </Field>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-danger" onClick={handleDisable} disabled={busy || (!disableCode && !disablePassword)}>
                {busy ? 'Disabling…' : 'Disable 2FA'}
              </button>
            </div>
          </SectionCard>

          {showRecovery && recoveryCodes.length > 0 && (
            <SectionCard title="Recovery Codes" desc="Store these in a safe place. Each can be used once to log in if you lose access to your authenticator app.">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 400 }}>
                {recoveryCodes.map((c, i) => (
                  <code key={i} style={{
                    padding: '8px 12px', background: 'var(--bg-inset)',
                    border: '1px solid var(--border-default)', borderRadius: 6,
                    fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)',
                    textAlign: 'center', letterSpacing: 1,
                  }}>{c}</code>
                ))}
              </div>
              <p style={{ marginTop: 12, fontSize: 12, color: 'var(--warning)' }}>
                These codes will not be shown again after you leave this page.
              </p>
            </SectionCard>
          )}
        </>
      ) : step === 'setup' || step === 'verify' ? (
        <>
          <SectionCard title="Scan QR Code" desc="Scan this with your authenticator app (Google Authenticator, Authy, etc.)">
            {qrUrl && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <img src={qrUrl} alt="2FA QR Code" width={200} height={200}
                  style={{ borderRadius: 12, border: '1px solid var(--border-default)' }} />
              </div>
            )}
            <Field label="Manual Setup Key" horizontal>
              <code style={{
                padding: '6px 10px', background: 'var(--bg-inset)',
                border: '1px solid var(--border-default)', borderRadius: 6,
                fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)',
                wordBreak: 'break-all',
              }}>{setupData?.secret || ''}</code>
            </Field>
          </SectionCard>

          <SectionCard title="Verify Code" desc="Enter the 6-digit code from your authenticator app to confirm setup">
            <Field label="Authentication Code">
              <input className="input" type="text" placeholder="000000" maxLength={6} value={totpCode}
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{ width: 160, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 22, letterSpacing: 6 }} />
            </Field>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" onClick={handleVerify} disabled={busy || totpCode.length !== 6}>
                {busy ? 'Verifying…' : 'Verify & Enable'}
              </button>
              <button className="btn btn-outline" onClick={() => { setStep('idle'); setSetupData(null); setTotpCode(''); }} disabled={busy}>
                Cancel
              </button>
            </div>
          </SectionCard>
        </>
      ) : (
        <SectionCard title="Set Up Two-Factor Authentication" desc="Protect your admin account with time-based one-time passwords using any authenticator app">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
            Once enabled, you will need to enter a 6-digit code from your authenticator app each time you sign in.
            You will also receive recovery codes that can be used to regain access if you lose your device.
          </p>
          <button className="btn btn-primary" onClick={handleSetup} disabled={busy}>
            {busy ? 'Generating…' : 'Set Up 2FA'}
          </button>
        </SectionCard>
      )}
    </SettingsPage>
  );
}
