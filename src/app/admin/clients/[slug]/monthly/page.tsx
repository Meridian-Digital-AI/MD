// Monthly view — per-client per-month rollup of metrics + deliverables.
//
// Query: ?month=YYYY-MM (default: current calendar month, UTC)
// Reads:
//   - leads count for the month
//   - pageviews count for the month
//   - Meta spend / impressions / clicks for the month (if ad account assigned)
// Writes (via inline panel): client_deliverables checklist.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { TIER_LABELS, type PackageTier } from '@/lib/dashboard/packageFeatures';
import { templatesForTier, type DeliverableType } from '@/lib/dashboard/deliverableTemplates';
import { getAgencyMetaConnection } from '@/lib/meta/connection';
import { fetchMetaInsights } from '@/lib/meta/api';
import { StatCard } from '@/components/dashboard/StatCard';
import MonthSelector from './MonthSelector';
import DeliverablesPanel from './DeliverablesPanel';
import ManualMetaEntryCard from './ManualMetaEntryCard';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function isValidYearMonth(s: string): boolean {
  return /^[0-9]{4}-(0[1-9]|1[0-2])$/.test(s);
}

// Returns ISO start (inclusive) and end (exclusive) for the given month,
// in UTC. Used for both Supabase (timestamptz) and Meta API (YYYY-MM-DD).
function monthRange(ym: string): { startISO: string; endISO: string; sinceDay: string; untilDay: string; label: string } {
  const [yStr, mStr] = ym.split('-');
  const year = Number(yStr);
  const month = Number(mStr); // 1-12
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(end.getTime() - 1);
  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    sinceDay: start.toISOString().slice(0, 10),
    untilDay: lastDay.toISOString().slice(0, 10),
    label: `${MONTH_NAMES[month - 1]} ${year}`,
  };
}

export default async function MonthlyClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { slug } = await params;
  const { month: rawMonth } = await searchParams;
  const month = rawMonth && isValidYearMonth(rawMonth) ? rawMonth : currentYearMonth();
  const range = monthRange(month);

  const supabase = await createSupabaseServerClient();
  const { data: client } = await supabase
    .from('clients')
    .select('id, business_name, slug, package_tier, domain, meta_ad_account_id')
    .eq('slug', slug)
    .single();
  if (!client) notFound();

  const tier = client.package_tier as PackageTier;
  const hasTemplate = templatesForTier(tier).length > 0;

  // Run metrics + deliverables fetch in parallel.
  const admin = createSupabaseAdminClient();
  const [leadsRes, pvRes, deliverablesRes, metaConn, manualMetaRes] = await Promise.all([
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .gte('created_at', range.startISO)
      .lt('created_at', range.endISO),
    supabase
      .from('pageviews')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .gte('ts', range.startISO)
      .lt('ts', range.endISO),
    admin
      .from('client_deliverables')
      .select('id, title, type, notes, order_index, completed_at')
      .eq('client_id', client.id)
      .eq('year_month', month)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true }),
    getAgencyMetaConnection(),
    admin
      .from('client_meta_monthly')
      .select('spend, impressions, clicks, notes, updated_at, updated_by')
      .eq('client_id', client.id)
      .eq('year_month', month)
      .maybeSingle(),
  ]);

  const leadCount = leadsRes.count ?? 0;
  const pvCount = pvRes.count ?? 0;
  const deliverables = (deliverablesRes.data ?? []).map((d) => ({
    id: d.id as string,
    title: d.title as string,
    type: d.type as DeliverableType,
    notes: (d.notes as string | null) ?? null,
    order_index: d.order_index as number,
    completed_at: (d.completed_at as string | null) ?? null,
  }));

  // Meta numbers — manual-entry table is source of truth.
  // Only fall back to live API if no manual row exists AND Meta is connected.
  // (In practice the live API path is gated by Tech Provider verification, so
  // for now manual entry is effectively the only source.)
  const manualMeta = manualMetaRes.data as {
    spend: number | null;
    impressions: number | null;
    clicks: number | null;
    notes: string | null;
    updated_at: string;
    updated_by: string | null;
  } | null;

  let metaSpend: number | null = null;
  let metaImpressions: number | null = null;
  let metaClicks: number | null = null;
  let metaError: string | null = null;
  let metaSource: 'manual' | 'api' | null = null;

  if (manualMeta && (manualMeta.spend != null || manualMeta.impressions != null || manualMeta.clicks != null)) {
    metaSpend = manualMeta.spend;
    metaImpressions = manualMeta.impressions;
    metaClicks = manualMeta.clicks;
    metaSource = 'manual';
  } else if (metaConn && client.meta_ad_account_id) {
    try {
      const ins = await fetchMetaInsights(metaConn.access_token, client.meta_ad_account_id, {
        since: range.sinceDay,
        until: range.untilDay,
      });
      if (ins) {
        metaSpend = ins.spend;
        metaImpressions = ins.impressions;
        metaClicks = ins.clicks;
        metaSource = 'api';
      } else {
        metaSpend = 0;
        metaSource = 'api';
      }
    } catch (err) {
      metaError = (err as Error).message || 'Meta API error';
    }
  }

  // Resolve updater email for the entry-card initial value.
  let updatedByEmail: string | null = null;
  if (manualMeta?.updated_by) {
    const { data: u } = await admin.from('users').select('email').eq('id', manualMeta.updated_by).maybeSingle();
    updatedByEmail = (u?.email as string | undefined) ?? null;
  }

  const cpl =
    metaSpend !== null && leadCount > 0 ? metaSpend / leadCount : null;

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/admin/clients/${client.slug}`} className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to {client.business_name}
        </Link>
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl font-semibold text-[var(--color-navy-900)]">
              {client.business_name}
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {TIER_LABELS[tier]}
            </span>
            <span className="text-sm text-slate-500">— {range.label}</span>
          </div>
          <a
            href={`/api/admin/clients/${client.slug}/monthly/pdf?month=${month}`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Download PDF
          </a>
        </div>
      </div>

      <MonthSelector slug={client.slug} current={month} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Leads" value={leadCount} />
        <StatCard label="Pageviews" value={pvCount} />
        <StatCard
          label="Ad spend"
          value={
            metaSpend === null
              ? '—'
              : `£${metaSpend.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`
          }
          hint={
            metaError
              ? metaError
              : metaSource === 'manual'
              ? 'Manually entered'
              : metaSource === 'api'
              ? 'From Meta API'
              : 'Type numbers in below'
          }
        />
        <StatCard
          label="Cost per lead"
          value={cpl === null ? '—' : `£${cpl.toFixed(2)}`}
          hint={cpl === null && leadCount === 0 ? 'No leads in month' : undefined}
        />
      </div>

      {(metaImpressions !== null || metaClicks !== null) && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900">Meta Ads — {range.label}</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Impressions" value={(metaImpressions ?? 0).toLocaleString('en-GB')} />
            <Stat label="Clicks" value={(metaClicks ?? 0).toLocaleString('en-GB')} />
            <Stat
              label="CTR"
              value={
                metaImpressions && metaImpressions > 0
                  ? `${(((metaClicks ?? 0) / metaImpressions) * 100).toFixed(2)}%`
                  : '—'
              }
            />
            <Stat
              label="CPC"
              value={
                metaClicks && metaClicks > 0 && metaSpend !== null
                  ? `£${(metaSpend / metaClicks).toFixed(2)}`
                  : '—'
              }
            />
          </div>
        </div>
      )}

      <ManualMetaEntryCard
        slug={client.slug}
        month={month}
        initial={
          manualMeta
            ? {
                spend: manualMeta.spend,
                impressions: manualMeta.impressions,
                clicks: manualMeta.clicks,
                notes: manualMeta.notes,
                updated_at: manualMeta.updated_at,
                updated_by_email: updatedByEmail,
              }
            : null
        }
      />

      <DeliverablesPanel
        slug={client.slug}
        month={month}
        initial={deliverables}
        hasTemplate={hasTemplate}
      />
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
