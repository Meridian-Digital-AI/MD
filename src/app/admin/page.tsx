import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TIER_LABELS, type PackageTier } from '@/lib/dashboard/packageFeatures';

export default async function AdminHome() {
  const supabase = await createSupabaseServerClient();

  const { data: clients } = await supabase
    .from('clients')
    .select('id, business_name, slug, package_tier, domain, health_score, created_at')
    .order('business_name');

  // Pull lead/pageview counts in parallel
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const counts = await Promise.all(
    (clients ?? []).map(async (c) => {
      const [{ count: leadCount }, { count: pvCount }] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true })
          .eq('client_id', c.id).gte('created_at', since),
        supabase.from('pageviews').select('id', { count: 'exact', head: true })
          .eq('client_id', c.id).gte('ts', since),
      ]);
      return { id: c.id, leadCount: leadCount ?? 0, pvCount: pvCount ?? 0 };
    }),
  );
  const countMap = new Map(counts.map((c) => [c.id, c]));

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
            href="/admin/clients/new"
            className="rounded-lg bg-[var(--color-navy-900)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
          >
            + New client
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(clients ?? []).map((c) => {
          const ct = countMap.get(c.id);
          return (
            <Link
              key={c.id}
              href={`/admin/clients/${c.slug}`}
              className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
            >
              <HealthBadge score={c.health_score} />
              <h3 className="pr-12 text-base font-semibold text-[var(--color-navy-900)] group-hover:underline">
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

function HealthBadge({ score }: { score: number | null }) {
  const display = score ?? '—';
  const tone =
    score == null ? 'bg-slate-100 text-slate-500'
      : score >= 8 ? 'bg-emerald-100 text-emerald-800'
      : score >= 5 ? 'bg-amber-100 text-amber-800'
      : 'bg-red-100 text-red-800';
  return (
    <div
      title="Health score (admin-only). 1–10 based on traffic, leads and ad performance."
      className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${tone}`}
    >
      {display}
    </div>
  );
}
