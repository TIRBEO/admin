'use client';

import { useState } from 'react';
import Sidebar from '../../sidebar';

const SUBDOMAINS = [
  { key: 'www', label: 'Main Site', description: 'Company landing page' },
  { key: 'accounts', label: 'Accounts', description: 'SSO login hub' },
  { key: 'dashboard', label: 'Dashboard', description: 'User account management' },
  { key: 'chat', label: 'Chat', description: 'Direct messaging' },
  { key: 'admin', label: 'Admin', description: 'Staff admin panel' },
  { key: 'support', label: 'Support', description: 'Help and contact' },
];

export default function DomainSettingsPage() {
  const [mainDomain] = useState('tirbeo.app');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(dnsConfig(mainDomain));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="main" style={{ maxWidth: '900px', width: '100%' }}>
        <h2>Domain Settings</h2>
        <p className="desc">
          Manage your domain and subdomain routing. Apply changes via the <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>NEXT_PUBLIC_APP_DOMAIN</code> env variable.
        </p>

        <div className="card">
          <h3>Subdomain Routing</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>
            All subdomains derive from your main domain.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SUBDOMAINS.map((sd) => (
              <div
                key={sd.key}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff',
                    background: 'linear-gradient(135deg, #4f7aff, #3b5de7)',
                  }}>
                    {sd.label.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{sd.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sd.description}</div>
                  </div>
                </div>
                <code style={{ fontSize: 11, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: 6 }}>
                  {sd.key}.{mainDomain}
                </code>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex-between">
            <div>
              <h3 style={{ marginBottom: 4 }}>DNS Configuration</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Point these CNAME records to your Vercel deployment.</p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy All'}
            </button>
          </div>
          <pre style={{
            marginTop: 16, padding: 16, borderRadius: 12, overflowX: 'auto',
            background: 'rgba(0,0,0,0.4)', fontSize: 12, color: '#34d399',
            lineHeight: 1.6, fontFamily: 'monospace',
          }}>
            {dnsConfig(mainDomain)}
          </pre>
        </div>
      </main>
    </div>
  );
}

function dnsConfig(domain: string) {
  return `*.${domain}        CNAME  cname.vercel-dns.com
${domain}         CNAME  cname.vercel-dns.com
www.${domain}     CNAME  cname.vercel-dns.com
accounts.${domain}  CNAME  cname.vercel-dns.com
dashboard.${domain} CNAME  cname.vercel-dns.com
chat.${domain}      CNAME  cname.vercel-dns.com
admin.${domain}     CNAME  cname.vercel-dns.com
support.${domain}   CNAME  cname.vercel-dns.com`;
}
