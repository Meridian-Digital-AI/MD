'use client';

import { useRouter } from 'next/navigation';

// Pill-style month switcher. Shows the last 6 calendar months ending on
// the current one. Clicking a pill replaces ?month=YYYY-MM in the URL.

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function lastNMonths(n: number): { ym: string; label: string }[] {
  const out: { ym: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const label = `${MONTH_NAMES[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
    out.push({ ym, label });
  }
  return out;
}

export default function MonthSelector({ slug, current }: { slug: string; current: string }) {
  const router = useRouter();
  const months = lastNMonths(6);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {months.map((m) => {
        const active = m.ym === current;
        return (
          <button
            key={m.ym}
            type="button"
            onClick={() => router.push(`/admin/clients/${slug}/monthly?month=${m.ym}`)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              active
                ? 'bg-[var(--color-navy-900)] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
