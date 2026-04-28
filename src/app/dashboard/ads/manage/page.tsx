import { getCurrentClient } from '@/lib/dashboard/getCurrentClient';

export default async function ManageAdsPage() {
  await getCurrentClient({ requireSection: 'ads-manage' });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--color-navy-900)]">Manage campaigns</h2>
        <p className="mt-1 text-slate-600">
          Pause, resume, or change budgets on your campaigns. Changes are reviewed by your account
          manager before going live.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        Campaign management lands in Phase 5. Connect Meta &amp; Google Ads first to see live campaigns.
      </div>
    </div>
  );
}
