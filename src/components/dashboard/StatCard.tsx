export function StatCard({
  label,
  value,
  hint,
  small,
}: {
  label: string;
  value: string | number;
  hint?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div
        className={`mt-2 font-semibold text-[var(--color-navy-900)] ${
          small ? 'text-base' : 'text-3xl'
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}
