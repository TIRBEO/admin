'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSection, StatusBadge } from '@tirbeo/ui';
import { apiFetch } from '../../../lib';
import { ChevronRight, ChevronDown, Folder, Plus, MoreHorizontal } from 'lucide-react';

interface OUNode {
  id: string;
  name: string;
  description?: string;
  children?: OUNode[];
  userCount?: number;
  groupCount?: number;
}

function TreeNode({ node, depth = 0 }: { node: OUNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-[var(--color-admin-surface-hover)] transition-colors cursor-pointer group"
        style={{ paddingLeft: `${12 + depth * 24}px` }}>
        <button onClick={() => setExpanded(!expanded)} className="text-[var(--color-admin-text-muted)] hover:text-[var(--color-admin-text)]">
          {hasChildren ? (expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : <span className="w-4" />}
        </button>
        <Folder className="w-4 h-4 text-[var(--color-warning)]" />
        <span className="text-sm font-medium text-[var(--color-admin-text)] flex-1">{node.name}</span>
        <div className="flex items-center gap-4 text-xs text-[var(--color-admin-text-muted)]">
          {node.userCount !== undefined && <span>{node.userCount} users</span>}
          {node.groupCount !== undefined && <span>{node.groupCount} groups</span>}
        </div>
        <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--color-admin-border)] text-[var(--color-admin-text-muted)]">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      {expanded && hasChildren && node.children!.map(child => (
        <TreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function OUsList() {
  const [tree, setTree] = useState<OUNode[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiFetch('/api/admin/ous').then(async r => {
      if (r.ok) { const d = await r.json(); setTree(d.ous || d.data || d || []); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <AdminSection title="Organizational Units" description="Structure your organization hierarchy"
      tabs={[]} activeTab="" onTabChange={() => {}}
      actions={
        <button onClick={() => router.push('/admin/directory/ous/new')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors">
          <Plus className="w-4 h-4" />
          Add OU
        </button>
      }>
      {loading ? (
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-6 space-y-3 animate-pulse">
          {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-[var(--color-admin-surface-hover)] rounded" />)}
        </div>
      ) : tree.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-12 text-center">
          <Folder className="w-12 h-12 mx-auto mb-4 text-[var(--color-admin-text-muted)]" />
          <p className="text-sm text-[var(--color-admin-text-muted)] mb-4">No organizational units found</p>
          <button onClick={() => router.push('/admin/directory/ous/new')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium">
            Create your first OU
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-4">
          {tree.map(node => <TreeNode key={node.id} node={node} />)}
        </div>
      )}
    </AdminSection>
  );
}
