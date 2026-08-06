'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSection, DataTable } from '@tirbeo/ui';
import { apiFetch } from '../../lib';
import { HardDrive, Image, FileText, Film, Music, Archive, Upload, BarChart3 } from 'lucide-react';

interface MediaItem {
  id: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  folder?: string;
  url?: string;
  uploadedById?: string;
  createdAt?: string;
}

export default function StoragePage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiFetch('/api/admin/media').then(async r => {
      if (r.ok) { const d = await r.json(); setMedia(d.media || d.data || d || []); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return FileText;
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Film;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) return Archive;
    return FileText;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
    return `${size.toFixed(1)} ${units[i]}`;
  };

  const totalSize = media.reduce((acc, m) => acc + (m.fileSize || 0), 0);

  const columns = [
    { key: 'fileName', label: 'File', sortable: true, render: (m: MediaItem) => {
      const Icon = getFileIcon(m.mimeType);
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-surface)] flex items-center justify-center">
            <Icon className="w-4 h-4 text-[var(--color-primary)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-admin-text)]">{m.fileName}</p>
            <p className="text-xs text-[var(--color-admin-text-muted)]">{m.mimeType || '—'}</p>
          </div>
        </div>
      );
    }},
    { key: 'fileSize', label: 'Size', render: (m: MediaItem) => (
      <span className="text-sm text-[var(--color-admin-text-muted)]">{formatSize(m.fileSize)}</span>
    )},
    { key: 'folder', label: 'Folder', render: (m: MediaItem) => (
      <span className="text-sm text-[var(--color-admin-text-muted)]">{m.folder || '/'}</span>
    )},
    { key: 'createdAt', label: 'Uploaded', render: (m: MediaItem) => (
      <span className="text-sm text-[var(--color-admin-text-muted)]">
        {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}
      </span>
    )},
  ];

  return (
    <AdminSection title="Storage" description="Manage file storage, media library, and storage quotas"
      tabs={[]} activeTab="" onTabChange={() => {}}
      actions={
        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors">
          <Upload className="w-4 h-4" /> Upload Files
        </button>
      }>
      {/* Storage usage bar */}
      <div className="border-2 border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[var(--color-primary)]" />
            <span className="text-sm font-medium text-[var(--color-admin-text)]">Storage Usage</span>
          </div>
          <span className="text-sm text-[var(--color-admin-text-secondary)]">{formatSize(totalSize)} / —</span>
        </div>
        <div className="h-2 bg-[var(--color-admin-surface-hover)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${Math.min((totalSize / (1024 * 1024 * 1024)) * 100, 100)}%` }} />
        </div>
        <p className="text-xs text-[var(--color-admin-text-muted)] mt-2">{media.length} files stored</p>
      </div>

      <DataTable columns={columns} data={media} keyExtractor={m => m.id}
        onRowClick={m => router.push(`/admin/media/${m.id}`)}
        loading={loading} searchable searchPlaceholder="Search files..."
        emptyState={
          <div className="p-12 text-center">
            <HardDrive className="w-12 h-12 mx-auto mb-4 text-[var(--color-admin-text-muted)]" />
            <p className="text-sm text-[var(--color-admin-text-muted)] mb-1">No files uploaded</p>
            <p className="text-xs text-[var(--color-admin-text-muted)]">Upload files to make them available across the platform</p>
          </div>
        } />
    </AdminSection>
  );
}
