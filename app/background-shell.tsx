'use client';

import { useEffect, useState, type ReactNode } from 'react';
import DotField from './components/DotField';

const STORAGE_KEY = 'tirbeo-admin-background';
type BackgroundMode = 'oceanic' | 'classic';

export default function AdminBackgroundShell({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<BackgroundMode>('oceanic');

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'classic' || saved === 'oceanic') {
      setMode(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-background-mode', mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  return (
    <div className={`admin-shell ${mode === 'oceanic' ? 'admin-shell--oceanic' : 'admin-shell--classic'}`} data-background-mode={mode}>
      <div className="admin-ambient" aria-hidden="true">
        {mode === 'oceanic' ? (
          <DotField
            dotRadius={1.2}
            dotSpacing={15}
            bulgeStrength={16}
            cursorRadius={220}
            glowRadius={220}
            gradientFrom="rgba(234, 247, 251, 0.82)"
            gradientTo="rgba(18, 58, 107, 0.16)"
          />
        ) : null}
      </div>
      <div className="admin-shell__content">{children}</div>
      <button
        type="button"
        className="background-mode-toggle"
        onClick={() => setMode(mode === 'oceanic' ? 'classic' : 'oceanic')}
        title={mode === 'oceanic' ? 'Switch to classic background' : 'Switch to oceanic shimmer'}
      >
        {mode === 'oceanic' ? 'Oceanic' : 'Classic'}
      </button>
    </div>
  );
}
