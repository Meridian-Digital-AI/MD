'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  created_at: string;
  source: string | null;
};

export default function RecentLeadsList({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onDelete(id: string, label: string) {
    if (!confirm(`Delete lead "${label}"? This cannot be undone.`)) return;
    setError(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/leads/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.message || json.error || 'Delete failed.');
        setDeletingId(null);
        return;
      }
      // Refresh server data so the row disappears + counts update.
      startTransition(() => router.refresh());
      setDeletingId(null);
    } catch (err) {
      setError((err as Error).message || 'Network error.');
      setDeletingId(null);
    }
  }

  if (leads.length === 0) {
    return <div className="py-4 text-sm text-slate-400">No leads yet.</div>;
  }

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800">
          {error}
        </div>
      )}
      <ul className="divide-y divide-slate-100 text-sm">
        {leads.map((l) => {
          const label = l.name ?? l.email ?? 'Anonymous';
          const isDeleting = deletingId === l.id || pending;
          return (
            <li key={l.id} className="flex items-center justify-between gap-3 py-2">
              <span className="text-slate-700">{label}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  {new Date(l.created_at).toLocaleDateString('en-GB')}
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(l.id, label)}
                  disabled={isDeleting}
                  className="rounded text-xs text-slate-400 hover:text-red-600 disabled:opacity-50"
                  title="Delete lead"
                >
                  {deletingId === l.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
