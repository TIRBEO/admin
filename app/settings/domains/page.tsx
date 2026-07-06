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
    <div className="flex min-h-screen bg-[#0a0a0b] text-white">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 lg:p-10">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-semibold tracking-tight">Domain Settings</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Manage your domain and subdomain routing. Apply changes via the{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_APP_DOMAIN</code>{' '}
            environment variable.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <h2 className="text-lg font-medium">Subdomain Routing</h2>
            <p className="mt-1 text-xs text-zinc-500">
              All subdomains derive from your main domain. Changing the env var updates all URLs at once.
            </p>
            <div className="mt-4 space-y-2">
              {SUBDOMAINS.map((sd) => (
                <div
                  key={sd.key}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-[10px] font-bold text-white shadow-sm">
                      {sd.label.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{sd.label}</p>
                      <p className="text-xs text-zinc-500">{sd.description}</p>
                    </div>
                  </div>
                  <code className="rounded-md bg-white/5 px-2 py-1 text-xs text-zinc-400">
                    {sd.key}.{mainDomain}
                  </code>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium">DNS Configuration</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Point these CNAME records to your Vercel deployment.
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10"
              >
                {copied ? 'Copied!' : 'Copy All'}
              </button>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-black/40 p-4 text-xs text-emerald-400">
              {dnsConfig(mainDomain)}
            </pre>
          </div>
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
