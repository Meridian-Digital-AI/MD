import { getCurrentClient } from '@/lib/dashboard/getCurrentClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function LeadsPage() {
  const ctx = await getCurrentClient({ requireSection: 'leads' });
  const supabase = await createSupabaseServerClient();

  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, email, phone, source, status, created_at, message')
    .eq('client_id', ctx.client.id)
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--color-navy-900)]">Leads</h2>
          <p className="mt-1 text-slate-600">
            Everyone who&apos;s submitted the contact form, signed up for emails, or booked through your site.
          </p>
        </div>
        <a
          href={`/api/dashboard/leads/export?client_id=${ctx.client.id}`}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Export CSV
        </a>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(leads ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  No leads yet. They&apos;ll appear here as soon as someone submits your contact form.
                </td>
              </tr>
            )}
            {(leads ?? []).map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500">{new Date(l.created_at).toLocaleDateString('en-GB')}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{l.name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-700">{l.email ?? '—'}</td>
                <td className="px-4 py-3 text-slate-700">{l.phone ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">{l.source ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800">
                    {l.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
