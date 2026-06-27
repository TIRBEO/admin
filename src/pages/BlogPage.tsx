import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { FileText, Plus, Edit2, Trash2, Eye, X, Save, CheckCircle, XCircle } from "lucide-react";

interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author_name: string;
  published: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    if (data) setPosts(data as BlogPost[]);
    setLoading(false);
  };

  const createNew = () => {
    setEditing({
      title: "", slug: "", content: "", excerpt: "",
      author_name: "Admin", published: false,
    });
  };

  const savePost = async () => {
    if (!editing) return;
    setSaving(true);
    const slug = editing.slug || editing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    if (editing.id) {
      await supabase.from("blog_posts").update({
        title: editing.title, slug, content: editing.content,
        excerpt: editing.excerpt, author_name: editing.author_name,
        published: editing.published, updated_at: new Date().toISOString(),
      }).eq("id", editing.id);
    } else {
      await supabase.from("blog_posts").insert({
        title: editing.title, slug, content: editing.content,
        excerpt: editing.excerpt, author_name: editing.author_name,
        published: editing.published,
      });
    }
    setSaving(false);
    setEditing(null);
    loadPosts();
  };

  const deletePost = async (id: string) => {
    await supabase.from("blog_posts").delete().eq("id", id);
    loadPosts();
  };

  const togglePublish = async (post: BlogPost) => {
    await supabase.from("blog_posts").update({ published: !post.published, updated_at: new Date().toISOString() }).eq("id", post.id);
    loadPosts();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-neutral-400" />
          <h1 className="text-2xl font-semibold tracking-tight">Blog Posts</h1>
        </div>
        <button onClick={createNew} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-neutral-200">{editing.id ? "Edit Post" : "New Post"}</h2>
                <button onClick={() => setEditing(null)} className="text-neutral-500 hover:text-neutral-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Title</label>
                  <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Slug</label>
                  <input value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white font-mono" />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Excerpt</label>
                  <textarea value={editing.excerpt} onChange={e => setEditing({ ...editing, excerpt: e.target.value })}
                    rows={2} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white resize-none" />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Content (Markdown)</label>
                  <textarea value={editing.content} onChange={e => setEditing({ ...editing, content: e.target.value })}
                    rows={12} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white font-mono resize-none" />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Author</label>
                  <input value={editing.author_name} onChange={e => setEditing({ ...editing, author_name: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditing({ ...editing, published: !editing.published })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${editing.published ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-400"}`}>
                    {editing.published ? "Published" : "Draft"}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-800">
                <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors">Cancel</button>
                <button onClick={savePost} disabled={saving || !editing.title}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  <Save className="w-4 h-4" />{saving ? "Saving..." : "Save Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-neutral-900/50 border border-neutral-800 animate-pulse" />)}</div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-neutral-700" />
          <p className="text-sm text-neutral-500 mb-4">No blog posts yet</p>
          <button onClick={createNew} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
            Create First Post
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map(post => (
            <div key={post.id} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="w-4 h-4 text-neutral-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-neutral-200 truncate">{post.title}</p>
                  <p className="text-xs text-neutral-500 truncate">{post.slug} &middot; {post.author_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => togglePublish(post)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${post.published ? "bg-emerald-600/20 text-emerald-400" : "bg-neutral-800 text-neutral-500"}`}>
                  {post.published ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {post.published ? "Published" : "Draft"}
                </button>
                <button onClick={() => setEditing(post)} className="p-1.5 text-neutral-500 hover:text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => post.id && deletePost(post.id)} className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
