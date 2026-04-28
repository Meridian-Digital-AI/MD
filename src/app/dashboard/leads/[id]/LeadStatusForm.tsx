'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

const STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost'] as const;
type Status = (typeof STATUSES)[number];

const LABELS: Record<Status, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
};

export default function LeadStatusForm({ leadId, status, notes }: { leadId: string; status: string; notes: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [currentStatus, setStatus] = useState<Status>(status as Status);
  const [currentNotes, setNotes] = useState(notes);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  async function save(nextStatus: Status, nextNotes: string) {
    setSaveState('saving');
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from('leads')
      .update({ status: nextStatus, notes: nextNotes || null })
      .eq('id', leadId);
    if (error) {
      setSaveState('error');
      return;
    }
    setSaveState('saved');
    startTransition(() => router.refresh());
    setTimeout(() => setSaveState('idle'), 1500);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Status
      </div>
      <div className="space-y-3 px-4 py-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                save(s, currentNotes);
              }}
              className={
                'rounded-lg border px-2 py-1.5 text-xs font-medium transition ' +
                (currentStatus === s
                  ? 'border-[var(--color-blue-600)] bg-[var(--color-blue-600)] text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')
              }
            >
              {LABELS[s]}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Notes (private)</label>
          <textarea
            value={currentNotes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => save(currentStatus, currentNotes)}
            rows={5}
            placeholder="Phoned 14:00, left voicemail…"
            className="block w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm placeholder:text-slate-400 focus:border-[var(--color-blue-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-600)]/20"
          />
        </div>

        <p className="text-xs text-slate-400">
          {saveState === 'saving' && 'Saving…'}
          {saveState === 'saved' && '✓ Saved'}
          {saveState === 'error' && '⚠ Could not save — try again'}
          {saveState === 'idle' && 'Changes save automatically.'}
        </p>
      </div>
    </div>
  );
}
