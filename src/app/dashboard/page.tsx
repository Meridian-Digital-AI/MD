import { getCurrentClient } from '@/lib/dashboard/getCurrentClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { sectionsForTier, SECTION_LABELS } from '@/lib/dashboard/packageFeatures';
import { StatCard } from '@/components/dashboard/StatCard';
import ClientDeliverablesPanel from '@/components/dashboard/ClientDeliverablesPanel';
import ClientOnboardingChecklist from '@/components/dashboard/ClientOnboardingChecklist';

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default async function OverviewPage() {
  const ctx = await getCurrentClient({ requireSection: 'overview' });
  const supabase = await createSupabaseServerClient();

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const month = currentYearMonth();
  const [leads30, pageviews30, metaThisMonth] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true })
      .eq('client_id', ctx.client.id).gte('created_at', since),
    supabase.from('pageviews').select('id', { count: 'exact', head: true })
      .eq('client_id', ctx.client.id).gte('ts', since),
    supabase
      .from('client_meta_monthly')
      .select('spend, impressions, clicks')
      .eq('client_id', ctx.client.id)
      .eq('year_month', month)
      .maybeSingle(),
  ]);

  const meta = metaThisMonth.data as { spend: number | null; impressions: number | null; clicks: number | null } | null;
  const visibleSections = sectionsForTier(ctx.client.package_tier);

  // Show onboarding checklist until: tracking is flowing AND a lead has come
  // through AND the website is live. Brand-new clients without a site (or
  // with a site we're still building) see it from day one.
  const hasAnyPageviews = (pageviews30.count ?? 0) > 0;
  const hasAnyLeads = (leads30.count ?? 0) > 0;
  const websiteLive = ctx.client.website_status === 'live';
  const showOnboarding = !hasAnyPageviews || !hasAnyLeads || !websiteLive;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--color-navy-900)]">
          Welcome back, {ctx.client.business_name}
        </h2>
        <p className="mt-1 text-slate-600">
          Here&apos;s what&apos;s happened in the last 30 days.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="New leads (30d)" value={leads30.count ?? 0} />
        <StatCard label="Website views (30d)" value={pageviews30.count ?? 0} />
        <StatCard
          label="Ad spend (this month)"
          value={
            meta?.spend == null
              ? '—'
              : `£${meta.spend.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`
          }
          hint={meta?.spend == null ? 'Updated by your team monthly' : undefined}
        />
        <StatCard label="Domain" value={ctx.client.domain ?? 'Not set'} small />
      </div>

      {showOnboarding && (
        <ClientOnboardingChecklist
          clientSlug={ctx.client.slug}
          businessName={ctx.client.business_name}
          hasPageviews={hasAnyPageviews}
          hasLeads={hasAnyLeads}
          websiteStatus={ctx.client.website_status}
        />
      )}

      <ClientDeliverablesPanel clientId={ctx.client.id} />

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">Available in your package</h3>
        <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600 md:grid-cols-3">
          {visibleSections.map((s) => (
            <li key={s} className="rounded-md bg-slate-50 px-3 py-2">{SECTION_LABELS[s]}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
