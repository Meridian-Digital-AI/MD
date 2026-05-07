// Client-facing analytics page — pulls live GA4 data via the agency
// Google connection. Falls back to a "connect" CTA if either:
//   - The agency hasn't connected Google yet, OR
//   - This client doesn't have a ga4_property_id stamped on their row.

import Link from 'next/link';
import { getCurrentClient } from '@/lib/dashboard/getCurrentClient';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import {
  fetchGa4Headline,
  fetchGa4TopSources,
  getValidAgencyAccessToken,
  type GA4Headline,
  type GA4SourceRow,
} from '@/lib/google/api';

interface AnalyticsState {
  status: 'unconnected_agency' | 'no_property' | 'error' | 'ready';
  message?: string;
  headline?: GA4Headline;
  sources?: GA4SourceRow[];
}

async function loadAnalytics(clientId: string): Promise<AnalyticsState> {
  // Property ID lives on clients — we use the admin client because
  // the page already authenticated the user upstream and this is a
  // single-row read keyed on a client_id we just verified.
  const admin = createSupabaseAdminClient();
  const { data: row } = await admin
    .from('clients')
    .select('ga4_property_id')
    .eq('id', clientId)
    .maybeSingle();
  const propertyId = row?.ga4_property_id ?? null;
  if (!propertyId) {
    return { status: 'no_property' };
  }

  const accessToken = await getValidAgencyAccessToken();
  if (!accessToken) {
    return { status: 'unconnected_agency' };
  }

  try {
    const [headline, sources] = await Promise.all([
      fetchGa4Headline(accessToken, propertyId, 30),
      fetchGa4TopSources(accessToken, propertyId, 30, 5),
    ]);
    return { status: 'ready', headline, sources };
  } catch (err) {
    console.error('[dashboard/analytics] GA4 fetch failed', err);
    return { status: 'error', message: (err as Error).message };
  }
}

export default async function AnalyticsPage() {
  const ctx = await getCurrentClient({ requireSection: 'analytics' });
  const state = await loadAnalytics(ctx.client.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--color-navy-900)]">Analytics</h2>
        <p className="mt-1 text-slate-600">
          Sessions, conversions, and top sources from your Google Analytics 4 property — last 30 days.
        </p>
      </div>

      {state.status === 'unconnected_agency' && (
        <NotReady
          title="Google Analytics isn't connected yet"
          body="Your Meridian Digital account manager will connect Google Analytics once your GA4 property is set up. You'll see live data here as soon as it's wired in."
        />
      )}

      {state.status === 'no_property' && (
        <NotReady
          title="GA4 property not yet linked"
          body="Once your Meridian Digital account manager has admin access to your GA4 property, it'll be linked here and live data will appear automatically."
        />
      )}

      {state.status === 'error' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Couldn&apos;t load Google Analytics data right now. We&rsquo;ve been notified.{' '}
          {state.message && <span className="font-mono text-xs">({state.message})</span>}
        </div>
      )}

      {state.status === 'ready' && state.headline && (
        <Headline headline={state.headline} />
      )}

      {state.status === 'ready' && state.sources && state.sources.length > 0 && (
        <SourcesTable rows={state.sources} />
      )}

      {state.status === 'ready' &&
        state.sources &&
        state.sources.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No traffic in the last 30 days. Once visitors land on your site they&rsquo;ll show up here.
          </div>
        )}
    </div>
  );
}

function Headline({ headline }: { headline: GA4Headline }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Sessions" value={headline.sessions.toLocaleString('en-GB')} />
      <Stat label="Users" value={headline.totalUsers.toLocaleString('en-GB')} />
      <Stat label="Conversions" value={headline.conversions.toLocaleString('en-GB')} />
      <Stat
        label="Conversion rate"
        value={
          headline.conversionRate == null
            ? '—'
            : `${(headline.conversionRate * 100).toFixed(1)}%`
        }
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-3xl font-semibold text-[var(--color-navy-900)]">
        {value}
      </div>
    </div>
  );
}

function SourcesTable({ rows }: { rows: GA4SourceRow[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-slate-900">Top traffic sources</h3>
      <p className="mt-1 text-xs text-slate-500">Where your visitors came from this month.</p>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="pb-2 font-semibold">Source</th>
            <th className="pb-2 text-right font-semibold">Sessions</th>
            <th className="pb-2 text-right font-semibold">Conversions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.source} className="border-b border-slate-100 last:border-0">
              <td className="py-2 font-medium text-slate-800">{r.source}</td>
              <td className="py-2 text-right text-slate-700">
                {r.sessions.toLocaleString('en-GB')}
              </td>
              <td className="py-2 text-right text-slate-700">
                {r.conversions.toLocaleString('en-GB')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NotReady({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 className="text-lg font-semibold text-[var(--color-navy-900)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{body}</p>
      <p className="mt-3 text-xs text-slate-400">
        Need to chase it up?{' '}
        <Link
          href="mailto:hello@meridian-digital-partners.com"
          className="text-[var(--color-blue-600)] underline"
        >
          hello@meridian-digital-partners.com
        </Link>
      </p>
    </div>
  );
}
