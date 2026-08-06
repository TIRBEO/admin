'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib';
import { Card, Input, Textarea, Select, Switch, Button, Toast, EmptyState, Toggle as TogglePrimitive } from '@tirbeo/ui';
import { PlusIcon, X } from '@tirbeo/icons';

export { Toast, EmptyState, Input, Select, Textarea };

export function Toggle({ checked, onChange, label, ...props }: { checked: boolean; onChange: (v: boolean) => void; label?: string; [key: string]: unknown }) {
  return <TogglePrimitive pressed={checked} onChange={onChange} {...props} />;
}

export function SettingsPage({ title, desc, onSave, saving, children }: { title: string; desc?: string; onSave?: () => void; saving?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-admin-text)]">{title}</h1>
          {desc && <p className="text-sm text-[var(--color-admin-text-secondary)] mt-1">{desc}</p>}
        </div>
        <button onClick={onSave} disabled={saving} className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      {children}
    </div>
  );
}

export function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6">
      {title && <h3 className="text-sm font-semibold text-[var(--color-admin-text-secondary)] uppercase tracking-wider mb-4">{title}</h3>}
      {desc && <p className="text-sm text-[var(--color-admin-text-muted)] mb-4">{desc}</p>}
      {children}
    </div>
  );
}

export function Field({ label, desc, horizontal, children }: { label: string; desc?: string; horizontal?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex ${horizontal ? 'items-center' : 'flex-col'} gap-2 ${horizontal ? '' : 'mb-3'}`}>
      <label className={`text-sm font-medium text-[var(--color-admin-text-muted)] ${horizontal ? 'w-40 flex-shrink-0' : ''}`}>{label}</label>
      <div className="flex-1">
        {children}
        {desc && <p className="text-xs text-[var(--color-admin-text-muted)] mt-1">{desc}</p>}
      </div>
    </div>
  );
}

export function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-10 h-10 rounded border-2 border-[var(--color-admin-border)] cursor-pointer" />;
}

export function NestedCard({ title, onRemove, children }: { title?: string; onRemove?: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface-hover)] p-4 relative">
      {onRemove && (
        <button onClick={onRemove} className="absolute top-2 right-2 text-[var(--color-admin-text-muted)] hover:text-[var(--color-error)]">
          <X className="w-4 h-4" />
        </button>
      )}
      {title && <h4 className="text-sm font-medium text-[var(--color-admin-text)] mb-3">{title}</h4>}
      {children}
    </div>
  );
}

export function ItemRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex items-center gap-3 py-2 ${className ?? ''}`}>{children}</div>;
}

export function AddButton({ onClick, label }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[var(--color-admin-border)] text-sm text-[var(--color-admin-text-secondary)] hover:bg-[var(--color-admin-surface-hover)] transition-colors">
      <PlusIcon className="w-4 h-4" /> {label ?? 'Add'}
    </button>
  );
}

export function SubSection({ title, onAdd, addLabel, children }: { title: string; onAdd?: () => void; addLabel?: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-[var(--color-admin-text)]">{title}</h4>
        {onAdd && (
          <button onClick={onAdd} className="text-xs text-[var(--color-admin-accent)] hover:underline">
            + {addLabel || 'Add'}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export function useSiteConfig<T extends Record<string, any>>(
  app: string,
  section: string | undefined,
  defaults: T,
): {
  cfg: T;
  setCfg: React.Dispatch<React.SetStateAction<T>>;
  loading: boolean;
  saving: boolean;
  msg: { type: 'success' | 'error'; text: string } | null;
  setMsg: React.Dispatch<React.SetStateAction<{ type: 'success' | 'error'; text: string } | null>>;
  save: () => Promise<void>;
  update: (patch: Partial<T>) => void;
  load: () => Promise<void>;
} {
  const [cfg, setCfg] = useState<T>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch('/api/admin/site-config?app=' + app);
    if (res.ok) {
      const data = await res.json();
      let stored: any;
      if (section) {
        stored = data?.config?.[section] || {};
      } else {
        stored = data?.config || {};
      }
      setCfg({ ...defaults, ...stored });
    }
    setLoading(false);
  }, [app, section]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const full = await apiFetch('/api/admin/site-config?app=' + app).then(
      (r) => (r.ok ? r.json() : { config: {} }),
    );
    let merged: any;
    if (section) {
      merged = { ...(full.config || {}), [section]: cfg };
    } else {
      merged = { ...(full.config || {}), ...cfg };
    }
    const res = await apiFetch('/api/admin/site-config?app=' + app, {
      method: 'PUT',
      body: JSON.stringify({ config: merged }),
    });
    if (res.ok) setMsg({ type: 'success', text: 'Saved!' });
    else setMsg({ type: 'error', text: 'Failed to save' });
    setSaving(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const update = (patch: Partial<T>) => setCfg((prev) => ({ ...prev, ...patch }));

  return { cfg, setCfg, loading, saving, msg, setMsg, save, update, load };
}

export const DROPDOWNS_TEMPLATE = [
  { label: 'Products', items: [{ label: 'Tirbeo Chat', description: 'Real-time messaging', link: '/login' }] },
  { label: 'Solutions', items: [
    { label: 'For Developers', description: 'Open source collaboration', link: '/login' },
    { label: 'For Designers', description: 'Feedback rounds', link: '/login' },
    { label: 'For Educators', description: 'Student communities', link: '/login' },
    { label: 'For Startups', description: 'Async updates', link: '/login' },
  ]},
  { label: 'Resources', items: [
    { label: 'Documentation', description: 'Complete guides', link: '/login' },
    { label: 'Help Center', description: 'FAQs', link: '/login' },
    { label: 'Blog', description: 'Updates', link: '/login' },
    { label: 'Changelog', description: "What's new", link: '/login' },
  ]},
  { label: 'About', items: [
    { label: 'Our Story', description: 'The journey', link: '/login' },
    { label: 'Team', description: 'Meet the people', link: '/login' },
    { label: 'Careers', description: 'Join us', link: '/login' },
    { label: 'Contact', description: 'Get in touch', link: '/login' },
  ]},
];

export const FAQ_TEMPLATE = [
  { question: 'What is Tirbeo?', answer: 'Tirbeo is a community-first platform for meaningful conversations.' },
  { question: 'How do I join?', answer: 'Enter your email to get early access updates.' },
  { question: 'How is my data handled?', answer: 'Your data stays private. We never sell it to third parties.' },
];