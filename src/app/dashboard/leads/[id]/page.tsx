import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentClient } from '@/lib/dashboard/getCurrentClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import LeadStatusForm from './LeadStatusForm';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getCurrentClient({ requireSection: 'leads' });
  const supabase = await createSupabaseServerClient();

  const { data: lead } = await supabase
    .from('leads')
    .select('id, client_id, name, email, phone, message, source, source_page, referrer, utm_source, utm_medium, utm_campaign, utm_term, utm_content, status, notes, created_at')
    .eq('id', id)
    .eq('client_id', ctx.client.id)
    .maybeSingle();

  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/leads" className="text-sm text-[var(--color-blue-600)] hover:underline">
          ← Back to all leads
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--color-navy-900)]">{lead.name ?? 'Unnamed lead'}</h2>
        <p className="mt-1 text-sm text-slate-500">
          Submitted {new Date(lead.created_at).toLocaleString('en-GB')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card title="Message">
            {lead.message ? (
              <p className="whitespace-pre-wrap text-sm text-slate-800">{lead.message}</p>
            ) : (
              <p className="text-sm text-slate-400">No message provided.</p>
            )}
          </Card>

          <Card title="Contact">
            <dl className="divide-y divide-slate-100 text-sm">
              <Row label="Name" value={lead.name} />
              <Row label="Email" value={lead.email} link={lead.email ? `mailto:${lead.email}` : null} />
              <Row label="Phone" value={lead.phone} link={lead.phone ? `tel:${lead.phone}` : null} />
            </dl>
          </Card>

          <Card title="Attribution">
            <dl className="divide-y divide-slate-100 text-sm">
              <Row label="Source" value={lead.source} />
              <Row label="Page" value={lead.source_page} />
              <Row label="Referrer" value={lead.referrer} />
              <Row label="UTM source" value={lead.utm_source} />
              <Row label="UTM medium" value={lead.utm_medium} />
              <Row label="UTM campaign" value={lead.utm_campaign} />
              <Row label="UTM term" value={lead.utm_term} />
              <Row label="UTM content" value={lead.utm_content} />
            </dl>
          </Card>
        </div>

        <div className="space-y-6">
          <LeadStatusForm leadId={lead.id} status={lead.status} notes={lead.notes ?? ''} />
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function Row({ label, value, link }: { label: string; value: string | null; link?: string | null }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="col-span-2 break-all text-slate-900">
        {value ? (link ? <a href={link} className="text-[var(--color-blue-600)] hover:underline">{value}</a> : value) : <span className="text-slate-400">—</span>}
      </dd>
    </div>
  );
}
