import Link from 'next/link';
import { getCurrentClient } from '@/lib/dashboard/getCurrentClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function AnalyticsPage() {
  const ctx = await getCurrentClient({ requireSection: 'analytics' });
  const supabase = await createSupabaseServerClient();

  const { data: ga } = await supabase
    .from('ad_connections')
    .select('status, account_label, connected_at')
    .eq('client_id', ctx.client.id)
    .eq('provider', 'ga4')
    .maybeSingle();

  const connected = ga?.status === 'connected';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--color-navy-900)]">Analytics</h2>
        <p className="mt-1 text-slate-600">Sessions, conversion rate, top sources — direct from Google Analytics 4.</p>
      </div>

      {!connected ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h3 className="text-lg font-semibold text-[var(--color-navy-900)]">
            Connect Google Analytics
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Once connected we&apos;ll pull sessions, conversions, and top traffic sources directly from
            your GA4 property.
          </p>
          <Link
            href="/dashboard/connect/ga4"
            className="mt-6 inline-block rounded-lg bg-[var(--color-blue-600)] px-5 py-2 font-semibold text-white shadow"
          >
            Connect Google Analytics
          </Link>
          <p className="mt-3 text-xs text-slate-400">
            (Coming in the next release — speak to your account manager and we&apos;ll set this up for you.)
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-600">
            Connected to {ga?.account_label}. Live data charts are added in the next release.
          </p>
        </div>
      )}
    </div>
  );
}
