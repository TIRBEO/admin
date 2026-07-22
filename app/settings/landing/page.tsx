'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '../../sidebar';
import { apiFetch } from '../../lib';

const APP = 'landing';

interface LandingConfig {
  hero: HeroConfig;
  about: AboutConfig;
  features: FeaturesConfig;
  newsletter: NewsletterConfig;
  footer: FooterConfig;
}

interface HeroConfig {
  headline1: string;
  headline2: string;
  headline2Gradient: string;
  subtitle: string;
  cta1Text: string;
  cta1Url: string;
  cta2Text: string;
  cta2Url: string;
  bgImage: string;
  scrollText: string;
}

interface AboutConfig {
  headline: string;
  headlineGradient: string;
  paragraphs: string[];
  textColor: string;
}

interface FeaturesConfig {
  headline: string;
  subtitle: string;
  items: FeatureItem[];
}

interface FeatureItem {
  label: string;
  desc: string;
  color?: string;
}

interface NewsletterConfig {
  badge: string;
  headline: string;
  subtext: string;
  placeholder: string;
  buttonLabel: string;
  disclaimer: string;
  accentColor: string;
}

interface FooterConfig {
  tagline: string;
  copyright: string;
  showNewsletterForm: boolean;
}

type SectionKey = keyof LandingConfig;

const SECTIONS: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
  { key: 'hero', label: 'Hero', icon: <SparklesIcon /> },
  { key: 'about', label: 'About', icon: <InfoIcon /> },
  { key: 'features', label: 'Features', icon: <StarIcon /> },
  { key: 'newsletter', label: 'Newsletter', icon: <MailIcon /> },
  { key: 'footer', label: 'Footer', icon: <LayoutIcon /> },
];

function SparklesIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/></svg>; }
function InfoIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>; }
function StarIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function MailIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M22 7H2"/></svg>; }
function LayoutIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>; }

export default function LandingSettingsPage() {
  const [config, setConfig] = useState<LandingConfig | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SectionKey | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/admin/site-config?app=${APP}`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config || getDefaultConfig());
      } else {
        setConfig(getDefaultConfig());
      }
    } catch {
      setConfig(getDefaultConfig());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const saveSection = async (section: SectionKey) => {
    if (!config) return;
    setSaving(section);
    setMessage(null);
    try {
      const res = await apiFetch(`/api/admin/site-config?app=${APP}`, {
        method: 'PUT',
        body: JSON.stringify({ config }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `${section.charAt(0).toUpperCase() + section.slice(1)} saved successfully` });
      } else {
        setMessage({ type: 'error', text: 'Failed to save. Please try again.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(null);
    }
  };

  const updateField = (section: SectionKey, field: string, value: any) => {
    setConfig(prev => prev ? { ...prev, [section]: { ...prev[section], [field]: value } } : null);
  };

  const addParagraph = () => {
    setConfig(prev => prev && prev.about ? { ...prev, about: { ...prev.about, paragraphs: [...prev.about.paragraphs, ''] } } : null);
  };

  const removeParagraph = (index: number) => {
    setConfig(prev => prev && prev.about ? { ...prev, about: { ...prev.about, paragraphs: prev.about.paragraphs.filter((_, i) => i !== index) } } : null);
  };

  const addFeature = () => {
    setConfig(prev => prev ? { ...prev, features: { ...prev.features, items: [...prev.features.items, { label: '', desc: '', color: '#F97316' }] } } : null);
  };

  const removeFeature = (index: number) => {
    setConfig(prev => prev ? { ...prev, features: { ...prev.features, items: prev.features.items.filter((_, i) => i !== index) } } : null);
  };

  const updateFeature = (index: number, field: string, value: string) => {
    setConfig(prev => {
      if (!prev) return null;
      const items = [...prev.features.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, features: { ...prev.features, items } };
    });
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div className="loading" style={{ padding: 0 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }}>
              <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round"/>
            </svg>
            <span style={{ display: 'block', marginTop: 12, color: 'var(--text-secondary)' }}>Loading landing config…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="main">
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.4px', background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Landing Page Settings
            </h1>
            <span className="badge badge-gold">Content Management</span>
          </div>
          <p className="desc" style={{ margin: 0, fontSize: '13.5px' }}>
            Manage all landing page content. Changes are live immediately after saving.
          </p>
        </div>

        {message && (
          <div className={`toast toast-${message.type}`} style={{ marginBottom: 20 }}>
            {message.text}
            <button className="toast-close" onClick={() => setMessage(null)}>×</button>
          </div>
        )}

        <div className="card" style={{ overflow: 'hidden' }}>
          {/* Tabs */}
          <div className="tabs" style={{ borderBottom: '1px solid var(--border-default)' }}>
            {SECTIONS.map(s => (
              <button
                key={s.key}
                className={`tab ${activeSection === s.key ? 'active' : ''}`}
                onClick={() => setActiveSection(s.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>

          {/* Tab Panels */}
          <div className="tab-panel" style={{ padding: 24 }}>
{activeSection === 'hero' && <HeroEditor config={config!.hero} onChange={(field, value) => updateField('hero', field, value)} />}
{activeSection === 'about' && <AboutEditor config={config!.about} onChange={(field, value) => updateField('about', field, value)} onAddParagraph={addParagraph} onRemoveParagraph={removeParagraph} />}
{activeSection === 'features' && <FeaturesEditor config={config!.features} onChange={(field, value) => updateField('features', field, value)} onAdd={addFeature} onRemove={removeFeature} onUpdate={updateFeature} />}
{activeSection === 'newsletter' && <NewsletterEditor config={config!.newsletter} onChange={(field, value) => updateField('newsletter', field, value)} />}
{activeSection === 'footer' && <FooterEditor config={config!.footer} onChange={(field, value) => updateField('footer', field, value)} />}
          </div>

          {/* Save Bar */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end', gap: 12, background: 'var(--bg-surface)' }}>
            <button className="btn btn-outline" onClick={loadConfig} disabled={saving !== null}>Reset</button>
            <button
              className="btn btn-gold"
              onClick={() => saveSection(activeSection)}
              disabled={saving === activeSection}
            >
              {saving === activeSection ? 'Saving…' : `Save ${SECTIONS.find(s => s.key === activeSection)?.label} Changes`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getDefaultConfig(): LandingConfig {
  return {
    hero: { headline1: 'One platform.', headline2: 'Infinite possibilities.', headline2Gradient: '#fff,#F97316,#F25604', subtitle: 'Connect with people who inspire you.', cta1Text: 'Join the platform', cta1Url: '/login', cta2Text: 'Explore the platform', cta2Url: '#about', bgImage: '/bgpc.png', scrollText: 'Scroll to explore' },
    about: { headline: 'Built for meaningful connection', headlineGradient: '#F97316,#F25604', paragraphs: ['Tirbeo is built to make social networking feel personal again.'], textColor: '#F97316' },
    features: { headline: 'Built with purpose', subtitle: 'Every feature is designed to foster genuine connection.', items: [{ label: 'Real-time Chat', desc: 'Instant messaging with end-to-end encryption', color: '#F25604' }] },
    newsletter: { badge: 'Newsletter', headline: 'Never miss an update', subtext: 'Subscribe for launch announcements.', placeholder: 'Enter your email', buttonLabel: 'Subscribe', disclaimer: 'No spam. Unsubscribe anytime.', accentColor: '#F97316' },
    footer: { tagline: 'Connecting communities.', copyright: 'All rights reserved.', showNewsletterForm: true }
  };
}

/* ========================================
   SECTION EDITORS
   ======================================== */

function HeroEditor({ config, onChange }: { config: HeroConfig; onChange: (field: string, value: any) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800 }}>
      <div className="field">
        <label className="field-label">Headline Part 1</label>
        <input className="input" value={config.headline1} onChange={e => onChange('headline1', e.target.value)} placeholder="One platform." />
      </div>
      <div className="field">
        <label className="field-label">Headline Part 2 (Gradient)</label>
        <input className="input" value={config.headline2} onChange={e => onChange('headline2', e.target.value)} placeholder="Infinite possibilities." />
      </div>
      <div className="field">
        <label className="field-label">Headline 2 Gradient (CSS gradient)</label>
        <input className="input" value={config.headline2Gradient} onChange={e => onChange('headline2Gradient', e.target.value)} placeholder="#fff,#F97316,#F25604" />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Comma-separated colors for gradient text</p>
      </div>
      <div className="field">
        <label className="field-label">Subtitle</label>
        <textarea className="input textarea" value={config.subtitle} onChange={e => onChange('subtitle', e.target.value)} rows={3} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="field">
          <label className="field-label">Primary CTA Text</label>
          <input className="input" value={config.cta1Text} onChange={e => onChange('cta1Text', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">Primary CTA URL</label>
          <input className="input" value={config.cta1Url} onChange={e => onChange('cta1Url', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">Secondary CTA Text</label>
          <input className="input" value={config.cta2Text} onChange={e => onChange('cta2Text', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">Secondary CTA URL</label>
          <input className="input" value={config.cta2Url} onChange={e => onChange('cta2Url', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="field">
          <label className="field-label">Background Image</label>
          <input className="input" value={config.bgImage} onChange={e => onChange('bgImage', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">Scroll Text</label>
          <input className="input" value={config.scrollText} onChange={e => onChange('scrollText', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function AboutEditor({ config, onChange, onAddParagraph, onRemoveParagraph }: { config: AboutConfig; onChange: (field: string, value: any) => void; onAddParagraph: () => void; onRemoveParagraph: (i: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800 }}>
      <div className="field">
        <label className="field-label">Headline</label>
        <input className="input" value={config.headline} onChange={e => onChange('headline', e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label">Headline Gradient</label>
        <input className="input" value={config.headlineGradient} onChange={e => onChange('headlineGradient', e.target.value)} placeholder="#F97316,#F25604" />
      </div>
      <div className="field">
        <label className="field-label">Text Accent Color</label>
        <input className="input" value={config.textColor} onChange={e => onChange('textColor', e.target.value)} placeholder="#F97316" />
      </div>
      <div className="field">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label className="field-label" style={{ margin: 0 }}>Paragraphs</label>
          <button className="btn btn-sm btn-outline" onClick={onAddParagraph}>+ Add Paragraph</button>
        </div>
        {config.paragraphs.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <textarea className="input textarea" style={{ flex: 1 }} value={p} onChange={e => { const arr = [...config.paragraphs]; arr[i] = e.target.value; onChange('paragraphs', arr); }} rows={2} />
            <button className="btn btn-sm btn-danger" onClick={() => onRemoveParagraph(i)} style={{ alignSelf: 'flex-start' }}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturesEditor({ config, onChange, onAdd, onRemove, onUpdate }: { config: FeaturesConfig; onChange: (field: string, value: any) => void; onAdd: () => void; onRemove: (i: number) => void; onUpdate: (i: number, field: string, value: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>
      <div className="field">
        <label className="field-label">Section Headline</label>
        <input className="input" value={config.headline} onChange={e => onChange('headline', e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label">Section Subtitle</label>
        <textarea className="input textarea" value={config.subtitle} onChange={e => onChange('subtitle', e.target.value)} rows={2} />
      </div>
      <div className="field">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <label className="field-label" style={{ margin: 0 }}>Feature Cards</label>
          <button className="btn btn-sm btn-outline" onClick={onAdd}>+ Add Feature</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {config.items.map((item, i) => (
            <div key={i} className="glass-sm" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>Feature #{i + 1}</span>
                <button className="btn btn-sm btn-danger" onClick={() => onRemove(i)}>Remove</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 12 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label className="field-label">Label</label>
                  <input className="input" value={item.label} onChange={e => onUpdate(i, 'label', e.target.value)} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="field-label">Description</label>
                  <input className="input" value={item.desc} onChange={e => onUpdate(i, 'desc', e.target.value)} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="field-label">Accent Color</label>
                  <input className="input" type="color" value={item.color || '#F97316'} onChange={e => onUpdate(i, 'color', e.target.value)} style={{ height: 40, padding: 2 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NewsletterEditor({ config, onChange }: { config: NewsletterConfig; onChange: (field: string, value: any) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
      <div className="field">
        <label className="field-label">Badge Text</label>
        <input className="input" value={config.badge} onChange={e => onChange('badge', e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label">Headline</label>
        <input className="input" value={config.headline} onChange={e => onChange('headline', e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label">Subtext</label>
        <textarea className="input textarea" value={config.subtext} onChange={e => onChange('subtext', e.target.value)} rows={2} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="field">
          <label className="field-label">Placeholder</label>
          <input className="input" value={config.placeholder} onChange={e => onChange('placeholder', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">Button Label</label>
          <input className="input" value={config.buttonLabel} onChange={e => onChange('buttonLabel', e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label className="field-label">Disclaimer</label>
        <input className="input" value={config.disclaimer} onChange={e => onChange('disclaimer', e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label">Accent Color</label>
        <input className="input" type="color" value={config.accentColor} onChange={e => onChange('accentColor', e.target.value)} style={{ height: 40, padding: 2 }} />
      </div>
    </div>
  );
}

function FooterEditor({ config, onChange }: { config: FooterConfig; onChange: (field: string, value: any) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
      <div className="field">
        <label className="field-label">Tagline</label>
        <textarea className="input textarea" value={config.tagline} onChange={e => onChange('tagline', e.target.value)} rows={2} />
      </div>
      <div className="field">
        <label className="field-label">Copyright Text</label>
        <input className="input" value={config.copyright} onChange={e => onChange('copyright', e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={config.showNewsletterForm} onChange={e => onChange('showNewsletterForm', e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
          Show Newsletter Form in Footer
        </label>
      </div>
    </div>
  );
}