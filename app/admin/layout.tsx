import { AdminShell } from "@/components/admin-shell";

/* Every page under /admin is per-operator truth read live from the API.
   Without this the App Router would prerender each page at build time and
   serve the first operator's shell to the next one. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell>{children}</AdminShell>;
}