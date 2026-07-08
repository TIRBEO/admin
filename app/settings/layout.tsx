import React from 'react';
import SidebarWrapper from './sidebar-wrapper';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-layout">
      <SidebarWrapper />
      <div className="main">{children}</div>
    </div>
  );
}
