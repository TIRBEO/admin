import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { FileText, Users, HelpCircle, CreditCard, BookOpen, MessageSquare, LinkIcon, Shield, Activity } from "lucide-react";

const cards = [
  { table: "nav_links", label: "Nav Links", icon: LinkIcon, color: "bg-blue-500/10 text-blue-400" },
  { table: "pages", label: "Pages", icon: FileText, color: "bg-violet-500/10 text-violet-400" },
  { table: "team_members", label: "Team Members", icon: Users, color: "bg-pink-500/10 text-pink-400" },
  { table: "testimonials", label: "Testimonials", icon: MessageSquare, color: "bg-emerald-500/10 text-emerald-400" },
  { table: "faqs", label: "FAQs", icon: HelpCircle, color: "bg-amber-500/10 text-amber-400" },
  { table: "pricing_plans", label: "Pricing Plans", icon: CreditCard, color: "bg-cyan-500/10 text-cyan-400" },
  { table: "doc_articles", label: "Docs Articles", icon: BookOpen, color: "bg-rose-500/10 text-rose-400" },
  { table: "admin_users", label: "Admin Users", icon: Shield, color: "bg-red-500/10 text-red-400" },
  { table: "admin_audit_log", label: "Audit Entries", icon: Activity, color: "bg-purple-500/10 text-purple-400" },
];

export default function Dashboard() {
  const { session, role } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    Promise.all(
      cards.map(async (c) => {
        try {
          const { count } = await supabase.from(c.table).select("*", { count: "exact", head: true });
          return [c.table, count ?? 0];
        } catch {
          return [c.table, 0];
        }
      })
    ).then((results) => setCounts(Object.fromEntries(results)));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Welcome back, {session?.admin.display_name || session?.user.email}
          <span className="ml-2 text-xs uppercase tracking-wider text-neutral-600">
            ({role?.replace("_", " ")})
          </span>
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.table} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <div className={`mb-3 inline-flex rounded-lg p-2.5 ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-semibold">{counts[c.table] ?? "..."}</p>
            <p className="text-sm text-neutral-400 mt-1">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
