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
  const [manualOpen, setManualOpen] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [manualExpiry, setManualExpiry] = useState<'never' | '60'>('never');
  const [manualBusy, setManualBusy] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);
  const isConnected = !!connectedAs;

  async function onSubmitManual(e: React.FormEvent) {
    e.preventDefault();
    setManualError(null);
    setManualSuccess(null);
    if (!manualToken.trim()) {
      setManualError('Paste the access token from Business Manager.');
      return;
    }
    setManualBusy(true);
    try {
      const res = await fetch('/api/admin/meta/manual-token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: manualToken.trim(),
          expiresInDays: manualExpiry === '60' ? 60 : null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setManualError(json.message || json.error || 'Token rejected.');
        setManualBusy(false);
        return;
      }
      setManualSuccess(
        `Connected as ${json.connectedAs}. Visible ad accounts: ${json.adAccountCount}.`,
      );
      setManualToken('');
      setManualBusy(false);
      startTransition(() => router.refresh());
    } catch (err) {
      setManualError((err as Error).message || 'Network error.');
      setManualBusy(false);
    }
  }

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

      <div className="mt-6 border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={() => setManualOpen((v) => !v)}
          className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          <span>{manualOpen ? '▾' : '▸'}</span>
          Paste a System User token instead (advanced)
        </button>

        {manualOpen && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-600">
              If the OAuth flow is blocked (e.g. &quot;Feature unavailable&quot;), you can paste a
              long-lived <strong>System User token</strong> generated from a Meta Business Manager.
              Get one at <span className="font-mono text-xs">business.facebook.com</span> →
              Settings → Users → System Users → Generate New Token.
            </p>

            <form onSubmit={onSubmitManual} className="space-y-3">
              <div>
                <label
                  htmlFor="meta-manual-token"
                  className="block text-xs font-medium text-slate-700"
                >
                  Access token
                </label>
                <textarea
                  id="meta-manual-token"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="EAAB… (paste full token)"
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-slate-400 focus:outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-700">Token expiry</span>
                <div className="mt-1 flex gap-4 text-sm text-slate-700">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="meta-manual-expiry"
                      value="never"
                      checked={manualExpiry === 'never'}
                      onChange={() => setManualExpiry('never')}
                    />
                    Never expires (default for System User)
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="meta-manual-expiry"
                      value="60"
                      checked={manualExpiry === '60'}
                      onChange={() => setManualExpiry('60')}
                    />
                    60 days
                  </label>
                </div>
              </div>

              {manualError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {manualError}
                </div>
              )}
              {manualSuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  {manualSuccess}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={manualBusy || !manualToken.trim()}
                  className="rounded-lg bg-[var(--color-navy-900)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {manualBusy ? 'Validating…' : 'Save token'}
                </button>
                <span className="text-xs text-slate-500">
                  Token is validated by Meta before saving.
                </span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
