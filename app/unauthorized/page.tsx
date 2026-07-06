export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0b] p-8">
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-white/10 to-transparent opacity-50" />
        <div className="relative">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-2xl">
            ⚠
          </div>
          <h1 className="mt-4 text-center text-2xl font-semibold text-white">Access Denied</h1>
          <p className="mt-2 text-center text-sm text-zinc-400">
            You do not have permission to access this panel.
          </p>
          <a
            href="/login"
            className="mt-6 block w-full rounded-lg bg-white/10 px-4 py-2.5 text-center text-sm text-zinc-300 transition-colors hover:bg-white/20"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
