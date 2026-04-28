import { getCurrentClient } from '@/lib/dashboard/getCurrentClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TIER_LABELS } from '@/lib/dashboard/packageFeatures';
import LeadSnippet from './LeadSnippet';

export default async function SettingsPage() {
  const ctx = await getCurrentClient({ requireSection: 'settings' });
  const supabase = await createSupabaseServerClient();

  const { data: extra } = await supabase
    .from('clients')
    .select('api_key')
    .eq('id', ctx.client.id)
    .single();

  const apiKey = extra?.api_key as string | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--color-navy-900)]">Settings</h2>
        <p className="mt-1 text-slate-600">Your account and business details.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <dl className="divide-y divide-slate-100">
          <Row label="Business name" value={ctx.client.business_name} />
          <Row label="Domain" value={ctx.client.domain ?? '—'} />
          <Row label="Package" value={TIER_LABELS[ctx.client.package_tier]} />
          <Row label="Login email" value={ctx.user.email} />
        </dl>
      </div>

      {apiKey && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-[var(--color-navy-900)]">Lead capture snippet</h3>
          <p className="mt-1 text-sm text-slate-600">
            Paste this script into your website and forms anywhere on the site will automatically post to your dashboard.
            Works on Webflow, Squarespace, WordPress, plain HTML — anywhere you can add a script tag.
          </p>
          <LeadSnippet slug={ctx.client.slug} apiKey={apiKey} />
        </div>
      )}

      <p className="text-xs text-slate-400">
        Need to change anything? Drop us a note at{' '}
        <a className="underline" href="mailto:wandj@meridian-digital-partners.com">
          wandj@meridian-digital-partners.com
        </a>
        .
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="col-span-2 text-slate-900">{value}</dd>
    </div>
  );
}
