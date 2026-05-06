'use client';

// Tiny admin card for switching a client's website lifecycle state.
//
//   live         — normal client, has a working site.
//   in_progress  — we're building it; the client's dashboard shows a
//                  "site in production" banner and suppresses install nags.
//   none         — they have no site and haven't asked us to build one yet.
//
// Joe uses this to flip the flag back to "live" the moment he finishes
// building a client's site, which un-mutes the install-tracking flow.

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Status = 'live' | 'in_progress' | 'none';

const LABELS: Record<Status, { label: string; tone: string; description: string }> = {
  live: {
    label: 'Live',
    tone: 'bg-emerald-100 text-emerald-800',
    description: 'Site is live. Tracking + lead webhook can be installed.',
  },
  in_progress: {
    label: 'Build in progress',
    tone: 'bg-amber-100 text-amber-800',
    description: "We're building their site. Their dashboard shows a 'site in production' banner.",
  },
  none: {
    label: 'No website yet',
    tone: 'bg-slate-200 text-slate-800',
    description: 'They have no site. Their dashboard offers a "build me one" path.',
  },
};

export default function WebsiteStatusCard({
  slug,
  initial,
}: {
  slug: string;
  initial: Status;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<Status>(initial);
  const [saving, setSaving] = useState<Status | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function setStatus(next: Status) {
    if (next === current) return;
    setSaving(next);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/clients/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website_status: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json.message || 'Could not save.');
        setSaving(null);
        return;
      }
      setCurrent(next);
      setSaving(null);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
      router.refresh();
    } catch {
      setErr('Network error.');
      setSaving(null);
    }
  }

  const meta = LABELS[current];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Website status</h3>
          <p className="mt-1 text-xs text-slate-500">{meta.description}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.tone}`}>
          {meta.label}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(['live', 'in_progress', 'none'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            disabled={saving !== null || s === current}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              s === current
                ? 'bg-[var(--color-navy-900)] text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60'
            }`}
          >
            {saving === s ? 'Saving…' : LABELS[s].label}
          </button>
        ))}
      </div>

      {current === 'in_progress' && (
        <p className="mt-3 rounded-md bg-amber-50 p-2 text-[11px] text-amber-900">
          When the build is delivered and tracking is in place, click <strong>Live</strong> to
          un-mute the install flow on their dashboard.
        </p>
      )}

      {savedAt && <p className="mt-2 text-xs text-emerald-700">Saved ✓</p>}
      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
    </div>
  );
}
