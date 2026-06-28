import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  Save, X, Eye, EyeOff, FileText, ArrowUp, ArrowDown, Send, Loader2,
} from "lucide-react";

interface DocCategory {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

interface DocArticle {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  content: string | null;
  sort_order: number;
  is_published: boolean;
}

export default function DocsPage() {
  const { hasPermission, session } = useAuth();
  const [categories, setCategories] = useState<(DocCategory & { articles: DocArticle[] })[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [catForm, setCatForm] = useState({ title: "", slug: "", description: "" });
  const [editingArticle, setEditingArticle] = useState<string | null>(null);
  const [artForm, setArtForm] = useState({ title: "", slug: "", content: "", is_published: true });
  const [error, setError] = useState("");
  const [reordering, setReordering] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const canWrite = hasPermission("content", "write");
  const canDelete = hasPermission("content", "delete");
  const canPublish = session?.admin?.role === "admin" || session?.admin?.role === "super_admin";

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
    const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const { error: e } = await supabase.from("doc_categories").insert({
      title, slug, sort_order: categories.length,
    });
    if (e) { setError(e.message); return; }
    load();
  };

  const saveCategory = async (id: string) => {
    const { error: e } = await supabase.from("doc_categories").update({
      title: catForm.title,
      slug: catForm.slug,
      description: catForm.description || null,
    }).eq("id", id);
    if (e) { setError(e.message); return; }
    setEditingCategory(null);
    load();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category and all its articles?")) return;
    await supabase.from("doc_categories").delete().eq("id", id);
    load();
  };

  const startEditCategory = (cat: DocCategory) => {
    setCatForm({ title: cat.title, slug: cat.slug, description: cat.description || "" });
    setEditingCategory(cat.id);
  };

  const moveCategory = async (id: string, dir: "up" | "down") => {
    setReordering(true);
    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= sorted.length) { setReordering(false); return; }
    await supabase.from("doc_categories").update({ sort_order: sorted[swap].sort_order }).eq("id", id);
    await supabase.from("doc_categories").update({ sort_order: sorted[idx].sort_order }).eq("id", sorted[swap].id);
    setReordering(false);
    load();
  };

  const addArticle = async (categoryId: string) => {
    const title = prompt("Article title:");
    if (!title) return;
    const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const cat = categories.find((c) => c.id === categoryId);
    const sort_order = cat ? cat.articles.length : 0;
    const { error: e } = await supabase.from("doc_articles").insert({
      category_id: categoryId, title, slug, content: "", sort_order, is_published: false,
    });
    if (e) { setError(e.message); return; }
    load();
  };

  const saveArticle = async (id: string, submitForApproval = false) => {
    const updates: any = {
      title: artForm.title,
      slug: artForm.slug,
      content: artForm.content,
    };

    // If user can't publish directly, mark as unpublished and submit for approval
    if (submitForApproval) {
      updates.is_published = false;
    } else if (canPublish) {
      updates.is_published = artForm.is_published;
    } else {
      updates.is_published = false;
    }

    const { error: e } = await supabase.from("doc_articles").update(updates).eq("id", id);
    if (e) { setError(e.message); return; }

    // Submit for approval
    if (submitForApproval) {
      setSubmitting(id);
      const article = categories.flatMap((c) => c.articles).find((a) => a.id === id);
      await supabase.from("content_approvals").insert({
        content_type: "doc_article",
        content_id: id,
        title: artForm.title,
        content: artForm.content?.slice(0, 500) || "",
        status: "pending",
        priority: "medium",
        submitted_by: session?.admin?.display_name || session?.admin?.email || "Unknown",
      });
      setSubmitting(null);
    }

    setEditingArticle(null);
    load();
  };

  const deleteArticle = async (id: string) => {
    if (!confirm("Delete this article?")) return;
    await supabase.from("doc_articles").delete().eq("id", id);
    load();
  };

  const startEditArticle = (article: DocArticle) => {
    setArtForm({
      title: article.title,
      slug: article.slug,
      content: article.content || "",
      is_published: article.is_published,
    });
    setEditingArticle(article.id);
  };

  const moveArticle = async (categoryId: string, articleId: string, dir: "up" | "down") => {
    setReordering(true);
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const sorted = [...cat.articles].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((a) => a.id === articleId);
    if (idx === -1) return;
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= sorted.length) { setReordering(false); return; }
    await supabase.from("doc_articles").update({ sort_order: sorted[swap].sort_order }).eq("id", articleId);
    await supabase.from("doc_articles").update({ sort_order: sorted[idx].sort_order }).eq("id", sorted[swap].id);
    setReordering(false);
    load();
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documentation</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage doc categories and articles</p>
        </div>
        {canWrite && (
          <button onClick={addCategory} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add Category
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="rounded-lg border border-neutral-800 bg-neutral-900">
            <div className="flex items-center gap-3 px-4 py-3">
              <button onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
                className="flex items-center gap-2 flex-1 text-left text-sm">
                {expanded === cat.id ? <ChevronDown className="h-4 w-4 text-neutral-500" /> : <ChevronRight className="h-4 w-4 text-neutral-500" />}
                {editingCategory === cat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input value={catForm.title} onChange={(e) => setCatForm({ ...catForm, title: e.target.value })}
                      className="w-48 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-white" />
                    <input value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                      className="w-36 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-500" />
                    <input value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                      placeholder="Description"
                      className="w-64 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-500" />
                    <button onClick={() => saveCategory(cat.id)} className="p-1 text-green-400 hover:text-green-300"><Save className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setEditingCategory(null)} className="p-1 text-neutral-500 hover:text-neutral-300"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{cat.title}</span>
                    <span className="text-xs text-neutral-500">/{cat.slug}</span>
                    <span className="text-xs text-neutral-500">{cat.articles.length} articles</span>
                  </>
                )}
              </button>
              {/* Reorder categories */}
              {canWrite && editingCategory !== cat.id && (
                <div className="flex items-center gap-0.5">
                  <button onClick={() => moveCategory(cat.id, "up")} disabled={reordering}
                    className="p-1 text-neutral-500 hover:text-neutral-300 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button onClick={() => moveCategory(cat.id, "down")} disabled={reordering}
                    className="p-1 text-neutral-500 hover:text-neutral-300 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                </div>
              )}
              {canWrite && editingCategory !== cat.id && (
                <button onClick={() => startEditCategory(cat)} className="p-1 text-neutral-500 hover:text-neutral-300"><Pencil className="h-3.5 w-3.5" /></button>
              )}
              {canDelete && editingCategory !== cat.id && (
                <button onClick={() => deleteCategory(cat.id)} className="p-1 text-neutral-500 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              )}
            </div>

            {expanded === cat.id && (
              <div className="border-t border-neutral-800 px-4 pb-3 space-y-1">
                {cat.articles.length === 0 && (
                  <p className="py-4 text-center text-xs text-neutral-500">No articles yet</p>
                )}
                {cat.articles.map((article) => (
                  <div key={article.id}>
                    {editingArticle === article.id ? (
                      <div className="rounded bg-neutral-800 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <input value={artForm.title} onChange={(e) => setArtForm({ ...artForm, title: e.target.value })}
                            className="flex-1 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-white" />
                          <span className="text-xs text-neutral-500">/</span>
                          <input value={artForm.slug} onChange={(e) => setArtForm({ ...artForm, slug: e.target.value })}
                            className="w-36 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-500" />
                          {canPublish && (
                            <button onClick={() => setArtForm({ ...artForm, is_published: !artForm.is_published })}
                              className={`p-1 ${artForm.is_published ? "text-emerald-600" : "text-neutral-500"}`}>
                              {artForm.is_published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </button>
                          )}
                          <button onClick={() => saveArticle(article.id)} className="p-1 text-green-400 hover:text-green-300"><Save className="h-3.5 w-3.5" /></button>
                          {!canPublish && (
                            <button onClick={() => saveArticle(article.id, true)} disabled={submitting === article.id}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-600 hover:bg-amber-700 rounded text-white disabled:opacity-50">
                              {submitting === article.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Submit
                            </button>
                          )}
                          <button onClick={() => setEditingArticle(null)} className="p-1 text-neutral-500 hover:text-neutral-300"><X className="h-3.5 w-3.5" /></button>
                        </div>
                        <textarea value={artForm.content} onChange={(e) => setArtForm({ ...artForm, content: e.target.value })}
                          rows={12}
                          className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white font-mono" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded bg-neutral-800 px-3 py-2 text-xs">
                        <FileText className="h-3.5 w-3.5 text-neutral-500" />
                        {/* Reorder articles */}
                        {canWrite && (
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => moveArticle(cat.id, article.id, "up")} disabled={reordering}
                              className="p-0.5 text-neutral-500 hover:text-neutral-300 disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                            <button onClick={() => moveArticle(cat.id, article.id, "down")} disabled={reordering}
                              className="p-0.5 text-neutral-500 hover:text-neutral-300 disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
                          </div>
                        )}
                        <span className="flex-1">{article.title}</span>
                        <span className="text-neutral-500">/{article.slug}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${article.is_published ? "bg-green-50 text-green-700" : "bg-neutral-700 text-neutral-500"}`}>
                          {article.is_published ? "Published" : "Draft"}
                        </span>
                        {canWrite && (
                          <button onClick={() => startEditArticle(article)} className="p-1 text-neutral-500 hover:text-neutral-300"><Pencil className="h-3 w-3" /></button>
                        )}
                        {canDelete && (
                          <button onClick={() => deleteArticle(article.id)} className="p-1 text-neutral-500 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {canWrite && editingArticle === null && (
                  <button onClick={() => addArticle(cat.id)} className="text-xs text-neutral-500 hover:text-neutral-300 mt-1 flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Add Article
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
