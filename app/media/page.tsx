'use client';
import React, { useEffect, useState, useRef } from 'react';
import { apiFetch, API, getFileSize, isImage, isVideo } from '../lib';
import { Toast } from '../settings/shared';

interface MediaItem {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnail: string | null;
  altText: string | null;
  width: number | null;
  height: number | null;
  folder: string;
  tags: string[];
  createdAt: string;
  uploadedBy: { id: string; email: string; name: string | null };
}

type Folder = 'general' | 'avatars' | 'banners' | 'email';

const FOLDERS: Folder[] = ['general', 'avatars', 'banners', 'email'];

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isPdf(mime: string) { return mime === 'application/pdf'; }

function FileIcon({ mime, url, alt }: { mime: string; url: string; alt: string }) {
  if (isImage(mime)) return <img src={url} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  if (isVideo(mime)) return <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  if (isPdf(mime)) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg></div>;
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg></div>;
}

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [editAlt, setEditAlt] = useState('');
  const [editFolder, setEditFolder] = useState('');
  const [editTags, setEditTags] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const limit = 24;

  const load = async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (folder) params.set('folder', folder);
      if (type) params.set('type', type);
      if (search) params.set('q', search);
      const res = await apiFetch(`/api/admin/media?${params}`);
      if (res.ok) { const d = await res.json(); setItems(d.items); setTotal(d.total); }
    } catch { setMsg({ type: 'error', text: 'Failed to load media' }); }
    setLoading(false);
  };

  useEffect(() => { load(1); setPage(1); }, [folder, type, search]);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', editFolder || 'general');
      fd.append('altText', editAlt || file.name);
      fd.append('tags', '[]');
      const res = await fetch(`${API}/api/admin/media`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      if (!res.ok) throw new Error('Upload failed');
      setMsg({ type: 'success', text: 'Uploaded successfully' });
      setShowUpload(false);
      setEditAlt('');
      setEditFolder('general');
      if (fileRef.current) fileRef.current.value = '';
      load(page);
    } catch (e: any) { setMsg({ type: 'error', text: e.message || 'Upload failed' }); }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media?')) return;
    try {
      const res = await apiFetch(`/api/admin/media/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setMsg({ type: 'success', text: 'Deleted' });
      setSelected(null);
      load(page);
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    try {
      const body: Record<string, unknown> = {};
      if (editAlt !== selected.altText) body.altText = editAlt;
      if (editFolder !== selected.folder) body.folder = editFolder;
      const tags = editTags.split(',').map(t => t.trim()).filter(Boolean);
      body.tags = tags;
      const res = await apiFetch(`/api/admin/media/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Update failed');
      setMsg({ type: 'success', text: 'Updated' });
      load(page);
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="settings-page">
      <Toast msg={msg} onClose={() => setMsg(null)} />

      <div className="settings-page-header">
        <div>
          <h2>Media Library</h2>
          <p className="desc">{total} files Â· {getFileSize(items.reduce((s, i) => s + i.fileSize, 0))} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Upload
        </button>
      </div>

      {/* Filters */}
      <div className="search-form" style={{ marginBottom: 16 }}>
        <input className="input" type="text" placeholder="Search filesâ€¦" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
        <select className="select" value={folder} onChange={e => setFolder(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">All folders</option>
          {FOLDERS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select className="select" value={type} onChange={e => setType(e.target.value)} style={{ maxWidth: 140 }}>
          <option value="">All types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="application/pdf">PDFs</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="loading" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>Loadingâ€¦</div>
      ) : items.length === 0 ? (
        <div className="empty-state">No media found. Upload something!</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {items.map(item => (
              <div key={item.id} onClick={() => { setSelected(item); setEditAlt(item.altText || ''); setEditFolder(item.folder); setEditTags((item.tags as string[])?.join(', ') || ''); }}
                style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                  borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                className="media-card"
              >
                <div style={{ width: '100%', height: 150, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <FileIcon mime={item.mimeType} url={item.url} alt={item.altText || item.fileName} />
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.fileName}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    <span>{getFileSize(item.fileSize)}</span>
                    <span className="badge badge-muted" style={{ fontSize: 9 }}>{item.folder}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 20 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`btn ${p === page ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => { setPage(p); load(p); }}>{p}</button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>Upload Media</h3>
              <button className="modal-close" onClick={() => setShowUpload(false)}>Ã—</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <div className="field-label"><span>File</span></div>
                <input type="file" ref={fileRef} style={{ color: 'var(--text-primary)', fontSize: 13 }} />
              </div>
              <div className="field">
                <div className="field-label"><span>Folder</span></div>
                <select className="select" value={editFolder} onChange={e => setEditFolder(e.target.value)}>
                  {FOLDERS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="field">
                <div className="field-label"><span>Alt Text</span></div>
                <input className="input" type="text" value={editAlt} onChange={e => setEditAlt(e.target.value)} placeholder="Description" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowUpload(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Uploadingâ€¦' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3>{selected.fileName}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>Ã—</button>
            </div>
            <div className="modal-body">
              {isImage(selected.mimeType) && (
                <img src={selected.url} alt={selected.altText || ''} style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, marginBottom: 16 }} />
              )}
              {isVideo(selected.mimeType) && (
                <video src={selected.url} controls style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, marginBottom: 16 }} />
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, marginBottom: 16 }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Size</span><br/>{getFileSize(selected.fileSize)}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Type</span><br/>{selected.mimeType}</div>
                {selected.width && <div><span style={{ color: 'var(--text-muted)' }}>Dimensions</span><br/>{selected.width} Ã— {selected.height}</div>}
                <div><span style={{ color: 'var(--text-muted)' }}>Uploaded</span><br/>{formatDate(selected.createdAt)}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>By</span><br/>{selected.uploadedBy.name || selected.uploadedBy.email}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Folder</span><br/>{selected.folder}</div>
              </div>

              <div className="field">
                <div className="field-label"><span>Alt Text</span></div>
                <input className="input" type="text" value={editAlt} onChange={e => setEditAlt(e.target.value)} />
              </div>
              <div className="field">
                <div className="field-label"><span>Folder</span></div>
                <select className="select" value={editFolder} onChange={e => setEditFolder(e.target.value)}>
                  {FOLDERS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="field">
                <div className="field-label"><span>Tags</span></div>
                <input className="input" type="text" value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="tag1, tag2" />
              </div>
              <div className="field">
                <div className="field-label"><span>URL</span></div>
                <input className="input" type="text" value={selected.url} readOnly onFocus={e => e.target.select()} />
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleUpdate}>Save</button>
              <button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button>
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



