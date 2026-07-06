export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="font-heading text-2xl font-bold text-tirbeo-crimson-600">
        Access Denied
      </h1>
      <p className="mt-4 text-sm text-tirbeo-dark-500">
        You do not have permission to access this panel.
      </p>
    </main>
  );
}
