"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Command, Menu, Search, X } from "lucide-react";

import { searchNav, titleFor, type Permissions } from "@/lib/nav";
import { CommandPalette } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";

export type Operator = {
  id: string;
  email: string;
  name: string | null;
  /** The role's display name, e.g. "Moderator" — not a rank to compare. */
  role: string;
  /** What that role is for, in the words the catalogue uses. It is the header's
      tooltip because an operator should be able to ask "why can I not see
      Staff?" without opening a screen to find out. */
  purpose: string;
  permissions: Permissions;
};

/* The frame, set like the mail the console sends: a wordmark in small caps
   rather than a logo, ink for what is said and grey for what is merely
   labelled, and one hairline under the header instead of a shadow.

   The bell that used to sit here did nothing, and the avatar said "Operator"
   for everyone who read it. A console that names a fake person in its own
   header cannot be trusted to name a real one in a table, so both are gone:
   the corner now shows who the API says is signed in, or nothing.

   The rail is drawn from the permission set the API returned, so a Support
   account never sees a row for Limits it would be refused at. */

export function AdminShell({
  children,
  operator,
}: {
  children: React.ReactNode;
  operator: Operator | null;
}) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);

  const permissions = operator?.permissions ?? null;
  const groups = useMemo(() => searchNav(query, permissions), [query, permissions]);
  const active = titleFor(pathname, permissions);

  useEffect(() => setDrawer(false), [pathname]);

  useEffect(() => {
    document.addEventListener("keydown", onCmdK);
    return () => document.removeEventListener("keydown", onCmdK);
  }, []);

  function onCmdK(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setPalette(true);
    }
  }

  const rail = (
    <nav aria-label="Sections" className="flex flex-col gap-7 px-2 pb-8 pt-1">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="px-2.5 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-4)]">
            {group.title}
          </p>
          <ul className="flex flex-col gap-px">
            {group.items.map((item) => {
              const current = item.href === (active?.href ?? pathname);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-[8px] px-2.5 py-[7px] text-[13px] leading-5 tracking-[-0.011em] transition-colors duration-100 ${
                      current
                        ? "bg-[var(--surface-2)] font-semibold text-[var(--fg)]"
                        : "text-[var(--text-3)] hover:bg-[var(--hover)] hover:text-[var(--fg)]"
                    }`}
                  >
                    <Icon
                      size={15}
                      aria-hidden
                      strokeWidth={current ? 2.1 : 1.7}
                      className={current ? "text-[var(--accent)]" : "text-[var(--text-4)]"}
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
        <p className="px-2.5 text-[13px] text-[var(--text-4)]">No section matches “{query}”.</p>
      ) : null}
    </nav>
  );

  const searchField = (mobile: boolean) => (
    <label className="flex items-center gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-1.5 focus-within:border-[var(--accent)] focus-within:bg-[var(--card)] focus-within:shadow-[0_0_0_3px_var(--accent-soft)]">
      <Search size={14} aria-hidden className="shrink-0 text-[var(--text-4)]" />
      <input
        autoFocus={mobile}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter sections"
        aria-label="Filter sections"
        className="w-full bg-transparent text-[13px] text-[var(--fg)] outline-none placeholder:text-[var(--placeholder)]"
      />
    </label>
  );

  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      <header className="sticky top-0 z-40 border-b border-[var(--divider)] bg-[var(--glass-2)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1680px] items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Open navigation"
            className="btn btn-quiet px-2 md:hidden"
          >
            <Menu size={18} aria-hidden />
          </button>

          <Link href="/admin" className="flex items-baseline gap-2">
            <span className="text-[12px] font-bold tracking-[0.22em] text-[var(--fg)]">TIRBEO</span>
            <span className="hidden text-[12px] font-medium tracking-[0.06em] text-[var(--text-4)] uppercase sm:inline">
              Console
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setPalette(true)}
            className="ml-1 hidden items-center gap-2 whitespace-nowrap rounded-[8px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-1.5 text-[13px] text-[var(--text-4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text-2)] md:flex"
          >
            <Search size={14} aria-hidden />
            <span className="w-36 text-left">Search the console</span>
            <span className="ml-auto flex items-center gap-1 rounded-[6px] border border-[var(--border-strong)] px-1.5 py-0.5 text-[10px] font-medium">
              <Command size={10} aria-hidden />K
            </span>
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPalette(true)}
              aria-label="Search"
              className="btn btn-quiet px-2 md:hidden"
            >
              <Search size={16} aria-hidden />
            </button>
            <ThemeToggle />
            {operator ? (
              <Link
                href="/admin/account"
                className="flex items-center gap-2 rounded-[8px] px-1.5 py-1 transition-colors hover:bg-[var(--hover)]"
                title={`${operator.email} — ${operator.role}. ${operator.purpose}`}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] text-[10px] font-bold tracking-[0.02em] text-[var(--text-2)]">
                  {initials(operator)}
                </span>
                <span className="hidden min-w-0 flex-col items-start leading-tight lg:flex">
                  <span className="max-w-[10rem] truncate text-[12px] font-semibold tracking-[-0.01em] text-[var(--fg)]">
                    {operator.name ?? operator.email}
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--text-4)]">
                    {operator.role}
                  </span>
                </span>
              </Link>
            ) : null}
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1680px]">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[260px] shrink-0 border-r border-[var(--divider)] bg-[var(--rail)] md:flex md:flex-col">
          <div className="px-2 pb-1 pt-4">{searchField(false)}</div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2">{rail}</div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 sm:py-8">
          <div className="mx-auto flex max-w-[1360px] flex-col gap-5">{children}</div>
        </main>
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} permissions={permissions} />

      {drawer ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawer(false)}
            className="absolute inset-0 bg-[var(--scrim)]"
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(320px,88vw)] flex-col overflow-y-auto border-r border-[var(--divider)] bg-[var(--card)] shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between border-b border-[var(--divider)] px-4 py-3">
              <span className="text-[12px] font-bold tracking-[0.22em] text-[var(--fg)]">TIRBEO</span>
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="Close"
                className="btn btn-quiet px-2"
              >
                <X size={16} aria-hidden />
              </button>
            </div>
            <div className="px-2 pt-3">{searchField(true)}</div>
            <div className="min-h-0 flex-1 px-2">{rail}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* Two letters from whatever identifies the operator best. The console shows
   an avatar where a table would show a name, so it is built from the same
   three sources in the same order of preference. */
function initials(op: Operator): string {
  const from = op.name?.trim() || op.email.split("@")[0] || "?";
  const parts = from.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return from.slice(0, 2).toUpperCase();
}
