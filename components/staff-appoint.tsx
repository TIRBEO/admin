"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";

import type { RoleChoice } from "@/components/staff-role-picker";

/* Put a name on the roster that is not on it yet.

   The roster is drawn from accounts that are *already* staff, so an owner who
   wants to add somebody has to find them by address or handle first — which is
   the console's own search, the one door that already knows how to ask. Nothing
   is created here: the account exists, this only records what kind of staff it
   is about to become.

   The account id never appears on the page. It is a value in a form, and an
   operator picks a person by the name over it. */

type Hit = { id: string; email: string; name: string | null; username: string | null };

export function StaffAppoint({ roles }: { roles: RoleChoice[] }) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [searching, setSearching] = useState(false);
  const [asked, setAsked] = useState(false);
  const [chosen, setChosen] = useState<Hit | null>(null);
  const [role, setRole] = useState(roles[roles.length - 1]?.key ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    let stale = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const json = (await res.json().catch(() => null)) as { users?: Hit[]; error?: string } | null;
        if (stale) return;
        setHits(res.ok && Array.isArray(json?.users) ? json!.users! : []);
      } catch {
        if (!stale) setHits([]);
      } finally {
        if (!stale) {
          setSearching(false);
          setAsked(true);
        }
      }
    }, 220);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [term]);

  async function appoint() {
    if (!chosen || !role) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: chosen.id, role, note: note.trim() || undefined }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setNotice({ tone: "bad", text: json?.error ?? `The console answered ${res.status}.` });
        return;
      }
      setNotice({ tone: "ok", text: `${display(chosen)} is on the roster.` });
      setChosen(null);
      setTerm("");
      setNote("");
      router.refresh();
    } catch {
      setNotice({ tone: "bad", text: "The console never answered. Nobody was appointed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-1.5 focus-within:border-[var(--accent)]">
          <Search size={14} aria-hidden className="shrink-0 text-[var(--text-4)]" />
          <input
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setChosen(null);
            }}
            placeholder="Find an account by email or handle"
            aria-label="Find an account"
            className="w-full bg-transparent text-[13px] text-[var(--fg)] outline-none placeholder:text-[var(--placeholder)]"
          />
          {searching ? <Loader2 size={13} aria-hidden className="animate-spin text-[var(--text-4)]" /> : null}
        </label>
        <label className="sr-only" htmlFor="appoint-role">
          Role to grant
        </label>
        <select
          id="appoint-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-9 rounded-[8px] border border-[var(--border)] bg-[var(--field)] px-2 text-[13px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
        >
          {roles.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-primary btn-sm" onClick={appoint} disabled={!chosen || !role || busy}>
          Appoint
        </button>
      </div>

      {chosen ? (
        <p className="text-[12px] text-[var(--text-2)]">
          Appointing <span className="font-semibold text-[var(--fg)]">{display(chosen)}</span>
          <span className="text-[var(--muted)]"> — {chosen.email}</span>
        </p>
      ) : hits.length > 0 ? (
        <ul className="divide-y divide-[var(--divider)] overflow-hidden rounded-[10px] border border-[var(--border)]">
          {hits.slice(0, 6).map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => setChosen(h)}
                className="flex w-full items-baseline gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-[var(--hover)]"
              >
                <span className="min-w-0 truncate font-medium text-[var(--fg)]">{display(h)}</span>
                <span className="min-w-0 shrink truncate text-[12px] text-[var(--muted)]">{h.email}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : asked && !searching && term.trim().length >= 2 ? (
        <p className="text-[12px] text-[var(--muted)]">No account matches “{term.trim()}”.</p>
      ) : null}

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Why this person is staff — recorded on the row"
        aria-label="Note recorded beside the role"
        maxLength={500}
        className="h-8 w-full rounded-[8px] border border-[var(--border)] bg-[var(--field)] px-2.5 text-[12px] text-[var(--fg)] placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:outline-none"
      />

      {notice ? (
        <p className={`text-[12px] ${notice.tone === "ok" ? "text-[var(--success-text)]" : "text-[var(--danger-text)]"}`}>
          {notice.text}
        </p>
      ) : null}
    </div>
  );
}

function display(h: Hit): string {
  return h.name?.trim() || h.username || h.email || h.id;
}
