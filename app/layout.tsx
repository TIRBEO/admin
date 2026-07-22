import React from 'react';
import './globals.css';
import QuickSearch from './quick-search';
import { AdminThemeProvider } from './admin-theme-provider';
import AdminBackgroundShell from './background-shell';

export const metadata = { title: 'Tirbeo Admin', description: 'Manage the Tirbeo platform' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('tirbeo-theme');if(!t){t='light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})()`,
        }} />
      </head>
      <body>
        <AdminThemeProvider>
          <AdminBackgroundShell>
            {children}
            <QuickSearch />
          </AdminBackgroundShell>
        </AdminThemeProvider>
      </body>
    </html>
  );
}
