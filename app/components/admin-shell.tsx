'use client';

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  type ComponentType,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { apiFetch } from '../lib';
import {
  LayoutDashboard,
  Shield,
  Settings,
  Users,
  Search,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export interface AdminShellProps {
  children: ReactNode;
  navSections: NavSection[];
  brand?: {
    name: string;
  };
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
  onLogout?: () => void;
}

const SECTION_ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  Command: LayoutDashboard,
  Platform: Users,
  Content: LayoutDashboard,
  Experience: Settings,
  Access: Shield,
  Operations: Settings,
  Analytics: LayoutDashboard,
  Developer: Settings,
  Settings: Settings,
};

function initials(name?: string | null): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('tirbeo-theme-mode');
  if (stored === 'dark' || stored === 'light') return stored;
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark' || attr === 'light') return attr;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: 'dark' | 'light') {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(theme);
  root.setAttribute('data-theme', theme);
  try { localStorage.setItem('tirbeo-theme-mode', theme); } catch {}
}

export default function AdminShell({ children, navSections, brand, user, onLogout }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [notifItems, setNotifItems] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Notification polling
  const fetchNotifCount = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/notifications?count=true');
      if (res.ok) { const d = await res.json(); setNotifCount(d.count || 0); }
    } catch {}
  }, []);

  const fetchNotifItems = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await apiFetch('/api/admin/notifications?limit=10');
      if (res.ok) { const d = await res.json(); setNotifItems(d.items || []); }
    } catch {}
    setNotifLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifCount();
    const t = setInterval(fetchNotifCount, 30000);
    return () => clearInterval(t);
  }, [fetchNotifCount]);

  useEffect(() => {
    if (notifOpen) fetchNotifItems();
  }, [notifOpen, fetchNotifItems]);

  // Close notif panel on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = async () => {
    try {
      await apiFetch('/api/admin/notifications', { method: 'PUT' });
      setNotifCount(0);
      setNotifItems(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {};
  };

  const markNotifRead = async (id: string) => {
    try {
      await apiFetch(`/api/admin/notifications/${id}`, { method: 'PUT' });
      setNotifCount(prev => Math.max(0, prev - 1));
      setNotifItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {};
  };

  useEffect(() => {
    const theme = getTheme();
    applyTheme(theme);
    setIsDark(theme === 'dark');
  }, []);

  const handleToggleTheme = useCallback(() => {
    const next = isDark ? 'light' : 'dark';
    applyTheme(next);
    setIsDark(next === 'dark');
  }, [isDark]);

  const handleNav = useCallback((href: string) => {
    if (!href) return;
    if (href.startsWith('http://') || href.startsWith('https://')) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      router.push(href);
    }
    setMobileOpen(false);
    setSearchOpen(false);
    setUserMenuOpen(false);
  }, [router]);

  const isActive = useCallback((href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname === href || pathname.startsWith(`${href}/`);
  }, [pathname]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(p => !p);
        setUserMenuOpen(false);
        setMobileOpen(false);
      }
      if (e.key === 'Escape') { setSearchOpen(false); setMobileOpen(false); setUserMenuOpen(false); }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      const t = window.setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => { document.body.style.overflow = ''; document.body.style.position = ''; document.body.style.width = ''; };
  }, [mobileOpen]);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Touch swipe to close sidebar
  useEffect(() => {
    let startX = 0;
    const handleTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
    const handleTouchEnd = (e: TouchEvent) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (diff > 60 && mobileOpen) setMobileOpen(false);
    };
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => { document.removeEventListener('touchstart', handleTouchStart); document.removeEventListener('touchend', handleTouchEnd); };
  }, [mobileOpen]);

  const searchResults = searchQuery.trim()
    ? navSections.flatMap(s => s.items.filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase())).map(i => ({ ...i, section: s.label })))
    : [];

  const breadcrumbs = pathname.split('/').filter(Boolean).reduce<{ label: string; href?: string }[]>((acc, part, i, parts) => {
    if (part === 'admin') return acc;
    const path = '/admin/' + parts.slice(1, i + 1).join('/');
    const label = part.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    acc.push({ label, href: i === parts.length - 1 ? undefined : path });
    return acc;
  }, [{ label: 'Admin', href: '/admin' }]);

  return (
    <div className="dashboard-layout">
      {mobileOpen && <button type="button" className="dashboard-sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      <aside className={`dashboard-sidebar ${mobileOpen ? 'open' : ''}`} aria-label="Admin navigation">
        <div className="sidebar-brand">
          <button type="button" className="sidebar-brand-link" onClick={() => handleNav('/admin')}>
            <div className="sidebar-brand-mark">
              <Shield size={18} style={{ color: 'var(--tb-brand)' }} />
            </div>
            <span className="sidebar-brand-name">{brand?.name || 'Admin'}</span>
          </button>
          <div className="sidebar-brand-actions">
            <button type="button" className="header-control tb-mobile-theme-btn" onClick={handleToggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button type="button" className="tb-mobile-menu-btn header-control" onClick={() => setMobileOpen(false)}>
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navSections.map(section => (
            <div key={section.label} className="sidebar-section">
              <div className="sidebar-label">{section.label}</div>
              {section.items.map(item => {
                const active = isActive(item.href);
                const ItemIcon = item.icon || SECTION_ICONS[section.label] || Settings;
                return (
                  <button key={item.href} type="button" onClick={() => handleNav(item.href)}
                    className={`sidebar-item ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
                    <ItemIcon size={16} />
                    <span className="sidebar-item-text">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-row">
            <div className="sidebar-user-avatar">{initials(user?.name)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'Admin'}</div>
              <div className="sidebar-user-email">{user?.email || user?.role || ''}</div>
            </div>
            {onLogout && (
              <button type="button" onClick={onLogout} title="Sign out" className="header-control">
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <button type="button" className="tb-mobile-menu-btn header-control"
              onClick={() => setMobileOpen(p => !p)} aria-expanded={mobileOpen}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <nav aria-label="Breadcrumb" className="dashboard-breadcrumbs">
              {breadcrumbs.map((bc, i) => (
                <React.Fragment key={`${bc.label}-${i}`}>
                  {i > 0 && <ChevronRight size={12} className="breadcrumb-separator" />}
                  {bc.href ? (
                    <button type="button" onClick={() => bc.href && handleNav(bc.href)} className="breadcrumb-link">{bc.label}</button>
                  ) : (
                    <span className="breadcrumb-current">{bc.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="header-right-controls">
            <button type="button" className="header-control" onClick={() => setSearchOpen(true)} title="Search (⌘K)">
              <Search size={16} />
            </button>

            {/* Notification Bell */}
            <div ref={notifRef} className="relative">
              <button type="button" className="header-control" onClick={() => setNotifOpen(p => !p)} title="Notifications">
                <Bell size={16} />
                {notifCount > 0 && (
                  <span style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'var(--tb-red)', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                    {notifCount > 99 ? '99+' : notifCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="header-popover" style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, width: 340, maxHeight: 440, overflow: 'auto', zIndex: 60 }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--tb-border)' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tb-text-primary)' }}>Notifications</span>
                    {notifCount > 0 && (
                      <button className="btn btn-ghost btn-xs" onClick={markAllRead}><CheckCircle size={12} /> Mark all read</button>
                    )}
                  </div>
                  {notifLoading ? (
                    <div style={{ padding: 20, textAlign: 'center' }}><div className="skeleton" style={{ height: 40, marginBottom: 8 }} /><div className="skeleton" style={{ height: 40 }} /></div>
                  ) : notifItems.length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: 'var(--tb-text-muted)' }}>
                      <Bell size={20} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                      No notifications yet
                    </div>
                  ) : (
                    notifItems.map((n: any) => (
                      <div key={n.id} onClick={() => { if (!n.isRead) markNotifRead(n.id); if (n.link) router.push(n.link); setNotifOpen(false); }}
                        style={{ display: 'flex', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--tb-border)', cursor: 'pointer', background: n.isRead ? 'transparent' : 'var(--tb-surface-1)', transition: 'background 100ms' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: n.type === 'security' ? 'var(--tb-red-soft)' : n.type === 'system' ? 'var(--tb-blue-soft)' : 'var(--tb-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {n.type === 'security' ? <Shield size={13} style={{ color: 'var(--tb-red)' }} /> : n.type === 'system' ? <Info size={13} style={{ color: 'var(--tb-blue)' }} /> : <Bell size={13} style={{ color: 'var(--tb-text-muted)' }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: n.isRead ? 400 : 500, color: 'var(--tb-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                          {n.body && <div style={{ fontSize: 12, color: 'var(--tb-text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>}
                          <div style={{ fontSize: 11, color: 'var(--tb-text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} /> {notifTimeAgo(n.createdAt)}</div>
                        </div>
                        {!n.isRead && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--tb-brand)', flexShrink: 0, marginTop: 6 }} />}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <button type="button" className="header-control tb-theme-btn" onClick={handleToggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div ref={userMenuRef} className="relative">
              <button type="button" className="header-btn-link" onClick={() => setUserMenuOpen(p => !p)}>
                <div className="header-avatar">{initials(user?.name)}</div>
              </button>
              {userMenuOpen && (
                <div className="header-popover" role="menu">
                  <div className="user-menu-header">
                    <div className="sidebar-user-avatar large">{initials(user?.name)}</div>
                    <div className="user-menu-info">
                      <div className="user-menu-name">{user?.name || 'Admin'}</div>
                      <div className="user-menu-email">{user?.email || ''}</div>
                      {user?.role && <div className="user-menu-role">{user.role}</div>}
                    </div>
                  </div>
                  <div className="user-menu-body">
                    <button type="button" role="menuitem" className="menu-item" onClick={() => handleNav('/admin')}>
                      <LayoutDashboard size={15} /><span>Dashboard</span>
                    </button>
                    {onLogout && (<>
                      <div className="menu-divider" />
                      <button type="button" role="menuitem" className="menu-item danger" onClick={onLogout}>
                        <LogOut size={15} /><span>Sign out</span>
                      </button>
                    </>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="dashboard-content">{children}</main>
      </div>

      {searchOpen && (
        <div className="tb-search-overlay" role="dialog" aria-modal="true" onClick={() => setSearchOpen(false)}>
          <div className="tb-search-panel" onClick={e => e.stopPropagation()}>
            <div className="tb-search-input-row">
              <Search size={16} />
              <input ref={searchInputRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search pages..." aria-label="Search pages" />
              <button type="button" className="tb-search-kbd" onClick={() => setSearchOpen(false)}>ESC</button>
            </div>
            <div className="tb-search-body">
              {searchResults.length === 0 ? (
                <div className="tb-search-empty">{searchQuery ? 'No results found' : 'Type to search pages...'}</div>
              ) : (
                <div className="tb-search-group-wrap">
                  <div className="tb-search-group">Pages</div>
                  {searchResults.map(r => {
                    const ResultIcon = r.icon || SECTION_ICONS[r.section] || Settings;
                    return (
                      <button key={`${r.section}-${r.href}`} type="button" className="tb-search-item" onClick={() => handleNav(r.href)}>
                        <ResultIcon size={16} />
                        <div className="tb-search-item-body">
                          <span className="tb-search-item-title">{r.label}</span>
                          <span className="tb-search-item-sub">{r.section}</span>
                        </div>
                        <ChevronRight size={14} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="tb-search-footer"><span>↑↓ Navigate</span><span>↵ Open</span><span>ESC Close</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

function notifTimeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
