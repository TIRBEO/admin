import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";

interface DocCategory { id: string; title: string; slug: string; sort_order: number; }
interface DocArticle { id: string; category_id: string; title: string; slug: string; content: string; is_published: boolean; }

export default function DocsPage() {
  const [categories, setCategories] = useState<(DocCategory & { articles: DocArticle[] })[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: c } = await supabase.from("doc_categories").select("*").order("sort_order");
    const { data: a } = await supabase.from("doc_articles").select("*").order("sort_order");
    if (c && a) {
      setCategories(c.map((cat) => ({ ...cat, articles: a.filter((art) => art.category_id === cat.id) })));
    }
  };

  const addCategory = async () => {
    const title = prompt("Category title:");
    if (!title) return;
    const slug = title.toLowerCase().replace(/\s+/g, "-");
    await supabase.from("doc_categories").insert({ title, slug, sort_order: categories.length });
    load();
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Documentation</h1>
        <button onClick={addCategory} className="flex items-center gap-2 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200">
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>
      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="rounded-lg border border-neutral-800 bg-neutral-900/30">
            <button onClick={() => setExpanded(expanded === cat.id ? null : cat.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm">
              {expanded === cat.id ? <ChevronDown className="h-4 w-4 text-neutral-500" /> : <ChevronRight className="h-4 w-4 text-neutral-500" />}
              <span className="flex-1 font-medium">{cat.title}</span>
              <span className="text-xs text-neutral-500">{cat.articles.length} articles</span>
            </button>
            {expanded === cat.id && (
              <div className="border-t border-neutral-800 px-4 pb-3 pt-2 space-y-1">
                {cat.articles.map((article) => (
                  <div key={article.id} className="flex items-center gap-3 rounded bg-neutral-950/50 px-3 py-2 text-xs">
                    <span className="flex-1">{article.title}</span>
                    <span className="text-neutral-500">/{article.slug}</span>
                    <span className={`px-2 py-0.5 rounded-full ${article.is_published ? "bg-green-500/10 text-green-400" : "bg-neutral-800 text-neutral-500"}`}>{article.is_published ? "Published" : "Draft"}</span>
                  </div>
                ))}
                <button className="text-xs text-neutral-500 hover:text-neutral-200 mt-1">+ Add Article</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
