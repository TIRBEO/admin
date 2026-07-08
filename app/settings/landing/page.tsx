'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib';
import { SettingsPage, SectionCard, Field, Input, Textarea, Toast } from '../shared';

const APP = 'landing';
const SECTION = 'general';

const DEFAULTS = {
  metaTitle: 'Tirbeo — Connect. Share. Thrive.',
  metaDescription: 'Tirbeo is a community-first platform for meaningful conversations.',
  ogImage: '',
};

export default function LandingGeneralPage() {
  const [cfg, setCfg] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch(`/api/admin/site-config?app=${APP}`);
    if (res.ok) {
      const data = await res.json();
      const stored = data?.config?.[SECTION] || {};
      setCfg({ ...DEFAULTS, ...stored });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const full = await apiFetch(`/api/admin/site-config?app=${APP}`).then(r => r.ok ? r.json() : { config: {} });
    const merged = { ...(full.config || {}), [SECTION]: cfg };
    const res = await apiFetch(`/api/admin/site-config?app=${APP}`, {
      method: 'PUT', body: JSON.stringify({ config: merged }),
    });
    if (res.ok) setMsg({ type: 'success', text: 'Saved!' });
    else setMsg({ type: 'error', text: 'Failed to save' });
    setSaving(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const update = (patch: Record<string, any>) => setCfg(prev => ({ ...prev, ...patch }));

  if (loading) return <div className="loading">Loading…</div>;

  const links = [
    { href: '/settings/landing/navbar', label: 'Navbar', icon: '≡' },
    { href: '/settings/landing/hero', label: 'Hero', icon: '◆' },
    { href: '/settings/landing/about', label: 'About', icon: 'ℹ' },
    { href: '/settings/landing/faq', label: 'FAQ', icon: '?' },
    { href: '/settings/landing/newsletter', label: 'Newsletter', icon: '✉' },
    { href: '/settings/landing/footer', label: 'Footer', icon: '⌄' },
    { href: '/settings/landing/preloader', label: 'Preloader', icon: '⟳' },
    { href: '/settings/landing/redirects', label: 'Redirects', icon: '⇢' },
  ];

  return (
    <SettingsPage title="Landing Page" desc="General settings and SEO meta fields for tirbeo.app" onSave={save} saving={saving}>
      <Toast msg={msg} />
      <SectionCard title="SEO Meta">
        <Field label="Meta Title" desc="Browser tab title & search result headline">
          <Input value={cfg.metaTitle} onChange={e => update({ metaTitle: e.target.value })} />
        </Field>
        <Field label="Meta Description" desc="Search result description">
          <Textarea value={cfg.metaDescription} onChange={e => update({ metaDescription: e.target.value })} />
        </Field>
        <Field label="OG Image URL" desc="Open Graph share preview image">
          <Input value={cfg.ogImage} onChange={e => update({ ogImage: e.target.value })} placeholder="https://tirbeo.app/og.png" />
        </Field>
      </SectionCard>
      <SectionCard title="Quick Links">
        <div className="quick-actions">
          {links.map(link => (
            <a key={link.href} href={link.href} className="quick-action-card">
              <span className="icon">{link.icon}</span>
              {link.label}
            </a>
          ))}
        </div>
      </SectionCard>
    </SettingsPage>
  );
}
