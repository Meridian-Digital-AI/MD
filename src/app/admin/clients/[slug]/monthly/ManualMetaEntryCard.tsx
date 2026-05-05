'use client';

// Manual Meta numbers entry card — admin types in spend/impressions/clicks
// for the selected month. Replaces live Meta API integration while we're
// blocked behind Tech Provider verification.
//
// Pattern matches DeliverablesPanel — local state + fetch on save, soft
// success indicator below the button.

import { useEffect, useState } from 'react';

interface MetaMonthlyEntry {
  spend: number | null;
  impressions: number | null;
  clicks: number | null;
  notes: string | null;
  updated_at: string;
  updated_by_email: string | null;
}

interface Props {
  slug: string;
  month: string;            // 'YYYY-MM'
  initial: MetaMonthlyEntry | null;
}

export default function ManualMetaEntryCard({ slug, month, initial }: Props) {
  // Track the slug+month combo so editing persists when admin switches months.
  const [spend, setSpend] = useState<string>(initial?.spend != null ? String(initial.spend) : '');
  const [impressions, setImpressions] = useState<string>(
    initial?.impressions != null ? String(initial.impressions) : '',
  );
  const [clicks, setClicks] = useState<string>(initial?.clicks != null ? String(initial.clicks) : '');
  const [notes, setNotes] = useState<string>(initial?.notes ?? '');
  const [meta, setMeta] = useState<{ updated_at: string; updated_by_email: string | null } | null>(
    initial ? { updated_at: initial.updated_at, updated_by_email: initial.updated_by_email } : null,
  );

  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset form when month changes (parent rerenders with new initial).
  useEffect(() => {
    setSpend(initial?.spend != null ? String(initial.spend) : '');
    setImpressions(initial?.impressions != null ? String(initial.impressions) : '');
    setClicks(initial?.clicks != null ? String(initial.clicks) : '');
    setNotes(initial?.notes ?? '');
    setMeta(
      initial
        ? { updated_at: initial.updated_at, updated_by_email: initial.updated_by_email }
        : null,
    );
    setStatus('idle');
    setErrorMsg(null);
  }, [slug, month, initial]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/clients/${slug}/meta-monthly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          spend: spend.trim() === '' ? null : spend,
          impressions: impressions.trim() === '' ? null : impressions,
          clicks: clicks.trim() === '' ? null : clicks,
          notes: notes.trim() === '' ? null : notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(json.message || json.error || 'Save failed.');
        return;
      }
      setMeta({ updated_at: new Date().toISOString(), updated_by_email: null });
      setStatus('saved');
      setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 2500);
      // Refresh server-rendered StatCards/PDF data.
      // Soft refresh — leaves form values intact.
      if (typeof window !== 'undefined') window.location.reload();
    } catch (err) {
      setStatus('error');
      setErrorMsg((err as Error).message || 'Network error.');
    }
  }

  return (
    <form
      onSubmit={onSave}
      className="rounded-xl border border-slate-200 bg-white p-6"
    >
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Meta Ads — manual entry</h3>
          <p className="mt-1 text-xs text-slate-500">
            Type in the totals from Joe&rsquo;s Ads Manager screenshot. Used in the dashboard,
            PDF and emailed monthly report.
          </p>
        </div>
        {meta && (
          <span className="text-xs text-slate-400">
            Last updated {new Date(meta.updated_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
            {meta.updated_by_email ? ` by ${meta.updated_by_email}` : ''}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <NumField
          label="Ad spend (£)"
          value={spend}
          onChange={setSpend}
          placeholder="250.50"
          step="0.01"
        />
        <NumField
          label="Impressions"
          value={impressions}
          onChange={setImpressions}
          placeholder="4823"
          step="1"
        />
        <NumField
          label="Clicks"
          value={clicks}
          onChange={setClicks}
          placeholder="127"
          step="1"
        />
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Notes (internal only — not shown to client)
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g. Q4 push, mostly retargeting"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </label>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={status === 'saving'}
          className="rounded-lg bg-[var(--color-navy-900)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
        {status === 'saved' && <span className="text-xs text-emerald-700">Saved ✓</span>}
        {status === 'error' && errorMsg && (
          <span className="text-xs text-red-600">{errorMsg}</span>
        )}
        <span className="ml-auto text-xs text-slate-400">
          Leave any field blank to clear it.
        </span>
      </div>
    </form>
  );
}

function NumField({
  label,
  value,
  onChange,
  placeholder,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  step: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </label>
  );
}
