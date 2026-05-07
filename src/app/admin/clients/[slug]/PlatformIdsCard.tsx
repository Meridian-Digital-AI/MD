'use client';

// Admin card for stamping the per-client account IDs Joe needs at query
// time. After MCC-linking on Google Ads (or accepting GA4 admin invite)
// you paste the canonical ID here so the dashboard knows which
// sub-account / property to read.
//
// The Meta ad account ID has its own picker (MetaAdAccountPicker) because
// we can list them via the Meta API. Google Ads customer IDs and GA4
// property IDs aren't easily list-able without OAuth flow already in
// place, so they're pasted manually for now.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  slug: string;
  initialGoogleAds: string | null;
  initialGa4: string | null;
}

type Field = 'google_ads_customer_id' | 'ga4_property_id';

export default function PlatformIdsCard({
  slug,
  initialGoogleAds,
  initialGa4,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [googleAds, setGoogleAds] = useState(initialGoogleAds ?? '');
  const [ga4, setGa4] = useState(initialGa4 ?? '');

  // Per-field save state — clearer than one global "saving" because users
  // typically paste one ID at a time, not both together.
  const [saving, setSaving] = useState<Field | null>(null);
  const [savedField, setSavedField] = useState<Field | null>(null);
  const [errField, setErrField] = useState<{ field: Field; message: string } | null>(null);

  async function save(field: Field, value: string) {
    setSaving(field);
    setErrField(null);
    setSavedField(null);
    try {
      const res = await fetch(`/api/admin/clients/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrField({ field, message: json.message || json.error || 'Save failed.' });
        setSaving(null);
        return;
      }
      setSavedField(field);
      startTransition(() => router.refresh());
      setSaving(null);
      // Clear the "Saved." pill after a couple of seconds so subsequent
      // edits don't show a stale confirmation.
      setTimeout(() => setSavedField((prev) => (prev === field ? null : prev)), 2500);
    } catch (err) {
      setErrField({ field, message: (err as Error).message || 'Network error.' });
      setSaving(null);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-slate-900">Platform account IDs</h3>
      <p className="mt-1 text-xs text-slate-500">
        Paste these after the client has linked their accounts (MCC link accepted, GA4 admin
        granted). The dashboard uses them to query the right sub-account on each platform.
      </p>

      <div className="mt-5 space-y-5">
        <Row
          label="Google Ads customer ID"
          hint="10 digits — find it top-right in the Google Ads UI (e.g. 768-732-1878). Dashes are OK."
          placeholder="7687321878"
          value={googleAds}
          onChange={setGoogleAds}
          initial={initialGoogleAds ?? ''}
          saving={saving === 'google_ads_customer_id'}
          saved={savedField === 'google_ads_customer_id'}
          error={
            errField?.field === 'google_ads_customer_id' ? errField.message : null
          }
          onSave={() => save('google_ads_customer_id', googleAds)}
        />

        <Row
          label="GA4 property ID"
          hint="8–12 digits — Admin → Property Settings → top-right (e.g. 498712345). Not the measurement ID."
          placeholder="498712345"
          value={ga4}
          onChange={setGa4}
          initial={initialGa4 ?? ''}
          saving={saving === 'ga4_property_id'}
          saved={savedField === 'ga4_property_id'}
          error={errField?.field === 'ga4_property_id' ? errField.message : null}
          onSave={() => save('ga4_property_id', ga4)}
        />
      </div>
    </div>
  );
}

function Row({
  label,
  hint,
  placeholder,
  value,
  onChange,
  initial,
  saving,
  saved,
  error,
  onSave,
}: {
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  initial: string;
  saving: boolean;
  saved: boolean;
  error: string | null;
  onSave: () => void;
}) {
  const dirty = value.trim() !== initial.trim();

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-xs font-medium text-slate-700">{label}</label>
        {initial && !dirty && (
          <span className="font-mono text-[11px] text-slate-400">stored: {initial}</span>
        )}
      </div>
      <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !dirty}
          className="rounded-lg bg-[var(--color-navy-900)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      <div className="mt-1 h-4 text-[11px]">
        {saved && <span className="text-green-700">Saved.</span>}
        {error && <span className="text-red-700">{error}</span>}
      </div>
    </div>
  );
}
