'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type AdAccount = {
  id: string;
  account_id: string;
  name: string;
  currency: string;
  active: boolean;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'unconnected' }
  | { status: 'error'; message: string }
  | { status: 'ready'; accounts: AdAccount[] };

export default function MetaAdAccountPicker({
  slug,
  initialId,
}: {
  slug: string;
  initialId: string | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [selected, setSelected] = useState<string>(initialId ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/meta/ad-accounts')
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.connected) {
          setLoad({ status: 'unconnected' });
        } else if (json.error && (!json.accounts || json.accounts.length === 0)) {
          setLoad({ status: 'error', message: json.error });
        } else {
          setLoad({ status: 'ready', accounts: json.accounts || [] });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setLoad({ status: 'error', message: err.message || 'Failed to load' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSave() {
    setSaveError(null);
    setSaveOk(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${slug}/meta-ad-account`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta_ad_account_id: selected || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSaveError(json.message || json.error || 'Save failed.');
        setSaving(false);
        return;
      }
      setSaveOk(true);
      startTransition(() => router.refresh());
      setSaving(false);
    } catch (err) {
      setSaveError((err as Error).message || 'Network error.');
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-semibold text-slate-900">Meta Ads — ad account</h3>
        {initialId && (
          <span className="font-mono text-xs text-slate-500">{initialId}</span>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Pick which ad account in your Meta Business Manager belongs to this client.
      </p>

      <div className="mt-4">
        {load.status === 'loading' && <div className="text-sm text-slate-500">Loading ad accounts…</div>}

        {load.status === 'unconnected' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Meta isn&rsquo;t connected yet.{' '}
            <a href="/admin/settings" className="font-medium underline">
              Connect it in Settings
            </a>{' '}
            to see available ad accounts.
          </div>
        )}

        {load.status === 'error' && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {load.message}
          </div>
        )}

        {load.status === 'ready' && (
          <>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— Not assigned —</option>
              {load.accounts.length === 0 && (
                <option value="" disabled>
                  No ad accounts visible to your Meta user yet
                </option>
              )}
              {load.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.account_id}, {a.currency}){a.active ? '' : ' — inactive'}
                </option>
              ))}
            </select>

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={onSave}
                disabled={saving || selected === (initialId ?? '')}
                className="rounded-lg bg-[var(--color-navy-900)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              {saveOk && <span className="text-xs text-green-700">Saved.</span>}
              {saveError && <span className="text-xs text-red-700">{saveError}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
