import { getCurrentClient } from '@/lib/dashboard/getCurrentClient';
import { TIER_LABELS } from '@/lib/dashboard/packageFeatures';

export default async function SettingsPage() {
  const ctx = await getCurrentClient({ requireSection: 'settings' });

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

      <p className="text-xs text-slate-400">
        Need to change anything? Drop us a note at{' '}
        <a className="underline" href="mailto:hello@meridian-digital-partners.com">
          hello@meridian-digital-partners.com
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
