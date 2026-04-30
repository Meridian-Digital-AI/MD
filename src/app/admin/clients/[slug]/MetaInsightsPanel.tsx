// Server component — fetches live Meta insights for a client and renders
// them, or shows an appropriate empty/error state. Safe to render even when
// Meta isn't connected or no ad account is assigned.

import { getAgencyMetaConnection } from '@/lib/meta/connection';
import { fetchMetaInsights } from '@/lib/meta/api';

export default async function MetaInsightsPanel({
  metaAdAccountId,
}: {
  metaAdAccountId: string | null;
}) {
  if (!metaAdAccountId) {
    return (
      <Card>
        <Header />
        <div className="mt-3 text-sm text-slate-500">
          No ad account assigned yet. Pick one above to see live numbers.
        </div>
      </Card>
    );
  }

  const conn = await getAgencyMetaConnection();
  if (!conn) {
    return (
      <Card>
        <Header />
        <div className="mt-3 text-sm text-amber-800">
          Meta isn&rsquo;t connected. Connect in <a href="/admin/settings" className="underline">Settings</a>.
        </div>
      </Card>
    );
  }

  let insights: Awaited<ReturnType<typeof fetchMetaInsights>> | null = null;
  let error: string | null = null;
  try {
    insights = await fetchMetaInsights(conn.access_token, metaAdAccountId, 'last_30d');
  } catch (err) {
    error = (err as Error).message || 'Meta API error';
  }

  if (error) {
    return (
      <Card>
        <Header />
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800">
          {error}
        </div>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card>
        <Header />
        <div className="mt-3 text-sm text-slate-500">
          No spend in the last 30 days.
        </div>
      </Card>
    );
  }

  const fmt = (n: number) => n.toLocaleString('en-GB', { maximumFractionDigits: 0 });
  const cpm = insights.impressions > 0 ? (insights.spend / insights.impressions) * 1000 : 0;

  return (
    <Card>
      <Header subtitle={`${insights.date_start} → ${insights.date_stop}`} />
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Spend" value={`£${fmt(insights.spend)}`} />
        <Stat label="Impressions" value={fmt(insights.impressions)} />
        <Stat label="Clicks" value={fmt(insights.clicks)} />
        <Stat label="Conversions" value={fmt(insights.conversions)} />
      </div>
      <div className="mt-2 text-xs text-slate-400">
        CPM £{cpm.toFixed(2)}
      </div>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-6">{children}</div>;
}

function Header({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h3 className="text-sm font-semibold text-slate-900">Meta Ads — last 30 days</h3>
      {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}
