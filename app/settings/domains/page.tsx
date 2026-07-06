"use client";

import { useState } from "react";
import { appDomain, appUrl } from "@tirbeo/utils";

type SubdomainEntry = {
  key: string;
  label: string;
  url: string;
  description: string;
};

const SUBDOMAINS: SubdomainEntry[] = [
  { key: "www", label: "Main Site", url: appDomain("www"), description: "Company landing page" },
  { key: "accounts", label: "Accounts", url: appDomain("accounts"), description: "SSO login hub" },
  { key: "dashboard", label: "Dashboard", url: appDomain("dashboard"), description: "User account management" },
  { key: "chat", label: "Chat", url: appDomain("chat"), description: "Direct messaging" },
  { key: "admin", label: "Admin", url: appDomain("admin"), description: "Staff admin panel" },
  { key: "support", label: "Support", url: appDomain("support"), description: "Help and contact" },
];

export default function DomainSettingsPage() {
  const [mainDomain, setMainDomain] = useState(appDomain("www"));
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="font-heading text-2xl font-bold text-tirbeo-dark-950">
        Domain Settings
      </h1>
      <p className="mt-2 text-sm text-tirbeo-dark-500">
        Configure your main domain and subdomain routing. Changes here affect all
        redirects across the platform.
      </p>

      <section className="mt-8 rounded-xl border border-tirbeo-dark-200 bg-white p-6">
        <h2 className="font-heading text-lg font-semibold">Main Domain</h2>
        <p className="mt-1 text-sm text-tirbeo-dark-500">
          Set this in <code className="rounded bg-tirbeo-dark-100 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_APP_DOMAIN</code> environment variable.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <input
            type="text"
            value={mainDomain}
            onChange={(e) => setMainDomain(e.target.value)}
            className="flex-1 rounded-md border border-tirbeo-dark-300 bg-white px-3 py-2 text-sm outline-none focus:border-tirbeo-crimson-400"
            placeholder="tirbeo.app"
          />
          <button
            onClick={handleSave}
            className="rounded-md bg-tirbeo-crimson-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-tirbeo-crimson-700"
          >
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-heading text-lg font-semibold">Subdomain Routing</h2>
        <p className="mt-1 text-sm text-tirbeo-dark-500">
          All subdomains derive from your main domain. Update the environment
          variable to change all URLs at once.
        </p>

        <div className="mt-4 space-y-3">
          {SUBDOMAINS.map((sd) => (
            <div
              key={sd.key}
              className="flex items-center justify-between rounded-lg border border-tirbeo-dark-200 bg-white p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-tirbeo-crimson-50 text-xs font-bold text-tirbeo-crimson-600">
                  {sd.label.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-tirbeo-dark-950">{sd.label}</p>
                  <p className="text-xs text-tirbeo-dark-400">{sd.description}</p>
                </div>
              </div>
              <code className="rounded bg-tirbeo-dark-50 px-2 py-1 text-xs text-tirbeo-dark-600">
                {sd.url}
              </code>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-tirbeo-dark-200 bg-white p-6">
        <h2 className="font-heading text-lg font-semibold">DNS Configuration</h2>
        <p className="mt-2 text-sm text-tirbeo-dark-500">
          Point these CNAME records to your Vercel deployment:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-tirbeo-dark-950 p-4 text-xs text-green-400">
{`${mainDomain}       CNAME  cname.vercel-dns.com
www.${mainDomain}    CNAME  cname.vercel-dns.com
accounts.${mainDomain}  CNAME  cname.vercel-dns.com
dashboard.${mainDomain} CNAME  cname.vercel-dns.com
chat.${mainDomain}      CNAME  cname.vercel-dns.com
admin.${mainDomain}     CNAME  cname.vercel-dns.com
support.${mainDomain}   CNAME  cname.vercel-dns.com`}
        </pre>
      </section>
    </main>
  );
}
