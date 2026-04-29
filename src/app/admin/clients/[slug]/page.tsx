import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TIER_LABELS, sectionsForTier, SECTION_LABELS, type PackageTier } from '@/lib/dashboard/packageFeatures';
import { StatCard } from '@/components/dashboard/StatCard';
import ClientApiKeyCard from './ClientApiKeyCard';

export default async function AdminClientPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: client } = await supabase
    .from('clients')
    .select('id, business_name, slug, package_tier, domain, health_score, health_score_notes, created_at, api_key')
    .eq('slug', slug)
    .single();
  if (!client) notFound();

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ count: leadCount }, { count: pvCount }, { data: recentLeads }] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true })
      .eq('client_id', client.id).gte('created_at', since),
    supabase.from('pageviews').select('id', { count: 'exact', head: true })
      .eq('client_id', client.id).gte('ts', since),
    supabase.from('leads').select('id, name, email, status, created_at, source')
      .eq('client_id', client.id).order('created_at', { ascending: false }).limit(10),
  ]);

  const tier = client.package_tier as PackageTier;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-900">
          ← All clients
        </Link>
        <div className="mt-2 flex items-baseline gap-3">
          <h2 className="text-2xl font-semibold text-[var(--color-navy-900)]">
            {client.business_name}
          </h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {TIER_LABELS[tier]}
          </span>
          <span className="text-xs text-slate-400">{client.domain ?? 'No domain'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Health score" value={client.health_score ?? '—'} hint="Admin-only · 1–10" />
        <StatCard label="Leads (30d)" value={leadCount ?? 0} />
        <StatCard label="Pageviews (30d)" value={pvCount ?? 0} />
        <StatCard label="Active campaigns" value="—" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900">Recent leads</h3>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {(recentLeads ?? []).length === 0 && (
              <li className="py-4 text-slate-400">No leads yet.</li>
            )}
            {(recentLeads ?? []).map((l) => (
              <li key={l.id} className="flex justify-between gap-3 py-2">
                <span className="text-slate-700">{l.name ?? l.email ?? 'Anonymous'}</span>
                <span className="text-xs text-slate-400">{new Date(l.created_at).toLocaleDateString('en-GB')}</span>
              </li>
            ))}
          </ul>
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

      {client.api_key && <ClientApiKeyCard slug={client.slug} apiKey={client.api_key} />}
    </div>
  );
}
