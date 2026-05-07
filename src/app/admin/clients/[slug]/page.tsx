import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { TIER_LABELS, sectionsForTier, SECTION_LABELS, type PackageTier } from '@/lib/dashboard/packageFeatures';
import { StatCard } from '@/components/dashboard/StatCard';
import { computeClientHealth } from '@/lib/dashboard/computeClientHealth';
import ClientApiKeyCard from './ClientApiKeyCard';
import RecentLeadsList from './RecentLeadsList';
import MetaAdAccountPicker from './MetaAdAccountPicker';
import MetaInsightsPanel from './MetaInsightsPanel';
import PlatformIdsCard from './PlatformIdsCard';
import WebsiteStatusCard from './WebsiteStatusCard';

export default async function AdminClientPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: client } = await supabase
    .from('clients')
    .select('id, business_name, slug, package_tier, domain, health_score, health_score_notes, created_at, api_key, meta_ad_account_id, google_ads_customer_id, ga4_property_id, website_status')
    .eq('slug', slug)
    .single();
  if (!client) notFound();

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ count: leadCount }, { count: pvCount }, { data: recentLeads }, health] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true })
      .eq('client_id', client.id).gte('created_at', since),
    supabase.from('pageviews').select('id', { count: 'exact', head: true })
      .eq('client_id', client.id).gte('ts', since),
    supabase.from('leads').select('id, name, email, status, created_at, source')
      .eq('client_id', client.id).order('created_at', { ascending: false }).limit(10),
    computeClientHealth(supabase, client),
  ]);

  // Persist the freshly-computed score back to the clients row so other
  // queries can read a cached value without recomputing. Best-effort —
  // if it fails we don't want to break the page render.
  if (health.score !== client.health_score) {
    const admin = createSupabaseAdminClient();
    await admin.from('clients').update({ health_score: health.score }).eq('id', client.id);
  }

  const tier = client.package_tier as PackageTier;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-900">
          ← All clients
        </Link>
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl font-semibold text-[var(--color-navy-900)]">
              {client.business_name}
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {TIER_LABELS[tier]}
            </span>
            <span className="text-xs text-slate-400">{client.domain ?? 'No domain'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/clients/${client.slug}/monthly`}
              className="rounded-lg bg-[var(--color-navy-900)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Monthly view
            </Link>
            <Link
              href={`/admin/clients/${client.slug}/edit`}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            >
              Edit
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Health score" value={`${health.score}/10`} hint={health.isNewClient ? 'New client — neutral default' : 'Computed live from signals'} />
        <StatCard label="Leads (30d)" value={leadCount ?? 0} />
        <StatCard label="Pageviews (30d)" value={pvCount ?? 0} />
        <StatCard label="Active campaigns" value="—" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h3 className="text-sm font-semibold text-slate-900">Health score breakdown</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                health.trend === 'up'
                  ? 'bg-emerald-100 text-emerald-800'
                  : health.trend === 'down'
                  ? 'bg-red-100 text-red-800'
                  : health.trend === 'flat'
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
              title={health.trendDetail}
            >
              {health.trend === 'up' && '↑ Up'}
              {health.trend === 'down' && '↓ Down'}
              {health.trend === 'flat' && '→ Flat'}
              {health.trend === 'neutral' && '· Neutral'}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Updated {new Date(health.computedAt).toLocaleString('en-GB')}
          </span>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {health.components.map((c) => (
            <li key={c.key} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
              <div>
                <div className="font-medium text-slate-700">{c.label}</div>
                <div className="text-xs text-slate-500">{c.detail}</div>
              </div>
              <div className="shrink-0 text-right text-sm font-semibold text-slate-900">
                {c.points}<span className="text-slate-400"> / {c.max}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900">Recent leads</h3>
          <div className="mt-3">
            <RecentLeadsList leads={recentLeads ?? []} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900">Sections this client sees</h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            {sectionsForTier(tier).map((s) => (
              <li key={s}>• {SECTION_LABELS[s]}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MetaAdAccountPicker slug={client.slug} initialId={client.meta_ad_account_id ?? null} />
        <MetaInsightsPanel metaAdAccountId={client.meta_ad_account_id ?? null} />
      </div>

      <PlatformIdsCard
        slug={client.slug}
        initialGoogleAds={client.google_ads_customer_id ?? null}
        initialGa4={client.ga4_property_id ?? null}
      />

      <WebsiteStatusCard
        slug={client.slug}
        initial={(client.website_status ?? 'live') as 'live' | 'in_progress' | 'none'}
      />

      {client.api_key && <ClientApiKeyCard slug={client.slug} apiKey={client.api_key} />}
    </div>
  );
}
