import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TIER_LABELS, type PackageTier } from '@/lib/dashboard/packageFeatures';
import { computeClientHealth } from '@/lib/dashboard/computeClientHealth';
import type { HealthBreakdown, HealthTrend } from '@/lib/dashboard/healthScore';

const AT_RISK_THRESHOLD = 4;

export default async function AdminHome() {
  const supabase = await createSupabaseServerClient();

  const { data: clients } = await supabase
    .from('clients')
    .select('id, business_name, slug, package_tier, domain, created_at')
    .order('business_name');

  // Pull lead/pageview counts + health scores in parallel
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const counts = await Promise.all(
    (clients ?? []).map(async (c) => {
      const [{ count: leadCount }, { count: pvCount }, health] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true })
          .eq('client_id', c.id).gte('created_at', since),
        supabase.from('pageviews').select('id', { count: 'exact', head: true })
          .eq('client_id', c.id).gte('ts', since),
        computeClientHealth(supabase, c),
      ]);
      return {
        id: c.id,
        leadCount: leadCount ?? 0,
        pvCount: pvCount ?? 0,
        health,
      };
    }),
  );
  const countMap = new Map(counts.map((c) => [c.id, c]));

  // At-risk = score ≤ threshold AND not a brand-new client (those start at 5
  // for neutral reasons, not because they're failing). Sorted worst-first
  // so the most urgent client is at the top.
  const atRisk = (clients ?? [])
    .map((c) => ({ client: c, ctx: countMap.get(c.id) }))
    .filter(
      (x) =>
        x.ctx &&
        !x.ctx.health.isNewClient &&
        x.ctx.health.score <= AT_RISK_THRESHOLD,
    )
    .sort((a, b) => (a.ctx!.health.score - b.ctx!.health.score));

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--color-navy-900)]">All clients</h2>
          <p className="mt-1 text-slate-600">
            Click any client to drill into their dashboard. Health scores are admin-only.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{clients?.length ?? 0} clients</span>
          <Link
            href="/admin/settings"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Settings
          </Link>
          <Link
            href="/admin/clients/new"
            className="rounded-lg bg-[var(--color-navy-900)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
          >
            + New client
          </Link>
        </div>
      </div>

      {atRisk.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold text-red-900">
              ⚠️ Needs attention ({atRisk.length})
            </h3>
            <span className="text-xs text-red-700">
              Score ≤ {AT_RISK_THRESHOLD}
            </span>
          </div>
          <ul className="mt-3 divide-y divide-red-100">
            {atRisk.map(({ client, ctx }) => {
              const weakest = [...ctx!.health.components]
                .filter((c) => c.max > 0)
                .sort((a, b) => a.points / a.max - b.points / b.max)[0];
              return (
                <li key={client.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                  <Link
                    href={`/admin/clients/${client.slug}`}
                    className="flex-1 text-sm font-medium text-red-900 hover:underline"
                  >
                    {client.business_name}
                  </Link>
                  <span className="text-xs text-red-800">
                    {weakest ? weakest.detail : 'Score below threshold'}
                  </span>
                  <span className="rounded-full bg-red-200 px-2 py-0.5 text-xs font-semibold text-red-900">
                    {ctx!.health.score}/10
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(clients ?? []).map((c) => {
          const ct = countMap.get(c.id);
          return (
            <Link
              key={c.id}
              href={`/admin/clients/${c.slug}`}
              className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
            >
              <HealthBadge health={ct?.health ?? null} />
              <h3 className="pr-20 text-base font-semibold text-[var(--color-navy-900)] group-hover:underline">
                {c.business_name}
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">{c.domain ?? 'No domain set'}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {TIER_LABELS[c.package_tier as PackageTier]}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div>
                  <div className="font-semibold text-slate-900">{ct?.leadCount ?? 0}</div>
                  <div>leads (30d)</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{ct?.pvCount ?? 0}</div>
                  <div>pageviews (30d)</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {(clients?.length ?? 0) === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          No clients yet.{' '}
          <Link href="/admin/clients/new" className="font-semibold text-[var(--color-navy-900)] underline">
            Add your first client
          </Link>
          .
        </div>
      )}
    </div>
  );
}

const TREND_GLYPHS: Record<HealthTrend, { glyph: string; tone: string; label: string }> = {
  up:      { glyph: '↑', tone: 'text-emerald-700', label: 'Trending up vs prior 30 days' },
  flat:    { glyph: '→', tone: 'text-slate-500',   label: 'Flat vs prior 30 days' },
  down:    { glyph: '↓', tone: 'text-red-700',     label: 'Trending down vs prior 30 days' },
  neutral: { glyph: '·', tone: 'text-slate-400',   label: 'Not enough data for trend' },
};

function HealthBadge({ health }: { health: HealthBreakdown | null }) {
  const score = health?.score ?? null;
  const trend = health?.trend ?? 'neutral';
  const display = score ?? '—';
  const tone =
    score == null ? 'bg-slate-100 text-slate-500'
      : score >= 8 ? 'bg-emerald-100 text-emerald-800'
      : score >= 5 ? 'bg-amber-100 text-amber-800'
      : 'bg-red-100 text-red-800';
  const trendStyle = TREND_GLYPHS[trend];

  // Tooltip aggregates the breakdown so admin can see "why" without navigating
  const tooltip = health
    ? `Health ${score}/10 · ${trendStyle.label}\n${health.components
        .map((c) => `${c.label}: ${c.points}/${c.max} — ${c.detail}`)
        .join('\n')}`
    : 'Health score (admin-only)';

  return (
    <div
      title={tooltip}
      className="absolute right-3 top-3 flex items-center gap-1.5"
    >
      <span className={`text-base font-semibold ${trendStyle.tone}`} aria-label={trendStyle.label}>
        {trendStyle.glyph}
      </span>
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${tone}`}
      >
        {display}
      </span>
    </div>
  );
}
