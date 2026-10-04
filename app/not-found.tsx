import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-[44px] font-semibold tracking-[-0.03em]">404</p>
      <h1 className="text-[15px] font-medium">No such admin section</h1>
      <p className="max-w-sm text-[13px] text-[var(--tb-text-muted)]">
        That page is not part of the panel. Press ⌘K to search the sections that
        do exist.
      </p>
      <Link
        href="/admin"
        className="mt-2 rounded-lg bg-[var(--tb-accent)] px-3 py-2 text-[13px] font-medium text-[var(--tb-accent-contrast)]"
      >
        Back to dashboard
      </Link>
    </main>
  );
}