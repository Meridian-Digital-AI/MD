'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function MetaConnectionCard({
  configured,
  connectedAs,
  externalUserId,
  connectedAt,
  expiresAt,
  daysLeft,
}: {
  configured: boolean;
  connectedAs: string | null;
  externalUserId: string | null;
  connectedAt: string | null;
  expiresAt: string | null;
  daysLeft: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isConnected = !!connectedAs;

  async function onDisconnect() {
    if (!confirm('Disconnect Meta? Client dashboards will stop showing live ad data.')) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/oauth/meta/disconnect', { method: 'POST' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.message || json.error || 'Disconnect failed.');
        setBusy(false);
        return;
      }
      startTransition(() => router.refresh());
      setBusy(false);
    } catch (err) {
      setError((err as Error).message || 'Network error.');
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Meta Ads</h3>
          <p className="mt-1 text-sm text-slate-600">
            One-time auth that unlocks every ad account in your Meta Business Manager.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {isConnected ? 'Connected' : 'Not connected'}
        </span>
      </div>

      {!configured && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Missing env vars on the server. Set <code className="font-mono">META_APP_ID</code>,{' '}
          <code className="font-mono">META_APP_SECRET</code>, and{' '}
          <code className="font-mono">NEXT_PUBLIC_APP_URL</code>, then redeploy.
        </div>
      )}

      {isConnected && (
        <dl className="mt-4 grid grid-cols-1 gap-2 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Connected as</dt>
            <dd className="font-medium text-slate-800">{connectedAs}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Facebook user ID</dt>
            <dd className="font-mono text-xs text-slate-700">{externalUserId}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Connected on</dt>
            <dd className="text-slate-700">
              {connectedAt ? new Date(connectedAt).toLocaleDateString('en-GB') : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Token expires</dt>
            <dd className="text-slate-700">
              {expiresAt ? `${new Date(expiresAt).toLocaleDateString('en-GB')} (${daysLeft}d)` : '—'}
            </dd>
          </div>
        </dl>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        {!isConnected ? (
          <a
            href="/api/oauth/meta/start"
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
              configured ? 'bg-[var(--color-navy-900)] hover:opacity-90' : 'cursor-not-allowed bg-slate-400'
            }`}
            aria-disabled={!configured}
            onClick={(e) => {
              if (!configured) e.preventDefault();
            }}
          >
            Connect Meta
          </a>
        ) : (
          <>
            <a
              href="/api/oauth/meta/start"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Reconnect
            </a>
            <button
              type="button"
              onClick={onDisconnect}
              disabled={busy || pending}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {busy ? 'Disconnecting…' : 'Disconnect'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
