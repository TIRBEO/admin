"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { searchNav, titleFor, type NavItem } from "@/lib/nav";

/* ── Shell ──────────────────────────────────────────────────────
   Sidebar on desktop, drawer on small screens, and a ⌘K palette.
   Every entry comes from lib/nav.ts — adding a page means adding one
   object there, not editing this file.                           */

function isActive(item: NavItem, pathname: string): boolean {
  if (item.href === "/admin") return pathname === "/admin";
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");

  const current = titleFor(pathname);
  const groups = useMemo(() => searchNav(query), [query]);

  // Route change closes whatever overlay was open — otherwise a jump
  // from the palette leaves it covering the page you landed on.
  useEffect(() => {
    setDrawerOpen(false);
    setPaletteOpen(false);
    setQuery("");
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        setDrawerOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const nav = (
    <nav aria-label="Admin sections" className="flex flex-col gap-6 p-4">
      {groups.map((group) => (
        <div key={group.id}>
          <h2 className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tb-text-muted)]">
            {group.title}
          </h2>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(item, pathname);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                      active
                        ? "bg-[var(--tb-accent-soft)] font-medium text-[var(--tb-accent)]"
                        : "text-[var(--tb-text-secondary)] hover:bg-[var(--tb-surface-2)] hover:text-[var(--tb-text-primary)]"
                    }`}
                  >
                    <Icon size={16} aria-hidden className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {groups.length === 0 ? (
        <p className="px-2 text-[13px] text-[var(--tb-text-muted)]">
          No section matches “{query}”.
        </p>
      ) : null}
    </nav>
  );

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-[var(--tb-surface-3)] focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--tb-border)] bg-[var(--tb-bg)]/85 px-4 backdrop-blur-xl">
        <button
          type="button"
          className="rounded-lg px-2 py-1.5 text-[var(--tb-text-secondary)] hover:bg-[var(--tb-surface-2)] lg:hidden"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
        >
          ☰
        </button>

        <Link href="/admin" className="font-black tracking-[-0.03em]">
          Tirbeo
          <span className="text-[var(--tb-accent)]">.</span>
          <span className="ml-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--tb-text-muted)]">
            Admin
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="ml-auto flex items-center gap-2 rounded-lg border border-[var(--tb-border)] px-2.5 py-1.5 text-[13px] text-[var(--tb-text-muted)] hover:bg-[var(--tb-surface-2)]"
        >
          <Search size={14} aria-hidden />
          <span className="hidden sm:inline">Search sections</span>
          <kbd className="hidden rounded border border-[var(--tb-border)] px-1 text-[10px] sm:inline">
            ⌘K
          </kbd>
        </button>
      </header>

      <div className="flex">
        {/* Desktop rail */}
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-[var(--tb-border)] lg:block">
          {nav}
        </aside>

        {/* Mobile drawer */}
        {drawerOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-black/60"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto border-r border-[var(--tb-border)] bg-[var(--tb-bg)]">
              {nav}
            </div>
          </div>
        ) : null}

        <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          {current ? (
            <header className="mb-6">
              <h1 className="text-[22px] font-semibold tracking-[-0.02em]">
                {current.label}
              </h1>
              <p className="mt-0.5 text-[13px] text-[var(--tb-text-muted)]">
                {current.description}
              </p>
            </header>
          ) : null}
          {children}
        </main>
      </div>

      {/* Command palette */}
      {paletteOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
          <button
            type="button"
            aria-label="Close search"
            className="absolute inset-0 bg-black/60"
            onClick={() => setPaletteOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search sections"
            className="relative w-full max-w-lg overflow-hidden rounded-xl border border-[var(--tb-border-strong)] bg-[var(--tb-bg)] shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-[var(--tb-border)] px-3">
              <Search size={15} aria-hidden className="text-[var(--tb-text-muted)]" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const first = searchNav(query)[0]?.items[0];
                    if (first) router.push(first.href);
                  }
                }}
                placeholder="Jump to a section…"
                aria-label="Search sections"
                className="w-full bg-transparent py-3 text-[14px] outline-none placeholder:text-[var(--tb-text-muted)]"
              />
              <button
                type="button"
                onClick={() => setPaletteOpen(false)}
                aria-label="Close"
                className="rounded p-1 text-[var(--tb-text-muted)] hover:bg-[var(--tb-surface-2)]"
              >
                <X size={15} aria-hidden />
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {groups.map((group) => (
                <div key={group.id} className="mb-2">
                  <h3 className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--tb-text-muted)]">
                    {group.title}
                  </h3>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => router.push(item.href)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] text-[var(--tb-text-secondary)] hover:bg-[var(--tb-surface-2)] hover:text-[var(--tb-text-primary)]"
                      >
                        <Icon size={15} aria-hidden />
                        <span className="font-medium text-[var(--tb-text-primary)]">
                          {item.label}
                        </span>
                        <span className="ml-auto truncate text-[12px] text-[var(--tb-text-muted)]">
                          {item.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
              {groups.length === 0 ? (
                <p className="px-2 py-6 text-center text-[13px] text-[var(--tb-text-muted)]">
                  Nothing matches “{query}”.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}