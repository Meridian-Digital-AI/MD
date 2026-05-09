'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

type Health =
  | { ok: true; status: 'connected'; connectedAs: string; externalUserId: string; adAccountCount: number; activeAdAccounts: number; expiresAt: string | null }
  | { ok: false; status: 'not_connected' }
  | { ok: false; status: 'token_invalid'; error: string };

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
  const [token, setToken] = useState('');
  const [tokenExpiry, setTokenExpiry] = useState<'never' | '60'>('never');
  const [tokenBusy, setTokenBusy] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenSuccess, setTokenSuccess] = useState<string | null>(null);
  const [showOAuth, setShowOAuth] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [health, setHealth] = useState<Health | null>(null);
  const isConnected = !!connectedAs;

  useEffect(() => {
    if (!isConnected) return;
    let cancelled = false;
    fetch('/api/admin/meta/health')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) setHealth(j as Health); })
      .catch(() => { /* leave health null */ });
    return () => { cancelled = true; };
  }, [isConnected]);

  async function onSaveToken(e: React.FormEvent) {
    e.preventDefault();
    setTokenError(null);
    setTokenSuccess(null);
    if (!token.trim()) {
      setTokenError('Paste the access token from Business Manager.');
      return;
    }
    setTokenBusy(true);
    try {
      const res = await fetch('/api/admin/meta/manual-token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          expiresInDays: tokenExpiry === '60' ? 60 : null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTokenError(json.message || json.error || 'Token rejected by Meta.');
        setTokenBusy(false);
        return;
      }
      setTokenSuccess(`Connected as ${json.connectedAs}. ${json.adAccountCount} ad account${json.adAccountCount === 1 ? '' : 's'} visible.`);
      setToken('');
      setTokenBusy(false);
      startTransition(() => router.refresh());
    } catch (err) {
      setTokenError((err as Error).message || 'Network error.');
      setTokenBusy(false);
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
            Paste a long-lived System User token from your Business Manager. Unlocks every ad account assigned to that System User.
          </p>
        </div>
        <StatusPill isConnected={isConnected} health={health} />
      </div>

      {!configured && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Missing env vars on the server. Set <code className="font-mono">META_APP_ID</code>,{' '}
          <code className="font-mono">META_APP_SECRET</code>, and{' '}
          <code className="font-mono">NEXT_PUBLIC_APP_URL</code>, then redeploy.
        </div>
      )}

      {isConnected && (
        <>
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
                {expiresAt ? `${new Date(expiresAt).toLocaleDateString('en-GB')} (${daysLeft}d)` : 'Never'}
              </dd>
            </div>
            {health?.ok && health.status === 'connected' && (
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-slate-500">Ad accounts visible</dt>
                <dd className="text-slate-700">
                  {health.adAccountCount} total · {health.activeAdAccounts} active
                </dd>
              </div>
            )}
          </dl>

          {health && !health.ok && health.status === 'token_invalid' && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <strong>Token revoked.</strong> Meta says: {health.error}. Generate a new System User token and paste it below to reconnect.
            </div>
          )}
        </>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-5 border-t border-slate-200 pt-5">
        <h4 className="text-sm font-semibold text-slate-900">
          {isConnected ? 'Replace token' : 'Connect with a System User token'}
        </h4>

        <button
          type="button"
          onClick={() => setShowInstructions((v) => !v)}
          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900"
        >
          <span>{showInstructions ? '▾' : '▸'}</span>
          How to generate a token (3 minutes inside Business Manager)
        </button>

        {showInstructions && (
          <ol className="mt-2 list-decimal space-y-1 rounded-lg bg-slate-50 p-3 pl-7 text-xs text-slate-700">
            <li>Go to <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener" className="text-blue-700 underline">business.facebook.com → Settings → System Users</a>.</li>
            <li>Click <strong>Add</strong>. Name it <code className="font-mono">meridian-readwrite</code>. Role: <strong>Admin</strong>.</li>
            <li>Open the System User → <strong>Add Assets</strong> → Ad Accounts → tick every client ad account → access type <strong>Manage</strong>.</li>
            <li>Click <strong>Generate New Token</strong> → pick this app → tick <code className="font-mono">ads_read</code>, <code className="font-mono">ads_management</code>, <code className="font-mono">business_management</code>.</li>
            <li>Set token expiry to <strong>Never</strong>. Copy the token and paste it below.</li>
          </ol>
        )}

        <form onSubmit={onSaveToken} className="mt-4 space-y-3">
          <div>
            <label htmlFor="meta-token" className="block text-xs font-medium text-slate-700">
              Access token
            </label>
            <textarea
              id="meta-token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
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
                  name="meta-token-expiry"
                  value="never"
                  checked={tokenExpiry === 'never'}
                  onChange={() => setTokenExpiry('never')}
                />
                Never expires (recommended)
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="meta-token-expiry"
                  value="60"
                  checked={tokenExpiry === '60'}
                  onChange={() => setTokenExpiry('60')}
                />
                60 days
              </label>
            </div>
          </div>

          {tokenError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {tokenError}
            </div>
          )}
          {tokenSuccess && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              {tokenSuccess}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={tokenBusy || !token.trim()}
              className="rounded-lg bg-[var(--color-navy-900)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {tokenBusy ? 'Validating…' : isConnected ? 'Replace token' : 'Connect Meta'}
            </button>
            {isConnected && (
              <button
                type="button"
                onClick={onDisconnect}
                disabled={busy || pending}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {busy ? 'Disconnecting…' : 'Disconnect'}
              </button>
            )}
            <span className="text-xs text-slate-500">
              Token is validated by Meta before saving.
            </span>
          </div>
        </form>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={() => setShowOAuth((v) => !v)}
          className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <span>{showOAuth ? '▾' : '▸'}</span>
          Use Facebook Login instead (only works if our app has passed App Review)
        </button>
        {showOAuth && (
          <div className="mt-3 space-y-2 text-xs text-slate-600">
            <p>
              The OAuth flow needs Meta App Review for <code className="font-mono">ads_management</code> scope, which is pending. Until approved this only works for users who are admins or developers of the Meta app itself.
            </p>
            <a
              href="/api/oauth/meta/start"
              className={`inline-block rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 ${configured ? '' : 'pointer-events-none opacity-40'}`}
            >
              Continue with Facebook
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ isConnected, health }: { isConnected: boolean; health: Health | null }) {
  if (!isConnected) {
    return <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Not connected</span>;
  }
  if (health && !health.ok && health.status === 'token_invalid') {
    return <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">Token revoked</span>;
  }
  return <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Connected</span>;
}
