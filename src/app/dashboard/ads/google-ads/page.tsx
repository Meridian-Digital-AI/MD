import Link from 'next/link';
import { getCurrentClient } from '@/lib/dashboard/getCurrentClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCampaigns, type CampaignSummary } from '@/lib/google-ads';

// Always render fresh — campaign data changes constantly, no caching.
export const dynamic = 'force-dynamic';

export default async function GoogleAdsCampaignsPage() {
  const ctx = await getCurrentClient({ requireSection: 'ads-view' });
  const supabase = await createSupabaseServerClient();

  const { data: connection } = await supabase
    .from('ad_connections')
    .select('status, account_label, external_account_id')
    .eq('client_id', ctx.client.id)
    .eq('provider', 'google_ads')
    .maybeSingle();

  // Not connected at all → punt them back to the connect flow
  if (!connection || connection.status !== 'connected') {
    return (
      <NotConnectedState />
    );
  }

  // Connected, but admin hasn't filled in the customer_id yet
  if (!connection.external_account_id) {
    return (
      <PendingIdState accountLabel={connection.account_label} />
    );
  }

  let campaigns: CampaignSummary[] = [];
  let error: string | null = null;

  try {
    campaigns = await getCampaigns(connection.external_account_id);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error fetching campaigns.';
  }

  const totals = campaigns.reduce(
    (acc, c) => ({
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      cost: acc.cost + c.costGbp,
      conversions: acc.conversions + c.conversions,
    }),
    { impressions: 0, clicks: 0, cost: 0, conversions: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <Link href="/dashboard/ads" className="text-sm text-slate-500 hover:text-slate-900">
            ← All ads
          </Link>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-navy-900)]">
            Google Ads
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {connection.account_label
              ? `${connection.account_label} · ${formatCustomerId(connection.external_account_id)}`
              : formatCustomerId(connection.external_account_id)}
            {' · last 7 days'}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-medium">Couldn&rsquo;t fetch campaigns</p>
          <pre className="mt-2 whitespace-pre-wrap break-all text-xs">{error}</pre>
        </div>
      )}

      {!error && campaigns.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">No active campaigns in the last 7 days.</p>
          <p className="mt-1 text-xs text-slate-400">
            New campaigns appear here within an hour of going live.
          </p>
        </div>
      )}

      {!error && campaigns.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Impressions" value={totals.impressions.toLocaleString()} />
            <StatCard label="Clicks" value={totals.clicks.toLocaleString()} />
            <StatCard label="Spend" value={`£${totals.cost.toFixed(2)}`} />
            <StatCard label="Conversions" value={totals.conversions.toFixed(0)} />
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Campaign</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Budget/day</th>
                  <th className="px-4 py-3 text-right font-medium">Impressions</th>
                  <th className="px-4 py-3 text-right font-medium">Clicks</th>
                  <th className="px-4 py-3 text-right font-medium">CTR</th>
                  <th className="px-4 py-3 text-right font-medium">Spend</th>
                  <th className="px-4 py-3 text-right font-medium">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-[var(--color-navy-900)]">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600">{c.channelType}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      £{c.dailyBudgetGbp.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {c.impressions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {c.clicks.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {(c.ctr * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      £{c.costGbp.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {c.conversions.toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Inline components
// ────────────────────────────────────────────────────────────────────────

function NotConnectedState() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/ads" className="text-sm text-slate-500 hover:text-slate-900">
          ← All ads
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--color-navy-900)]">Google Ads</h2>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <p className="text-slate-700">
          Your Google Ads account isn&rsquo;t connected yet.
        </p>
        <Link
          href="/dashboard/connect/google-ads"
          className="mt-4 inline-block rounded-lg bg-[var(--color-blue-600)] px-4 py-2 text-sm font-semibold text-white"
        >
          Connect Google Ads
        </Link>
      </div>
    </div>
  );
}

function PendingIdState({ accountLabel }: { accountLabel: string | null }) {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/ads" className="text-sm text-slate-500 hover:text-slate-900">
          ← All ads
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--color-navy-900)]">Google Ads</h2>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-medium">Account linked, finalising connection</p>
        <p className="mt-1">
          {accountLabel ? `"${accountLabel}" is linked to our manager account` : 'Your account is linked to our manager account'}
          {', but your account manager is still finalising the connection on our side. Live data appears here usually within an hour.'}
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[var(--color-navy-900)] tabular-nums">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'Active'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'Paused'
        ? 'bg-slate-100 text-slate-600'
        : 'bg-amber-50 text-amber-700';
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      {status}
    </span>
  );
}

function formatCustomerId(id: string): string {
  const digits = id.replace(/\D/g, '');
  if (digits.length !== 10) return id;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}
