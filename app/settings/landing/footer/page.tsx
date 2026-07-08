'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import { SettingsPage, SectionCard, Field, Input, Toggle, NestedCard, AddButton, SubSection, Toast, EmptyState, ItemRow } from '../../shared';

const APP = 'landing';
const SECTION = 'footer';

interface FooterLink { label: string; href: string; }
interface FooterColumn { label: string; links: FooterLink[]; }

const DEFAULTS = {
  logoUrl: '',
  tagline: 'Connect. Share. Thrive.',
  copyright: `© ${new Date().getFullYear()} Tirbeo. All rights reserved.`,
  linkColumns: [
    { label: 'Product', links: [{ label: 'Features', href: '/features' }, { label: 'Pricing', href: '/pricing' }] },
    { label: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Blog', href: '/blog' }, { label: 'Careers', href: '/careers' }] },
    { label: 'Support', links: [{ label: 'Help Center', href: '/help' }, { label: 'Contact', href: '/contact' }] },
  ] as FooterColumn[],
  showNewsletterForm: true,
  newsletterPlaceholder: 'your@email.com',
  newsletterButtonLabel: 'Subscribe',
};

export default function FooterPage() {
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
      setCfg({ ...DEFAULTS, ...stored, linkColumns: stored.linkColumns || DEFAULTS.linkColumns });
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

  const addColumn = () => {
    setCfg(prev => ({ ...prev, linkColumns: [...prev.linkColumns, { label: '', links: [{ label: '', href: '' }] }] }));
  };

  const removeColumn = (ci: number) => {
    setCfg(prev => ({ ...prev, linkColumns: prev.linkColumns.filter((_, i) => i !== ci) }));
  };

  const updateColumnLabel = (ci: number, val: string) => {
    setCfg(prev => {
      const cols = [...prev.linkColumns];
      cols[ci] = { ...cols[ci], label: val };
      return { ...prev, linkColumns: cols };
    });
  };

  const addLink = (ci: number) => {
    setCfg(prev => {
      const cols = [...prev.linkColumns];
      cols[ci] = { ...cols[ci], links: [...cols[ci].links, { label: '', href: '' }] };
      return { ...prev, linkColumns: cols };
    });
  };

  const removeLink = (ci: number, li: number) => {
    setCfg(prev => {
      const cols = [...prev.linkColumns];
      cols[ci] = { ...cols[ci], links: cols[ci].links.filter((_, i) => i !== li) };
      return { ...prev, linkColumns: cols };
    });
  };

  const updateLink = (ci: number, li: number, field: keyof FooterLink, val: string) => {
    setCfg(prev => {
      const cols = [...prev.linkColumns];
      const links = [...cols[ci].links];
      links[li] = { ...links[li], [field]: val };
      cols[ci] = { ...cols[ci], links };
      return { ...prev, linkColumns: cols };
    });
  };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <SettingsPage title="Footer" desc="Configure the footer for tirbeo.app" onSave={save} saving={saving}>
      <Toast msg={msg} />
      <SectionCard title="Brand">
        <Field label="Logo URL" desc="Footer logo image URL">
          <Input value={cfg.logoUrl} onChange={e => update({ logoUrl: e.target.value })} placeholder="https://tirbeo.app/logo.svg" />
        </Field>
        <Field label="Tagline">
          <Input value={cfg.tagline} onChange={e => update({ tagline: e.target.value })} />
        </Field>
        <Field label="Copyright">
          <Input value={cfg.copyright} onChange={e => update({ copyright: e.target.value })} />
        </Field>
      </SectionCard>
      <SectionCard title="Link Columns">
        <SubSection title="Columns" onAdd={addColumn} addLabel="Add Column">
          {cfg.linkColumns.length === 0 && <EmptyState text="No link columns" />}
          {cfg.linkColumns.map((col, ci) => (
            <NestedCard key={ci} onRemove={() => removeColumn(ci)}>
              <Field label="Column Label">
                <Input value={col.label} onChange={e => updateColumnLabel(ci, e.target.value)} placeholder="Product" />
              </Field>
              <SubSection title="Links" onAdd={() => addLink(ci)} addLabel="Add Link">
                {col.links.map((link, li) => (
                  <NestedCard key={li} onRemove={() => removeLink(ci, li)}>
                    <Field label="Label">
                      <Input value={link.label} onChange={e => updateLink(ci, li, 'label', e.target.value)} placeholder="Features" />
                    </Field>
                    <Field label="Href">
                      <Input value={link.href} onChange={e => updateLink(ci, li, 'href', e.target.value)} placeholder="/features" />
                    </Field>
                  </NestedCard>
                ))}
              </SubSection>
            </NestedCard>
          ))}
        </SubSection>
      </SectionCard>
      <SectionCard title="Newsletter Form">
        <Field label="Show Newsletter Form" horizontal>
          <Toggle checked={cfg.showNewsletterForm} onChange={v => update({ showNewsletterForm: v })} />
        </Field>
        <Field label="Placeholder">
          <Input value={cfg.newsletterPlaceholder} onChange={e => update({ newsletterPlaceholder: e.target.value })} />
        </Field>
        <Field label="Button Label">
          <Input value={cfg.newsletterButtonLabel} onChange={e => update({ newsletterButtonLabel: e.target.value })} />
        </Field>
      </SectionCard>
    </SettingsPage>
  );
}
