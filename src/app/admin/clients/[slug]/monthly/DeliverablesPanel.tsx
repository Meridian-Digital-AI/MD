'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  TYPE_LABELS,
  TYPE_COLOURS,
  type DeliverableType,
} from '@/lib/dashboard/deliverableTemplates';

type Deliverable = {
  id: string;
  title: string;
  type: DeliverableType;
  notes: string | null;
  order_index: number;
  completed_at: string | null;
};

export default function DeliverablesPanel({
  slug,
  month,
  initial,
  hasTemplate,
}: {
  slug: string;
  month: string;
  initial: Deliverable[];
  hasTemplate: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState<Deliverable[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [seedBusy, setSeedBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<DeliverableType>('other');
  const [addBusy, setAddBusy] = useState(false);

  const completedCount = items.filter((d) => d.completed_at).length;

  async function refresh() {
    startTransition(() => router.refresh());
  }

  async function toggle(d: Deliverable) {
    setError(null);
    setBusyId(d.id);
    const next = !d.completed_at;
    try {
      const res = await fetch(
        `/api/admin/clients/${slug}/deliverables/${d.id}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ completed: next }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message || json.error || 'Update failed.');
        setBusyId(null);
        return;
      }
      setItems((prev) =>
        prev.map((x) =>
          x.id === d.id ? { ...x, completed_at: next ? new Date().toISOString() : null } : x,
        ),
      );
      setBusyId(null);
    } catch (err) {
      setError((err as Error).message || 'Network error.');
      setBusyId(null);
    }
  }

  async function remove(d: Deliverable) {
    if (!confirm(`Delete "${d.title}"?`)) return;
    setError(null);
    setBusyId(d.id);
    try {
      const res = await fetch(
        `/api/admin/clients/${slug}/deliverables/${d.id}`,
        { method: 'DELETE' },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message || json.error || 'Delete failed.');
        setBusyId(null);
        return;
      }
      setItems((prev) => prev.filter((x) => x.id !== d.id));
      setBusyId(null);
    } catch (err) {
      setError((err as Error).message || 'Network error.');
      setBusyId(null);
    }
  }

  async function applyTemplate() {
    setError(null);
    setSeedBusy(true);
    try {
      const res = await fetch(
        `/api/admin/clients/${slug}/deliverables`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ applyTemplate: true, year_month: month }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message || json.error || 'Seed failed.');
        setSeedBusy(false);
        return;
      }
      setSeedBusy(false);
      await refresh();
    } catch (err) {
      setError((err as Error).message || 'Network error.');
      setSeedBusy(false);
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!newTitle.trim()) return;
    setAddBusy(true);
    try {
      const res = await fetch(
        `/api/admin/clients/${slug}/deliverables`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title: newTitle.trim(),
            type: newType,
            year_month: month,
          }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message || json.error || 'Add failed.');
        setAddBusy(false);
        return;
      }
      setItems((prev) => [...prev, json.deliverable as Deliverable]);
      setNewTitle('');
      setNewType('other');
      setAdding(false);
      setAddBusy(false);
    } catch (err) {
      setError((err as Error).message || 'Network error.');
      setAddBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Monthly deliverables</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {items.length === 0
              ? 'No items yet for this month.'
              : `${completedCount} of ${items.length} complete`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {items.length === 0 && hasTemplate && (
            <button
              type="button"
              onClick={applyTemplate}
              disabled={seedBusy}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {seedBusy ? 'Seeding…' : 'Apply tier template'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="rounded-lg bg-[var(--color-navy-900)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
          >
            {adding ? 'Cancel' : '+ Add'}
          </button>
        </div>
      </div>

      {adding && (
        <form onSubmit={addItem} className="mt-4 flex flex-wrap items-end gap-3 rounded-lg bg-slate-50 p-3">
          <div className="flex-1 min-w-[180px]">
            <label htmlFor="new-deliverable-title" className="block text-xs font-medium text-slate-700">
              Title
            </label>
            <input
              id="new-deliverable-title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. May newsletter"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="new-deliverable-type" className="block text-xs font-medium text-slate-700">
              Type
            </label>
            <select
              id="new-deliverable-type"
              value={newType}
              onChange={(e) => setNewType(e.target.value as DeliverableType)}
              className="mt-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
            >
              {(Object.keys(TYPE_LABELS) as DeliverableType[]).map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={addBusy || !newTitle.trim()}
            className="rounded-md bg-[var(--color-navy-900)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {addBusy ? 'Adding…' : 'Add'}
          </button>
        </form>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800">
          {error}
        </div>
      )}

      {items.length === 0 && !adding ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          {hasTemplate
            ? 'Apply the tier template to seed this month, or add an item manually.'
            : 'Add an item to start tracking deliverables for this month.'}
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {items.map((d) => {
            const done = !!d.completed_at;
            return (
              <li key={d.id} className="flex items-start gap-3 py-3">
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => toggle(d)}
                  disabled={busyId === d.id || pending}
                  className="mt-1 h-4 w-4 cursor-pointer accent-[var(--color-navy-900)]"
                  aria-label={`Mark ${d.title} ${done ? 'incomplete' : 'complete'}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className={`text-sm font-medium ${done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {d.title}
                    </span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_COLOURS[d.type]}`}>
                      {TYPE_LABELS[d.type]}
                    </span>
                    {done && (
                      <span className="text-xs text-slate-400">
                        Completed {new Date(d.completed_at!).toLocaleDateString('en-GB')}
                      </span>
                    )}
                  </div>
                  {d.notes && (
                    <p className="mt-0.5 text-xs text-slate-500">{d.notes}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(d)}
                  disabled={busyId === d.id}
                  aria-label={`Delete ${d.title}`}
                  className="shrink-0 rounded p-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-700"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
