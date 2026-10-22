"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Command, Menu, Search, X } from "lucide-react";

import { searchNav, titleFor } from "@/lib/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [drawer, setDrawer] = useState(false);
  const railSearch = useRef<HTMLInputElement>(null);

  const groups = useMemo(() => searchNav(query), [query]);
  const active = titleFor(pathname);

  useEffect(() => setDrawer(false), [pathname]);

  useEffect(() => {
    document.addEventListener("keydown", onCmdK);
    return () => document.removeEventListener("keydown", onCmdK);
  }, []);

  function onCmdK(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (window.matchMedia("(min-width: 768px)").matches) {
        railSearch.current?.focus();
        railSearch.current?.select();
      } else {
        setDrawer(true);
      }
    }
  }

  const rail = (
    <nav aria-label="Sections" className="flex flex-col gap-6 px-3 pb-6 pt-2">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-4)]">
            {group.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const current = item.href === (active?.href ?? pathname);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={`group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] tracking-[-0.01em] transition-all duration-150 ${
                      current
                        ? "bg-[var(--accent-soft)] font-medium text-[var(--accent-text)] shadow-[inset_0_0_0_1px_rgba(10,132,255,0.25)]"
                        : "text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--fg)]"
                    }`}
                  >
                    <Icon
                      size={16}
                      aria-hidden
                      strokeWidth={current ? 2 : 1.8}
                      className={current ? "text-[var(--accent-text)]" : "text-[var(--text-4)] group-hover:text-[var(--fg)]"}
                    />
                    <span className="min-w-0 truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {groups.length === 0 ? (
        <p className="px-3 text-[13px] text-[var(--text-4)]">No section matches “{query}”.</p>
      ) : null}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      <header className="sticky top-0 z-40 border-b border-[var(--divider)] bg-[var(--glass)] backdrop-blur-2xl">
        <div className="mx-auto flex h-14 max-w-[1680px] items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Open navigation"
            className="btn btn-quiet px-2 md:hidden"
          >
            <Menu size={18} aria-hidden />
          </button>

          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#0a84ff] to-[#0060df] shadow-[0_1px_1px_rgba(255,255,255,0.12)_inset,0_4px_12px_-6px_rgba(10,132,255,0.9)]">
              <span className="text-[11px] font-bold text-white">T</span>
            </div>
            <div className="hidden sm:flex items-baseline gap-1.5">
              <span className="text-[14px] font-semibold tracking-[-0.02em] text-[var(--fg)]">Tirbeo</span>
              <span className="text-[12px] font-medium text-[var(--text-4)]">Admin</span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => {
              if (window.matchMedia("(min-width: 768px)").matches) {
                railSearch.current?.focus();
                railSearch.current?.select();
              } else {
                setDrawer(true);
              }
            }}
            className="ml-2 hidden items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[13px] text-[var(--text-4)] shadow-[inset_0_1px_0_rgba(255,255,255,0.01)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text-2)] md:flex"
          >
            <Search size={14} aria-hidden />
            <span className="w-48 text-left">Search...</span>
            <span className="ml-auto flex items-center gap-1 rounded-md border border-[var(--border-strong)] px-1.5 py-0.5 text-[10px] font-medium">
              <Command size={10} aria-hidden />K
            </span>
          </button>

          <div className="ml-auto flex items-center gap-1">
            <button type="button" className="btn btn-quiet px-2" aria-label="Notifications">
              <Bell size={16} aria-hidden />
            </button>
            <ThemeToggle />
            <Link
              href="/admin/account"
              className="ml-1 hidden items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 transition-colors hover:bg-[var(--hover)] sm:flex"
              title="Who this console is signed in as"
            >
              <div className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-[var(--accent)] to-[var(--accent-solid)] text-[10px] font-semibold text-white">
                OP
              </div>
              <span className="text-[13px] text-[var(--text-2)]">Operator</span>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1680px]">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[280px] shrink-0 border-r border-[var(--divider)] bg-[var(--rail)] md:block">
          <div className="px-3 pt-3">
            <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_rgba(10,132,255,0.12)]">
              <Search size={14} aria-hidden className="text-[var(--text-4)]" />
              <input
                ref={railSearch}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search navigation"
                aria-label="Search navigation"
                className="w-full bg-transparent text-[13px] text-[var(--fg)] outline-none placeholder:text-[var(--text-4)]"
              />
            </label>
          </div>
          <div className="mt-3 h-[calc(100%-4.25rem)] overflow-y-auto">{rail}</div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-6">{children}</div>
        </main>
      </div>

      {drawer ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" aria-label="Close navigation" onClick={() => setDrawer(false)} className="absolute inset-0 bg-[var(--scrim)]" />
          <div className="absolute inset-y-0 left-0 flex w-[min(320px,88vw)] flex-col overflow-y-auto bg-[var(--card)] shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between border-b border-[var(--divider)] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#0a84ff] to-[#0060df]">
                  <span className="text-[11px] font-bold text-white">T</span>
                </div>
                <span className="text-[14px] font-semibold tracking-[-0.02em]">Tirbeo Admin</span>
              </div>
              <button type="button" onClick={() => setDrawer(false)} aria-label="Close" className="btn btn-quiet px-2">
                <X size={16} aria-hidden />
              </button>
            </div>
            <div className="px-3 pt-3">
              <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5">
                <Search size={14} aria-hidden className="text-[var(--text-4)]" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search navigation"
                  aria-label="Search navigation"
                  className="w-full bg-transparent text-[13px] text-[var(--fg)] outline-none placeholder:text-[var(--text-4)]"
                />
              </label>
            </div>
            <div className="mt-3 flex-1">{rail}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
