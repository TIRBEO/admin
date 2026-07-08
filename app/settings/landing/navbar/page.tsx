'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import { SettingsPage, SectionCard, Field, Input, Textarea, NestedCard, ItemRow, AddButton, SubSection, Toast, EmptyState, DROPDOWNS_TEMPLATE } from '../../shared';

const APP = 'landing';
const SECTION = 'navbar';

interface DropdownItem { label: string; description: string; link: string; }
interface DropdownGroup { label: string; items: DropdownItem[]; }

const DEFAULTS = {
  siteName: 'Tirbeo',
  logoUrl: '',
  ctaText: 'Get Started',
  ctaUrl: '/login',
  dropdowns: JSON.parse(JSON.stringify(DROPDOWNS_TEMPLATE)) as DropdownGroup[],
};

export default function NavbarPage() {
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
      setCfg({ ...DEFAULTS, ...stored, dropdowns: stored.dropdowns || DEFAULTS.dropdowns });
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

  const addGroup = () => {
    setCfg(prev => ({ ...prev, dropdowns: [...prev.dropdowns, { label: '', items: [{ label: '', description: '', link: '' }] }] }));
  };

  const removeGroup = (gi: number) => {
    setCfg(prev => ({ ...prev, dropdowns: prev.dropdowns.filter((_, i) => i !== gi) }));
  };

  const updateGroup = (gi: number, val: string) => {
    setCfg(prev => {
      const d = [...prev.dropdowns];
      d[gi] = { ...d[gi], label: val };
      return { ...prev, dropdowns: d };
    });
  };

  const addItem = (gi: number) => {
    setCfg(prev => {
      const d = [...prev.dropdowns];
      d[gi] = { ...d[gi], items: [...d[gi].items, { label: '', description: '', link: '' }] };
      return { ...prev, dropdowns: d };
    });
  };

  const removeItem = (gi: number, ii: number) => {
    setCfg(prev => {
      const d = [...prev.dropdowns];
      d[gi] = { ...d[gi], items: d[gi].items.filter((_, i) => i !== ii) };
      return { ...prev, dropdowns: d };
    });
  };

  const updateItem = (gi: number, ii: number, field: keyof DropdownItem, val: string) => {
    setCfg(prev => {
      const d = [...prev.dropdowns];
      const items = [...d[gi].items];
      items[ii] = { ...items[ii], [field]: val };
      d[gi] = { ...d[gi], items };
      return { ...prev, dropdowns: d };
    });
  };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <SettingsPage title="Navbar" desc="Configure the top navigation bar for tirbeo.app" onSave={save} saving={saving}>
      <Toast msg={msg} />
      <SectionCard title="Brand">
        <Field label="Site Name">
          <Input value={cfg.siteName} onChange={e => update({ siteName: e.target.value })} />
        </Field>
        <Field label="Logo URL" desc="URL to the logo image">
          <Input value={cfg.logoUrl} onChange={e => update({ logoUrl: e.target.value })} placeholder="https://tirbeo.app/logo.svg" />
        </Field>
      </SectionCard>
      <SectionCard title="Call to Action">
        <Field label="CTA Text">
          <Input value={cfg.ctaText} onChange={e => update({ ctaText: e.target.value })} />
        </Field>
        <Field label="CTA URL">
          <Input value={cfg.ctaUrl} onChange={e => update({ ctaUrl: e.target.value })} />
        </Field>
      </SectionCard>
      <SectionCard title="Dropdown Menus">
        <SubSection title="Menu Groups" onAdd={addGroup} addLabel="Add Group">
          {cfg.dropdowns.length === 0 && <EmptyState text="No dropdown groups" />}
          {cfg.dropdowns.map((group, gi) => (
            <NestedCard key={gi} onRemove={() => removeGroup(gi)}>
              <Field label="Group Label">
                <Input value={group.label} onChange={e => updateGroup(gi, e.target.value)} placeholder="Products" />
              </Field>
              <SubSection title="Items" onAdd={() => addItem(gi)} addLabel="Add Item">
                {group.items.map((item, ii) => (
                  <NestedCard key={ii} onRemove={() => removeItem(gi, ii)}>
                    <Field label="Label">
                      <Input value={item.label} onChange={e => updateItem(gi, ii, 'label', e.target.value)} placeholder="Tirbeo Chat" />
                    </Field>
                    <Field label="Description">
                      <Input value={item.description} onChange={e => updateItem(gi, ii, 'description', e.target.value)} placeholder="Real-time messaging" />
                    </Field>
                    <Field label="Link">
                      <Input value={item.link} onChange={e => updateItem(gi, ii, 'link', e.target.value)} placeholder="/login" />
                    </Field>
                  </NestedCard>
                ))}
              </SubSection>
            </NestedCard>
          ))}
        </SubSection>
      </SectionCard>
    </SettingsPage>
  );
}
