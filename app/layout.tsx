import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Tirbeo Admin', description: 'Tirbeo Administration' };

const themeScript = `
  (function() {
    try {
      var mode = localStorage.getItem('tirbeo-theme-mode') || 'dark';
      var isDark = mode === 'system'
        ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
        : mode === 'dark';
      var theme = isDark ? 'dark' : 'light';
      var root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(theme);
      root.setAttribute('data-theme', theme);
      if (mode === 'system' && window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
          var v = e.matches ? 'dark' : 'light';
          root.classList.remove('dark', 'light');
          root.classList.add(v);
          root.setAttribute('data-theme', v);
        });
      }
    } catch (e) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body style={{ margin: 0, padding: 0, background: 'var(--tb-bg)', color: 'var(--tb-text-primary)' }}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
