import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-[44px] font-semibold tracking-[-0.03em] text-[var(--fg)]">404</p>
      <h1 className="text-[15px] font-medium tracking-[-0.01em]">No such admin section</h1>
      <p className="max-w-sm text-[13px] leading-relaxed text-[var(--muted)]">
        That page is not part of the panel. Search the rail for the sections that
        do exist.
      </p>
      <Link href="/admin" className="btn btn-primary mt-2">
        Back to dashboard
      </Link>
    </main>
  );
}
