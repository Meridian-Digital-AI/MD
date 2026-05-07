'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function GoogleConnectionCard({
  configured,
  connectedAs,
  externalUserId,
  connectedAt,
  scope,
}: {
  configured: boolean;
  connectedAs: string | null;
  externalUserId: string | null;
  connectedAt: string | null;
  scope: string | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isConnected = !!connectedAs;

  async function onDisconnect() {
    if (
      !confirm(
        'Disconnect Google? Client dashboards will stop showing live Google Analytics data.',
      )
    ) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/oauth/google/disconnect', { method: 'POST' });
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
        <h3 className="text-sm font-semibold text-slate-900">
          Google — Analytics 4
        </h3>
        {isConnected && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            Connected
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        One agency-level connection. The connected Google account must have
        viewer access to every client GA4 property — paste each client&rsquo;s
        property ID on their admin page so the dashboard knows where to read.
      </p>

      {!configured && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Google credentials aren&rsquo;t configured. Set{' '}
          <code className="font-mono text-xs">GOOGLE_OAUTH_CLIENT_ID</code>,{' '}
          <code className="font-mono text-xs">GOOGLE_OAUTH_CLIENT_SECRET</code>, and{' '}
          <code className="font-mono text-xs">GOOGLE_OAUTH_REDIRECT_URI</code> in
          Vercel env, then redeploy.
        </div>
      )}

      {configured && !isConnected && (
        <div className="mt-4">
          <a
            href="/api/oauth/google/start"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-navy-900)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Connect Google
          </a>
        </div>
      )}

      {isConnected && (
        <div className="mt-4 space-y-3">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
            <Field label="Connected as" value={connectedAs} />
            <Field label="Google user ID" value={externalUserId} mono />
            <Field
              label="Connected at"
              value={connectedAt ? new Date(connectedAt).toLocaleString('en-GB') : null}
            />
            <Field label="Scopes" value={scope} mono small />
          </dl>

          <div className="flex items-center gap-3 pt-1">
            <a
              href="/api/oauth/google/start"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            >
              Reconnect
            </a>
            <button
              type="button"
              onClick={onDisconnect}
              disabled={busy}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {busy ? 'Disconnecting…' : 'Disconnect'}
            </button>
            {error && <span className="text-xs text-red-700">{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
  small = false,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
  small?: boolean;
}) {
  if (!value) return null;
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={`text-slate-800 ${mono ? 'font-mono' : ''} ${
          small ? 'truncate text-[11px]' : ''
        }`}
        title={small ? value : undefined}
      >
        {value}
      </dd>
    </>
  );
}
