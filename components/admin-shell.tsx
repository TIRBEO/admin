"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Unplug, X } from "lucide-react";

import { searchNav, titleFor } from "@/lib/nav";
import { ThemeToggle } from "@/components/theme-toggle";

/* Sticky header + grouped rail, in the iOS settings voice: the rail is a
   list of plates on the ground, the active row carries the accent, and the
   whole thing collapses into a drawer below md.

   Only this file and the theme toggle know the rail exists — a page is a
   page, and it does not have to wire itself into the navigation. */

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [drawer, setDrawer] = useState(false);
  const railSearch = useRef<HTMLInputElement>(null);

  const groups = useMemo(() => searchNav(query), [query]);
  const active = titleFor(pathname);

  /* A drawer that survives the navigation it caused strands the operator
     behind a scrim on the screen they asked for. */
  useEffect(() => setDrawer(false), [pathname]);

  useEffect(() => {
    document.addEventListener("keydown", onCmdK);
    return () => document.removeEventListener("keydown", onCmdK);
  }, []);

  /* On a phone ⌘K cannot focus a drawer that is not mounted yet, so it
     just opens it — the input inside claims focus with autoFocus. */
  function onCmdK(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (window.matchMedia("(min-width: 768px)").matches) {
        railSearch.current?.focus();
        railSearch.current?.select();
      } else setDrawer(true);
    }
  }

  const rail = (
    <nav aria-label="Sections" className="flex flex-col gap-6 px-3 py-4">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--muted)]">
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
                    className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13px] tracking-[-0.01em] transition-colors ${
                      current
                        ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent-text)]"
                        : "text-[var(--text-2)] hover:bg-[var(--hover)]"
                    }`}
                  >
                    <Icon
                      size={15}
                      aria-hidden
                      className={current ? "text-[var(--accent-text)]" : "text-[var(--muted)]"}
                    />
                    <span className="min-w-0 truncate">{item.label}</span>
                    {item.unwired ? (
                      <Unplug size={12} aria-hidden className="ml-auto shrink-0 text-[var(--muted)]" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {groups.length === 0 ? (
        <p className="px-3 text-[13px] text-[var(--muted)]">
          No section matches “{query}”.
        </p>
      ) : null}
    </nav>
  );

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-[var(--divider)] bg-[var(--glass)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Open sections"
            className="btn btn-quiet px-2 md:hidden"
          >
            <Menu size={16} aria-hidden />
          </button>

          <Link
            href="/admin"
            className="flex items-baseline gap-2 text-[15px] font-semibold tracking-[-0.02em] text-[var(--fg)]"
          >
            Tirbeo
            <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
              Admin
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <span className="hidden items-center gap-2 rounded-full bg-[var(--fill)] py-1 pl-1 pr-3 sm:flex">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--accent-solid)] text-[11px] font-semibold text-[var(--accent-fg)]">
                OP
              </span>
              Operator
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] gap-0 px-0 sm:px-6">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[264px] shrink-0 overflow-y-auto border-r border-[var(--divider)] bg-[var(--rail)] md:block">
          <div className="px-3 pt-4">
            <label className="flex items-center gap-2 rounded-full bg-[var(--field)] px-3 py-2">
              <Search size={14} aria-hidden className="text-[var(--muted)]" />
              <input
                ref={railSearch}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sections"
                aria-label="Search sections"
                className="w-full bg-transparent text-[13px] tracking-[-0.01em] text-[var(--fg)] outline-none placeholder:text-[var(--placeholder)]"
              />
              <kbd className="shrink-0 rounded-[5px] border border-[var(--border-strong)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted)]">
                ⌘K
              </kbd>
            </label>
          </div>
          {rail}
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto flex max-w-[1180px] flex-col gap-6">{children}</div>
        </main>
      </div>

      {drawer ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Sections">
          <button
            type="button"
            aria-label="Close sections"
            onClick={() => setDrawer(false)}
            className="absolute inset-0 bg-[var(--scrim)]"
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(320px,88vw)] flex-col overflow-y-auto bg-[var(--card)] shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between border-b border-[var(--divider)] px-4 py-3">
              <span className="text-[14px] font-semibold tracking-[-0.02em]">Sections</span>
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="Close sections"
                className="btn btn-quiet px-2"
              >
                <X size={16} aria-hidden />
              </button>
            </div>
            <div className="px-3 pt-3">
              <label className="flex items-center gap-2 rounded-full bg-[var(--field)] px-3 py-2">
                <Search size={14} aria-hidden className="text-[var(--muted)]" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search sections"
                  aria-label="Search sections"
                  className="w-full bg-transparent text-[13px] text-[var(--fg)] outline-none placeholder:text-[var(--placeholder)]"
                />
              </label>
            </div>
            {rail}
          </div>
        </div>
      ) : null}
    </div>
  );
}
