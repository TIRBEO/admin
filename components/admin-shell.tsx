"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { searchNav, titleFor, type NavItem } from "@/lib/nav";
import { ThemeToggle } from "@/components/theme-toggle";

/* ── Shell ──────────────────────────────────────────────────────
   Frosted glass header + a floating grouped rail on desktop, a sheet
   drawer on small screens, and a ⌘K palette. Every entry comes from
   lib/nav.ts — adding a page means adding one object there, not
   editing this file.                                             */

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
    <nav aria-label="Admin sections" className="flex flex-col gap-6 p-3">
      {groups.map((group) => (
        <div key={group.id}>
          <h2 className="px-3 pb-1.5 text-[13px] font-semibold tracking-[-0.01em] text-[var(--tb-text-muted)]">
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
                    className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[14px] tracking-[-0.01em] transition-colors ${
                      active
                        ? "bg-[var(--tb-accent-soft)] font-medium text-[var(--tb-accent)]"
                        : "text-[var(--tb-text-secondary)] hover:bg-[var(--tb-surface-2)] hover:text-[var(--tb-text-primary)]"
                    }`}
                  >
                    <Icon size={17} aria-hidden className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {groups.length === 0 ? (
        <p className="px-3 text-[13px] text-[var(--tb-text-muted)]">
          No section matches “{query}”.
        </p>
      ) : null}
    </nav>
  );

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--tb-surface-3)] focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      {/* Frosted top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--tb-border)] bg-[var(--tb-glass)] px-4 backdrop-blur-xl backdrop-saturate-150 sm:px-5">
        <button
          type="button"
          className="rounded-lg p-2 text-[var(--tb-text-secondary)] transition-colors hover:bg-[var(--tb-surface-2)] lg:hidden"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
        >
          <Menu size={18} aria-hidden />
        </button>

        <Link
          href="/admin"
          className="flex items-baseline gap-2 rounded-lg font-semibold tracking-[-0.03em]"
        >
          <span className="text-[17px]">
            Tirbeo<span className="text-[var(--tb-accent)]">.</span>
          </span>
          <span className="text-[13px] font-medium tracking-[-0.01em] text-[var(--tb-text-muted)]">
            Admin
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="ml-auto flex items-center gap-2 rounded-full border border-[var(--tb-border)] bg-[var(--tb-surface-1)]/60 px-3 py-1.5 text-[13px] text-[var(--tb-text-muted)] transition-colors hover:bg-[var(--tb-surface-2)] hover:text-[var(--tb-text-secondary)]"
        >
          <Search size={14} aria-hidden />
          <span className="hidden sm:inline">Search sections</span>
          <kbd className="hidden rounded-md border border-[var(--tb-border)] bg-[var(--tb-surface-2)] px-1.5 py-0.5 font-sans text-[10px] font-medium sm:inline">
            ⌘K
          </kbd>
        </button>

        <ThemeToggle />
      </header>

      <div className="flex">
        {/* Desktop rail — a floating grouped plate on the ground */}
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-[260px] shrink-0 overflow-y-auto border-r border-[var(--tb-border)] lg:block">
          {nav}
        </aside>

        {/* Mobile drawer */}
        {drawerOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-scrim"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-72 flex-col overflow-y-auto border-r border-[var(--tb-border)] bg-[var(--tb-bg)] shadow-[var(--tb-shadow-pop)]">
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--tb-border)] px-4">
                <span className="text-[17px] font-semibold tracking-[-0.03em]">
                  Tirbeo<span className="text-[var(--tb-accent)]">.</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation"
                  className="rounded-lg p-2 text-[var(--tb-text-muted)] hover:bg-[var(--tb-surface-2)]"
                >
                  <X size={17} aria-hidden />
                </button>
              </div>
              {nav}
            </div>
          </div>
        ) : null}

        <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
          {current ? (
            <header className="mb-7">
              <h1 className="text-[28px] font-bold leading-tight tracking-[-0.03em]">
                {current.label}
              </h1>
              <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-[var(--tb-text-muted)]">
                {current.description}
              </p>
            </header>
          ) : null}
          {children}
        </main>
      </div>

      {/* Command palette */}
      {paletteOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[14vh]">
          <button
            type="button"
            aria-label="Close search"
            className="absolute inset-0 bg-scrim backdrop-blur-sm"
            onClick={() => setPaletteOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search sections"
            className="relative w-full max-w-lg overflow-hidden rounded-[18px] border border-[var(--tb-border-strong)] bg-[var(--tb-glass)] shadow-[var(--tb-shadow-pop)] backdrop-blur-xl backdrop-saturate-150"
          >
            <div className="flex items-center gap-2.5 border-b border-[var(--tb-border)] px-4">
              <Search size={16} aria-hidden className="text-[var(--tb-text-muted)]" />
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
                className="w-full bg-transparent py-3.5 text-[15px] tracking-[-0.01em] outline-none placeholder:text-[var(--tb-text-muted)]"
              />
              <button
                type="button"
                onClick={() => setPaletteOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-[var(--tb-text-muted)] hover:bg-[var(--tb-surface-2)]"
              >
                <X size={15} aria-hidden />
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {groups.map((group) => (
                <div key={group.id} className="mb-1.5">
                  <h3 className="px-3 pb-1 pt-2 text-[12px] font-semibold tracking-[-0.01em] text-[var(--tb-text-muted)]">
                    {group.title}
                  </h3>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => router.push(item.href)}
                        className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-left transition-colors hover:bg-[var(--tb-surface-2)]"
                      >
                        <Icon size={16} aria-hidden className="shrink-0 text-[var(--tb-text-muted)]" />
                        <span className="text-[14px] font-medium tracking-[-0.01em] text-[var(--tb-text-primary)]">
                          {item.label}
                        </span>
                        <span className="ml-auto truncate pl-3 text-[12px] text-[var(--tb-text-muted)]">
                          {item.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
              {groups.length === 0 ? (
                <p className="px-3 py-8 text-center text-[13px] text-[var(--tb-text-muted)]">
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
