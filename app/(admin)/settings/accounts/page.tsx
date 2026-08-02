'use client';
import React, { useEffect } from 'react';
import { SettingsPage, SectionCard, Field, Input, Toggle, Toast, useSiteConfig } from '../shared';

const OAUTH_DEFAULTS = {
  google: { enabled: true, clientId: '', clientSecret: '', redirectUri: '' },
  github: { enabled: false, clientId: '', clientSecret: '', redirectUri: '' },
  discord: { enabled: false, clientId: '', clientSecret: '', redirectUri: '' },
};

type ProviderKey = keyof typeof OAUTH_DEFAULTS;
type ProviderCfg = (typeof OAUTH_DEFAULTS)[ProviderKey];

const DEFAULTS = {
  allowSignup: true,
  passwordMinLength: 8,
  sessionDays: 7,
  otpEnabled: true,
  googleOAuthEnabled: undefined as boolean | undefined,
  githubOAuthEnabled: undefined as boolean | undefined,
  maxLoginAttempts: 5,
  lockoutMinutes: 15,
  requireEmailVerification: true,
  allowPasswordReset: true,
  sessionTimeoutMinutes: 60,
  rateLimitPerMin: 30,
  allowedDomains: '',
  welcomeEmailSubject: 'Welcome to Tirbeo',
  welcomeEmailTemplate: 'Hi {{name}}, welcome to Tirbeo! Get started by exploring your dashboard.',
  captchaForceShow: false,
  oauth: {
    google: { ...OAUTH_DEFAULTS.google },
    github: { ...OAUTH_DEFAULTS.github },
    discord: { ...OAUTH_DEFAULTS.discord },
  },
  ui: {
    welcomeTitle: 'Welcome back',
    welcomeSubtitle: 'Sign in to continue to TIRBEO.',
    heroTitle: 'Everything you need, in one workspace.',
    heroDescription: 'Manage your work, collaborate with your team, and access your TIRBEO apps from one secure account.',
    privacyLink: 'https://docs.tirbeo.app/privacy',
    termsLink: 'https://docs.tirbeo.app/terms',
    helpLink: 'https://docs.tirbeo.app/help',
  },
};

type Config = typeof DEFAULTS;

const PROVIDERS: { key: ProviderKey; label: string; hint: string }[] = [
  { key: 'google', label: 'Google', hint: 'https://console.cloud.google.com' },
  { key: 'github', label: 'GitHub', hint: 'https://github.com/settings/developers' },
  { key: 'discord', label: 'Discord', hint: 'https://discord.com/developers/applications' },
];

function normalizeCfg(stored: any, d: Config): Config {
  const base: Config = { ...d, oauth: { ...d.oauth }, ui: { ...d.ui } };
  if (!stored) return base;
  const merged = { ...base, ...stored, oauth: { ...base.oauth, ...(stored.oauth || {}) }, ui: { ...base.ui, ...(stored.ui || {}) } };
  (Object.keys(OAUTH_DEFAULTS) as ProviderKey[]).forEach((key) => {
    merged.oauth[key] = { ...OAUTH_DEFAULTS[key], ...(merged.oauth[key] || {}) };
  });
  if (stored.googleOAuthEnabled !== undefined && stored.oauth?.google?.enabled === undefined) {
    merged.oauth.google.enabled = !!stored.googleOAuthEnabled;
  }
  if (stored.githubOAuthEnabled !== undefined && stored.oauth?.github?.enabled === undefined) {
    merged.oauth.github.enabled = !!stored.githubOAuthEnabled;
  }
  return merged;
}

export default function AccountsSettingsPage() {
  const { cfg, setCfg, loading, saving, msg, setMsg, save, update } = useSiteConfig<Config>('accounts', undefined, DEFAULTS);

  useEffect(() => {
    if (!loading) setCfg((p) => normalizeCfg(p, DEFAULTS));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const setProvider = <K extends ProviderKey, F extends keyof ProviderCfg>(key: K, field: F, value: ProviderCfg[F]) =>
    setCfg((p) => ({ ...p, oauth: { ...p.oauth, [key]: { ...p.oauth[key], [field]: value } } }));

  const setUi = (k: keyof Config['ui'], v: string) =>
    setCfg((p) => ({ ...p, ui: { ...p.ui, [k]: v } }));

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <SettingsPage title="Accounts Settings" desc="Configure accounts.tirbeo.app authentication" onSave={save} saving={saving}>
      <Toast msg={msg} onClose={() => setMsg(null)} />

      <SectionCard title="Registration" desc="Control who can sign up">
        <Field label="Allow Signup" horizontal>
          <Toggle checked={cfg.allowSignup} onChange={v => update({ allowSignup: v })} />
        </Field>
        <Field label="Allowed Domains" desc="Comma-separated. Leave empty for all.">
          <Input value={cfg.allowedDomains} onChange={e => update({ allowedDomains: e.target.value })} placeholder="e.g. company.com, tirbeo.app" />
        </Field>
        <Field label="Welcome Email Subject">
          <Input value={cfg.welcomeEmailSubject} onChange={e => update({ welcomeEmailSubject: e.target.value })} />
        </Field>
        <Field label="Welcome Email Template" desc="Use {{name}} and {{email}} as placeholders">
          <textarea className="textarea" rows={3} value={cfg.welcomeEmailTemplate} onChange={e => update({ welcomeEmailTemplate: e.target.value })} />
        </Field>
      </SectionCard>

      <SectionCard title="Security" desc="Password and authentication policies">
        <Field label="Min Password Length">
          <Input type="number" min={4} max={64} value={cfg.passwordMinLength} onChange={e => update({ passwordMinLength: Number(e.target.value) })} />
        </Field>
        <Field label="Max Login Attempts" desc="Before account lockout">
          <Input type="number" min={1} max={20} value={cfg.maxLoginAttempts} onChange={e => update({ maxLoginAttempts: Number(e.target.value) })} />
        </Field>
        <Field label="Lockout Duration" desc="Minutes">
          <Input type="number" min={1} max={120} value={cfg.lockoutMinutes} onChange={e => update({ lockoutMinutes: Number(e.target.value) })} />
        </Field>
        <Field label="Require Email Verification" horizontal>
          <Toggle checked={cfg.requireEmailVerification} onChange={v => update({ requireEmailVerification: v })} />
        </Field>
        <Field label="Allow Password Reset" horizontal>
          <Toggle checked={cfg.allowPasswordReset} onChange={v => update({ allowPasswordReset: v })} />
        </Field>
      </SectionCard>

      <SectionCard title="Session" desc="Session and timeout configuration">
        <Field label="Session Duration" desc="Days before forced re-login">
          <Input type="number" min={1} max={90} value={cfg.sessionDays} onChange={e => update({ sessionDays: Number(e.target.value) })} />
        </Field>
        <Field label="Session Timeout" desc="Minutes of inactivity">
          <Input type="number" min={5} max={480} value={cfg.sessionTimeoutMinutes} onChange={e => update({ sessionTimeoutMinutes: Number(e.target.value) })} />
        </Field>
      </SectionCard>

      <SectionCard title="Authentication Methods" desc="Enable/disable login methods">
        <Field label="Email OTP" horizontal>
          <Toggle checked={cfg.otpEnabled} onChange={v => update({ otpEnabled: v })} />
        </Field>
        <Field label="Force CAPTCHA on Signup" horizontal desc="Always show CAPTCHA on the signup form">
          <Toggle checked={cfg.captchaForceShow} onChange={v => update({ captchaForceShow: v })} />
        </Field>
      </SectionCard>

      <SectionCard title="OAuth Providers" desc="Social sign-in. Secrets are stored in the config and override environment variables.">
        {PROVIDERS.map(({ key, label, hint }) => {
          const p = cfg.oauth[key];
          return (
            <div key={key} className="mb-5 last:mb-0">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-sm text-[#202124]">{label}</span>
                <Toggle checked={p.enabled} onChange={v => setProvider(key, 'enabled', v)} />
              </div>
              {p.enabled && (
                <div className="space-y-3">
                  <Field label="Client ID" desc={hint}>
                    <Input value={p.clientId} onChange={e => setProvider(key, 'clientId', e.target.value)} placeholder="Client ID" />
                  </Field>
                  <Field label="Client Secret">
                    <Input type="password" value={p.clientSecret} onChange={e => setProvider(key, 'clientSecret', e.target.value)} placeholder="Client secret" />
                  </Field>
                  <Field label="Redirect URI" desc="Leave empty to derive from the API host">
                    <Input value={p.redirectUri} onChange={e => setProvider(key, 'redirectUri', e.target.value)} placeholder="https://api.tirbeo.app/api/auth/google/callback" />
                  </Field>
                </div>
              )}
            </div>
          );
        })}
      </SectionCard>

      <SectionCard title="Sign-in Page UI" desc="Text shown on the accounts sign-in screens">
        <Field label="Welcome Title">
          <Input value={cfg.ui.welcomeTitle} onChange={e => setUi('welcomeTitle', e.target.value)} />
        </Field>
        <Field label="Welcome Subtitle">
          <Input value={cfg.ui.welcomeSubtitle} onChange={e => setUi('welcomeSubtitle', e.target.value)} />
        </Field>
        <Field label="Hero Title" desc="Left branding panel heading">
          <Input value={cfg.ui.heroTitle} onChange={e => setUi('heroTitle', e.target.value)} />
        </Field>
        <Field label="Hero Description" desc="Left branding panel body text">
          <textarea className="textarea" rows={3} value={cfg.ui.heroDescription} onChange={e => setUi('heroDescription', e.target.value)} />
        </Field>
      </SectionCard>

      <SectionCard title="Footer Links" desc="Links shown at the bottom of the sign-in card">
        <Field label="Privacy URL">
          <Input value={cfg.ui.privacyLink} onChange={e => setUi('privacyLink', e.target.value)} />
        </Field>
        <Field label="Terms URL">
          <Input value={cfg.ui.termsLink} onChange={e => setUi('termsLink', e.target.value)} />
        </Field>
        <Field label="Help URL">
          <Input value={cfg.ui.helpLink} onChange={e => setUi('helpLink', e.target.value)} />
        </Field>
      </SectionCard>

      <SectionCard title="Rate Limiting" desc="Protect against abuse">
        <Field label="Requests per Minute" desc="Per IP address">
          <Input type="number" min={5} max={200} value={cfg.rateLimitPerMin} onChange={e => update({ rateLimitPerMin: Number(e.target.value) })} />
        </Field>
      </SectionCard>
    </SettingsPage>
  );
}
