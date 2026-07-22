'use client';
import { useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.tirbeo.app';

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    fetch(`${API}/api/public/theme`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.colors) return;
        const root = document.documentElement;
        for (const [key, val] of Object.entries(data.colors)) {
          if (key.startsWith('--') && typeof val === 'string') root.style.setProperty(key, val);
        }
      })
      .catch(() => {});
  }, []);

  return <>{children}</>;
}
