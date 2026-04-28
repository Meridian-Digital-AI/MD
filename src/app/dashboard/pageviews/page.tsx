import { getCurrentClient } from '@/lib/dashboard/getCurrentClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function PageviewsPage() {
  const ctx = await getCurrentClient({ requireSection: 'pageviews' });
  const supabase = await createSupabaseServerClient();

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: views } = await supabase
    .from('pageviews')
    .select('path, ts, country, referrer')
    .eq('client_id', ctx.client.id)
    .gte('ts', since)
    .order('ts', { ascending: false })
    .limit(500);

  // Aggregate top paths
  const counts = new Map<string, number>();
  (views ?? []).forEach((v) => counts.set(v.path, (counts.get(v.path) ?? 0) + 1));
  const topPaths = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--color-navy-900)]">Website views</h2>
        <p className="mt-1 text-slate-600">Last 30 days, broken down by page.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900">Top pages</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {topPaths.length === 0 && <li className="text-slate-400">No traffic recorded yet.</li>}
            {topPaths.map(([path, n]) => (
              <li key={path} className="flex justify-between gap-4">
                <span className="truncate text-slate-700">{path}</span>
                <span className="font-medium text-slate-900">{n}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900">Total views (30d)</h3>
          <div className="mt-4 text-4xl font-semibold text-[var(--color-navy-900)]">
            {(views ?? []).length}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Showing the most recent 500 views. Connect Google Analytics for the full history and
            deeper breakdowns.
          </p>
        </div>
      </div>
    </div>
  );
}
