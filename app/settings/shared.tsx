'use client';
import React from 'react';

/* ─── Reusable Settings Components ─── */

export function SettingsPage({ title, desc, children, onSave, saving }: {
  title: string; desc: string; children: React.ReactNode;
  onSave?: () => void; saving?: boolean;
}) {
  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <div>
          <h2>{title}</h2>
          <p className="desc">{desc}</p>
        </div>
        {onSave && (
          <button className="btn btn-primary" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export function SectionCard({ title, desc, children }: {
  title: string; desc?: string; children: React.ReactNode;
}) {
  return (
    <div className="section-card">
      <div className="section-card-inner">
        <div className="section-card-title">
          <h3>{title}</h3>
          {desc && <p className="desc">{desc}</p>}
        </div>
        <div className="section-card-body">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, desc, children, horizontal }: {
  label: string; desc?: string; children: React.ReactNode; horizontal?: boolean;
}) {
  return (
    <div className={`field ${horizontal ? 'field-horizontal' : ''}`}>
      <div className="field-label">
        <span>{label}</span>
        {desc && <span className="desc">{desc}</span>}
      </div>
      {children}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input ${props.className || ''}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`textarea ${props.className || ''}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`select ${props.className || ''}`} />;
}

export function Toggle({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label?: string;
}) {
  return (
    <label className="toggle-wrap">
      {label && <span className="toggle-label">{label}</span>}
      <button type="button" className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)} role="switch" aria-checked={checked}>
        <span className="toggle-knob" />
      </button>
    </label>
  );
}

export function ColorInput({ value, onChange }: {
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="color-input-group">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="color-swatch" />
      <Input value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

export function NestedCard({ children, onRemove }: {
  children: React.ReactNode; onRemove?: () => void;
}) {
  return (
    <div className="nested-card">
      {children}
      {onRemove && (
        <button className="btn btn-icon btn-danger" onClick={onRemove} title="Remove">×</button>
      )}
    </div>
  );
}

export function ItemRow({ children }: { children: React.ReactNode }) {
  return <div className="item-row">{children}</div>;
}

export function FormActions({ children }: { children: React.ReactNode }) {
  return <div className="form-actions">{children}</div>;
}

export function AddButton({ onClick, label }: { onClick: () => void; label?: string }) {
  return (
    <button className="btn btn-outline btn-sm" onClick={onClick}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      {label || 'Add'}
    </button>
  );
}

export function Toast({ msg, onClose }: {
  msg: { type: 'success' | 'error'; text: string } | null; onClose?: () => void;
}) {
  if (!msg) return null;
  return (
    <div className={`toast toast-${msg.type}`}>
      <span>{msg.text}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}

export function EmptyState({ text }: { text?: string }) {
  return <div className="empty-state">{text || 'Nothing yet.'}</div>;
}

export function SubSection({ title, children, onAdd, addLabel }: {
  title: string; children: React.ReactNode; onAdd?: () => void; addLabel?: string;
}) {
  return (
    <div className="sub-section">
      <div className="sub-section-header">
        <h4>{title}</h4>
        {onAdd && <AddButton onClick={onAdd} label={addLabel} />}
      </div>
      {children}
    </div>
  );
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
