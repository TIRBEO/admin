'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib';
import { SettingsPage, SectionCard, Field, Input, Textarea, NestedCard, AddButton, SubSection, Toast, EmptyState, FAQ_TEMPLATE } from '../../shared';

const APP = 'landing';
const SECTION = 'faq';

interface FaqItem { question: string; answer: string; }

const DEFAULTS = {
  heading: 'Frequently Asked Questions',
  subheading: 'Everything you need to know about Tirbeo.',
  items: JSON.parse(JSON.stringify(FAQ_TEMPLATE)) as FaqItem[],
};

export default function FaqPage() {
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
      setCfg({ ...DEFAULTS, ...stored, items: stored.items || DEFAULTS.items });
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

  const addItem = () => {
    setCfg(prev => ({ ...prev, items: [...prev.items, { question: '', answer: '' }] }));
  };

  const removeItem = (i: number) => {
    setCfg(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));
  };

  const updateItem = (i: number, field: keyof FaqItem, val: string) => {
    setCfg(prev => {
      const items = [...prev.items];
      items[i] = { ...items[i], [field]: val };
      return { ...prev, items };
    });
  };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <SettingsPage title="FAQ" desc="Configure the FAQ section of the landing page" onSave={save} saving={saving}>
      <Toast msg={msg} />
      <SectionCard title="Header">
        <Field label="Heading">
          <Input value={cfg.heading} onChange={e => update({ heading: e.target.value })} />
        </Field>
        <Field label="Subheading">
          <Input value={cfg.subheading} onChange={e => update({ subheading: e.target.value })} />
        </Field>
      </SectionCard>
      <SectionCard title="Questions & Answers">
        <SubSection title="FAQ Items" onAdd={addItem} addLabel="Add Q&A">
          {cfg.items.length === 0 && <EmptyState text="No FAQ items yet" />}
          {cfg.items.map((item, i) => (
            <NestedCard key={i} onRemove={() => removeItem(i)}>
              <Field label="Question">
                <Input value={item.question} onChange={e => updateItem(i, 'question', e.target.value)} placeholder="What is Tirbeo?" />
              </Field>
              <Field label="Answer">
                <Textarea value={item.answer} onChange={e => updateItem(i, 'answer', e.target.value)} placeholder="Tirbeo is..." />
              </Field>
            </NestedCard>
          ))}
        </SubSection>
      </SectionCard>
    </SettingsPage>
  );
}
