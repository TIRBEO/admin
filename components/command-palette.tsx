"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, User } from "lucide-react";

import { searchNav, type Permissions } from "@/lib/nav";

/* One box that finds anything: a section by what it is called, a person by
   name, handle or address.
 *
 *   The rail's filter only ever knew the navigation, and the console has an
 *   operator API that knows the accounts — so the two are searched together here.
 *   Sections answer instantly and locally; people are asked of the API after
 *   two characters, because a single letter would return half the platform.
 *
 *   Both halves obey the same permission set the rail does. A palette that
 *   listed a screen you cannot open, or a person whose page answers 403, is a
 *   faster way to hit a refusal than the rail was. */

type Hit =
  | { kind: "section"; href: string; label: string; group: string }
  | { kind: "person"; href: string; label: string; sub: string };

type ApiUser = { id?: string; email?: string; name?: string | null; username?: string | null };

export function CommandPalette({
  open,
  onClose,
  permissions,
}: {
  open: boolean;
  onClose: () => void;
  permissions: Permissions | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<ApiUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setPeople([]);
    setCursor(0);
    input.current?.focus();
  }, [open]);

  useEffect(() => {
    const term = query.trim();
    // People are only listed when the operator can open one: a hit is a
    // navigation, and navigating to a refusal is worse than not finding it.
    if (term.length < 2 || permissions?.["people.read"] === false) {
      setPeople([]);
      setSearching(false);
      return;
    }
    let stale = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        const json = (await res.json().catch(() => null)) as { users?: ApiUser[] } | null;
        if (!stale) setPeople(res.ok ? (json?.users ?? []) : []);
      } catch {
        if (!stale) setPeople([]);
      } finally {
        if (!stale) setSearching(false);
      }
    }, 220);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [query]);

  const hits = useMemo<Hit[]>(() => {
    const term = query.trim().toLowerCase();
    const sections: Hit[] = searchNav(query, permissions)
      .flatMap((g) => g.items.map((i) => ({ kind: "section" as const, href: i.href, label: i.label, group: g.title })))
      .slice(0, term ? 6 : 5);

    const found: Hit[] = people.slice(0, 6).map((u) => ({
      kind: "person",
      href: `/admin/people/${u.id}`,
      label: u.name?.trim() || u.username || u.email || u.id || "",
      sub: u.email ?? "",
    }));

    return [...sections, ...found];
  }, [query, people, permissions]);

  useEffect(() => setCursor(0), [hits.length]);

  if (!open) return null;

  function go(hit: Hit) {
    onClose();
    router.push(hit.href);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (hits.length ? (c + 1) % hits.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (hits.length ? (c - 1 + hits.length) % hits.length : 0));
    } else if (e.key === "Enter" && hits[cursor]) {
      e.preventDefault();
      go(hits[cursor]);
    }
  }

  const firstPerson = hits.findIndex((h) => h.kind === "person");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search the console">
      <button type="button" aria-label="Close search" onClick={onClose} className="absolute inset-0 bg-[var(--scrim)]" />
      <div className="relative w-full max-w-[560px] overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-pop)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--divider)] px-4">
          <Search size={15} aria-hidden className="shrink-0 text-[var(--text-4)]" />
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Sections, people, addresses"
            aria-label="Search the console"
            className="h-12 w-full bg-transparent text-[14px] text-[var(--fg)] outline-none placeholder:text-[var(--placeholder)]"
          />
          {searching ? <span className="text-[11px] text-[var(--muted)]">…</span> : null}
        </div>

        {hits.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-[var(--muted)]">
            Nothing in the console matches “{query.trim()}”.
          </p>
        ) : (
          <ul className="max-h-[52vh] overflow-y-auto py-2">
            {hits.map((hit, i) => (
              <li key={`${hit.kind}-${hit.href}`}>
                {i === 0 || (firstPerson === i && firstPerson > 0) ? (
                  <p className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-4)] first:pt-0">
                    {hit.kind === "person" ? "People" : "Sections"}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => go(hit)}
                  onMouseEnter={() => setCursor(i)}
                  aria-current={i === cursor ? "true" : undefined}
                  className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] ${
                    i === cursor ? "bg-[var(--surface-2)] text-[var(--fg)]" : "text-[var(--text-2)]"
                  }`}
                >
                  {hit.kind === "section" ? (
                    <>
                      <span className="min-w-0 flex-1 truncate font-medium tracking-[-0.01em]">
                        {hit.label}
                      </span>
                      <span className="shrink-0 text-[11px] uppercase tracking-[0.1em] text-[var(--text-4)]">
                        {hit.group}
                      </span>
                    </>
                  ) : (
                    <>
                      <User size={14} aria-hidden className="shrink-0 text-[var(--text-4)]" />
                      <span className="min-w-0 flex-1 truncate">{hit.label}</span>
                      <span className="min-w-0 shrink truncate text-[12px] text-[var(--muted)]">
                        {hit.sub}
                      </span>
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="border-t border-[var(--divider)] px-4 py-2 text-[11px] text-[var(--text-4)]">
          ↑↓ to move · enter to open · esc to close
        </p>
      </div>
    </div>
  );
}
