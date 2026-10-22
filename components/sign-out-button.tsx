"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

/* Signing out of the console.

   The button is honest about the one thing it cannot promise: if the API never
   answers, the session is still live, and a console that quietly painted a
   signed-out screen would leave the operator believing otherwise. */

export function SignOutButton({ className = "btn btn-quiet px-2" }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  async function signOut() {
    setBusy(true);
    setFailed(null);
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setFailed(json?.error ?? `The console answered ${res.status}.`);
        return;
      }
      // Every screen reads live, so a refresh paints the refused-session state
      // rather than the data this operator was looking at a second ago.
      router.refresh();
    } catch {
      setFailed("The console never answered. You are still signed in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={className}
        onClick={signOut}
        disabled={busy}
        title="End this session and clear the cookies this browser holds for Tirbeo"
      >
        <LogOut size={16} aria-hidden />
        <span className="sr-only">Sign out</span>
      </button>
      {failed ? (
        <span className="max-w-[16rem] text-[12px] leading-snug text-[var(--danger-text)]">
          {failed}
        </span>
      ) : null}
    </div>
  );
}
