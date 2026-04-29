import Link from 'next/link';
import { getCurrentClient } from '@/lib/dashboard/getCurrentClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { tierAllowsSection } from '@/lib/dashboard/packageFeatures';

export default async function AdsPage() {
  const ctx = await getCurrentClient({ requireSection: 'ads-view' });
  const supabase = await createSupabaseServerClient();

  const { data: connections } = await supabase
    .from('ad_connections')
    .select('provider, status, account_label, connected_at')
    .eq('client_id', ctx.client.id)
    .in('provider', ['meta', 'google_ads']);

  const meta = connections?.find((c) => c.provider === 'meta');
  const google = connections?.find((c) => c.provider === 'google_ads');
  const canManage = tierAllowsSection(ctx.client.package_tier, 'ads-manage');

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--color-navy-900)]">Ads</h2>
          <p className="mt-1 text-slate-600">View campaign performance across Meta and Google Ads.</p>
        </div>
        {canManage && (
          <Link
            href="/dashboard/ads/manage"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Manage campaigns →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ProviderCard
          name="Meta Ads"
          status={meta?.status ?? 'pending'}
          accountLabel={meta?.account_label}
          connectHref="/dashboard/connect/meta"
        />
        <ProviderCard
          name="Google Ads"
          status={google?.status ?? 'pending'}
          accountLabel={google?.account_label}
          connectHref="/dashboard/connect/google-ads"
          viewHref="/dashboard/ads/google-ads"
        />
      </div>
    </div>
  );
}

function ProviderCard({
  name, status, accountLabel, connectHref, viewHref,
}: {
  name: string;
  status: string;
  accountLabel?: string | null;
  connectHref: string;
  viewHref?: string;
}) {
  const connected = status === 'connected';
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--color-navy-900)]">{name}</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            connected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {connected ? 'Connected' : 'Not connected'}
        </span>
      </div>
      {connected ? (
        <>
          <p className="mt-3 text-sm text-slate-600">
            Linked to <strong>{accountLabel}</strong>.
          </p>
          {viewHref ? (
            <Link
              href={viewHref}
              className="mt-4 inline-block rounded-lg bg-[var(--color-blue-600)] px-4 py-2 text-sm font-semibold text-white"
            >
              View campaigns →
            </Link>
          ) : (
            <p className="mt-3 text-xs text-slate-400">
              Live campaign data will appear here in the next release.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mt-3 text-sm text-slate-600">
            Grant read access so we can show your campaign performance here.
          </p>
          <Link
            href={connectHref}
            className="mt-4 inline-block rounded-lg bg-[var(--color-blue-600)] px-4 py-2 text-sm font-semibold text-white"
          >
            Connect {name}
          </Link>
        </>
      )}
    </div>
  );
}
