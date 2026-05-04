// Read-only "what we shipped this month" panel for the client dashboard.
//
// Reads via the regular server supabase client (not admin) — the RLS
// policy `client_deliverables client read own` ensures the client only
// sees their own row. If RLS denies, we just render the empty state.

import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  TYPE_LABELS,
  TYPE_COLOURS,
  type DeliverableType,
} from '@/lib/dashboard/deliverableTemplates';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
}

export default async function ClientDeliverablesPanel({ clientId }: { clientId: string }) {
  const month = currentYearMonth();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('client_deliverables')
    .select('id, title, type, notes, completed_at, order_index, created_at')
    .eq('client_id', clientId)
    .eq('year_month', month)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    // Quietly hide on RLS / network errors — this is non-critical UI.
    return null;
  }

  const items = (data ?? []) as Array<{
    id: string;
    title: string;
    type: DeliverableType;
    notes: string | null;
    completed_at: string | null;
    order_index: number;
  }>;

  const total = items.length;
  const done = items.filter((i) => i.completed_at).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            What we&rsquo;re shipping this month
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">{monthLabel(month)}</p>
        </div>
        {total > 0 && (
          <span className="text-xs font-medium text-slate-600">
            {done}/{total} done
          </span>
        )}
      </div>

      {total === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          Your retainer items for this month will appear here once we kick things
          off. We update this as we go — you&rsquo;ll see exactly what&rsquo;s
          shipped and what&rsquo;s next.
        </div>
      ) : (
        <>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[var(--color-navy-900)] transition-all"
              style={{ width: `${pct}%` }}
              aria-label={`${pct}% complete`}
            />
          </div>

          <ul className="mt-4 divide-y divide-slate-100">
            {items.map((d) => {
              const completed = !!d.completed_at;
              return (
                <li key={d.id} className="flex items-start gap-3 py-3">
                  <span
                    aria-hidden
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                      completed
                        ? 'bg-[var(--color-navy-900)] text-white'
                        : 'border border-slate-300 text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span
                        className={`text-sm font-medium ${
                          completed ? 'text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {d.title}
                      </span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_COLOURS[d.type]}`}
                      >
                        {TYPE_LABELS[d.type]}
                      </span>
                      {completed && (
                        <span className="text-xs text-slate-400">
                          {new Date(d.completed_at!).toLocaleDateString('en-GB')}
                        </span>
                      )}
                    </div>
                    {d.notes && (
                      <p className="mt-0.5 text-xs text-slate-500">{d.notes}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
