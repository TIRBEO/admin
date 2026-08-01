'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '../../../../lib';
import { SettingsPage, SectionCard, Field, Input, Textarea, NestedCard, ItemRow, AddButton, SubSection, Toast, EmptyState } from '../../shared';
import { ArrowLeft } from 'lucide-react';

const appLabels: Record<string, string> = {
  accounts: 'accounts.tirbeo.app',
  dashboard: 'dashboard.tirbeo.app',
  forms: 'forms.tirbeo.app',
};

const FOOTER_COLUMNS_TEMPLATE = [
  { title: 'Product', links: [{ label: 'Features', href: '/features' }, { label: 'Pricing', href: '/pricing' }] },
  { title: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Blog', href: '/blog' }] },
];

const SOCIAL_LINKS_TEMPLATE = [
  { label: 'Twitter', icon: 'Twitter', href: 'https://twitter.com/tirbeo' },
  { label: 'GitHub', icon: 'Github', href: 'https://github.com/tirbeo' },
];

const LEGAL_TEMPLATE = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

export default function AppConfigPage() {
  const params = useParams();
  const app = params.app as string;
  const appLabel = appLabels[app] || `${app}.tirbeo.app`;

  const [cfg, setCfg] = useState<any>({
    brand: { name: 'Tirbeo', logo: '', logoHref: '/' },
    navbar: { links: [], signup: { label: 'Sign Up', href: 'https://accounts.tirbeo.app/signup' }, login: { label: 'Log In', href: 'https://accounts.tirbeo.app/login' } },
    footer: { tagline: '', columns: FOOTER_COLUMNS_TEMPLATE, connect: SOCIAL_LINKS_TEMPLATE, legal: LEGAL_TEMPLATE, rights: '' },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch(`/api/admin/site-config?app=${app}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.config) {
        const stored = data.config;
        setCfg({
          brand: { name: 'Tirbeo', logo: '', logoHref: '/', ...(stored.brand || {}) },
          navbar: { links: [], signup: { label: 'Sign Up', href: `https://accounts.tirbeo.app/signup` }, login: { label: 'Log In', href: `https://accounts.tirbeo.app/login` }, ...(stored.navbar || {}) },
          footer: { tagline: '', columns: FOOTER_COLUMNS_TEMPLATE, connect: SOCIAL_LINKS_TEMPLATE, legal: LEGAL_TEMPLATE, rights: '', ...(stored.footer || {}) },
        });
      }
    }
    setLoading(false);
  }, [app]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const res = await apiFetch(`/api/admin/site-config?app=${app}`, {
      method: 'PUT', body: JSON.stringify({ config: cfg }),
    });
    if (res.ok) setMsg({ type: 'success', text: 'Saved!' });
    else setMsg({ type: 'error', text: 'Failed to save' });
    setSaving(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const update = (section: string, patch: Record<string, any>) => {
    setCfg((prev: Record<string, any>) => ({ ...prev, [section]: { ...prev[section], ...patch } }));
  };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <SettingsPage title={`${appLabel} Config`} desc="Configure brand, navbar, and footer" onSave={save} saving={saving}>
      <Toast msg={msg} />

      <SectionCard title="Brand">
        <Field label="App Name">
          <Input value={cfg.brand.name} onChange={e => update('brand', { name: e.target.value })} />
        </Field>
        <Field label="Logo URL">
          <Input value={cfg.brand.logo} onChange={e => update('brand', { logo: e.target.value })} placeholder="https://..." />
        </Field>
        <Field label="Logo Link">
          <Input value={cfg.brand.logoHref} onChange={e => update('brand', { logoHref: e.target.value })} />
        </Field>
      </SectionCard>

      <SectionCard title="Navbar Links">
        <SubSection title="Nav Items" onAdd={() => {
          const links = [...cfg.navbar.links, { key: `link-${Date.now()}`, label: '', href: '' }];
          update('navbar', { links });
        }} addLabel="Add Link">
          {cfg.navbar.links.length === 0 && <EmptyState text="No navbar links" />}
          {cfg.navbar.links.map((link: any, i: number) => (
            <NestedCard key={link.key || i} onRemove={() => {
              const links = cfg.navbar.links.filter((_: any, idx: number) => idx !== i);
              update('navbar', { links });
            }}>
              <Field label="Label">
                <Input value={link.label} onChange={e => {
                  const links = [...cfg.navbar.links];
                  links[i] = { ...links[i], label: e.target.value };
                  update('navbar', { links });
                }} />
              </Field>
              <Field label="Href">
                <Input value={link.href} onChange={e => {
                  const links = [...cfg.navbar.links];
                  links[i] = { ...links[i], href: e.target.value };
                  update('navbar', { links });
                }} />
              </Field>
            </NestedCard>
          ))}
        </SubSection>
        <Field label="Sign Up Label">
          <Input value={cfg.navbar.signup.label} onChange={e => update('navbar', { signup: { ...cfg.navbar.signup, label: e.target.value } })} />
        </Field>
        <Field label="Sign Up Href">
          <Input value={cfg.navbar.signup.href} onChange={e => update('navbar', { signup: { ...cfg.navbar.signup, href: e.target.value } })} />
        </Field>
        <Field label="Log In Label">
          <Input value={cfg.navbar.login.label} onChange={e => update('navbar', { login: { ...cfg.navbar.login, label: e.target.value } })} />
        </Field>
        <Field label="Log In Href">
          <Input value={cfg.navbar.login.href} onChange={e => update('navbar', { login: { ...cfg.navbar.login, href: e.target.value } })} />
        </Field>
      </SectionCard>

      <SectionCard title="Footer">
        <Field label="Tagline">
          <Input value={cfg.footer.tagline} onChange={e => update('footer', { tagline: e.target.value })} />
        </Field>
        <Field label="Copyright">
          <Input value={cfg.footer.rights} onChange={e => update('footer', { rights: e.target.value })} />
        </Field>

        <SubSection title="Link Columns" onAdd={() => {
          const columns = [...cfg.footer.columns, { title: '', links: [{ label: '', href: '' }] }];
          update('footer', { columns });
        }} addLabel="Add Column">
          {cfg.footer.columns.map((col: any, ci: number) => (
            <NestedCard key={ci} onRemove={() => {
              const columns = cfg.footer.columns.filter((_: any, idx: number) => idx !== ci);
              update('footer', { columns });
            }}>
              <Field label="Column Title">
                <Input value={col.title} onChange={e => {
                  const columns = [...cfg.footer.columns];
                  columns[ci] = { ...columns[ci], title: e.target.value };
                  update('footer', { columns });
                }} />
              </Field>
              <SubSection title="Links" onAdd={() => {
                const columns = [...cfg.footer.columns];
                columns[ci] = { ...columns[ci], links: [...columns[ci].links, { label: '', href: '' }] };
                update('footer', { columns });
              }} addLabel="Add Link">
                {col.links.map((link: any, li: number) => (
                  <NestedCard key={li} onRemove={() => {
                    const columns = [...cfg.footer.columns];
                    columns[ci] = { ...columns[ci], links: columns[ci].links.filter((_: any, idx: number) => idx !== li) };
                    update('footer', { columns });
                  }}>
                    <Field label="Label">
                      <Input value={link.label} onChange={e => {
                        const columns = [...cfg.footer.columns];
                        const links = [...columns[ci].links];
                        links[li] = { ...links[li], label: e.target.value };
                        columns[ci] = { ...columns[ci], links };
                        update('footer', { columns });
                      }} />
                    </Field>
                    <Field label="Href">
                      <Input value={link.href} onChange={e => {
                        const columns = [...cfg.footer.columns];
                        const links = [...columns[ci].links];
                        links[li] = { ...links[li], href: e.target.value };
                        columns[ci] = { ...columns[ci], links };
                        update('footer', { columns });
                      }} />
                    </Field>
                  </NestedCard>
                ))}
              </SubSection>
            </NestedCard>
          ))}
        </SubSection>

        <SubSection title="Social Links" onAdd={() => {
          const connect = [...cfg.footer.connect, { label: '', icon: 'Twitter', href: '' }];
          update('footer', { connect });
        }} addLabel="Add Social">
          {cfg.footer.connect.map((soc: any, si: number) => (
            <NestedCard key={si} onRemove={() => {
              const connect = cfg.footer.connect.filter((_: any, idx: number) => idx !== si);
              update('footer', { connect });
            }}>
              <Field label="Label">
                <Input value={soc.label} onChange={e => {
                  const connect = [...cfg.footer.connect];
                  connect[si] = { ...connect[si], label: e.target.value };
                  update('footer', { connect });
                }} />
              </Field>
              <Field label="Icon (Twitter/Send/Github)">
                <Input value={soc.icon} onChange={e => {
                  const connect = [...cfg.footer.connect];
                  connect[si] = { ...connect[si], icon: e.target.value };
                  update('footer', { connect });
                }} />
              </Field>
              <Field label="Href">
                <Input value={soc.href} onChange={e => {
                  const connect = [...cfg.footer.connect];
                  connect[si] = { ...connect[si], href: e.target.value };
                  update('footer', { connect });
                }} />
              </Field>
            </NestedCard>
          ))}
        </SubSection>

        <SubSection title="Legal Links" onAdd={() => {
          const legal = [...cfg.footer.legal, { label: '', href: '' }];
          update('footer', { legal });
        }} addLabel="Add Legal">
          {cfg.footer.legal.map((leg: any, li: number) => (
            <NestedCard key={li} onRemove={() => {
              const legal = cfg.footer.legal.filter((_: any, idx: number) => idx !== li);
              update('footer', { legal });
            }}>
              <Field label="Label">
                <Input value={leg.label} onChange={e => {
                  const legal = [...cfg.footer.legal];
                  legal[li] = { ...legal[li], label: e.target.value };
                  update('footer', { legal });
                }} />
              </Field>
              <Field label="Href">
                <Input value={leg.href} onChange={e => {
                  const legal = [...cfg.footer.legal];
                  legal[li] = { ...legal[li], href: e.target.value };
                  update('footer', { legal });
                }} />
              </Field>
            </NestedCard>
          ))}
        </SubSection>
      </SectionCard>
    </SettingsPage>
  );
}
