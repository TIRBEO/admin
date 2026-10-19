import { AdminShell } from "@/components/admin-shell";

/* Every console screen renders inside the rail. No `force-dynamic` here on
   purpose — with fixtures the whole app is static, and that is what makes
   it browsable without a database. The moment real fetches come back this
   line has to return, or the first operator's data gets cached for
   everyone:
     export const dynamic = "force-dynamic";
*/
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell>{children}</AdminShell>;
}
