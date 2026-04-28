import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentClient } from '@/lib/dashboard/getCurrentClient';

const PROVIDER_LABELS: Record<string, string> = {
  ga4: 'Google Analytics',
  meta: 'Meta Ads',
  'google-ads': 'Google Ads',
};

export default async function ConnectProviderPage({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  const { provider } = await params;
  if (!PROVIDER_LABELS[provider]) notFound();
  await getCurrentClient();

  const label = PROVIDER_LABELS[provider];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to dashboard
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--color-navy-900)]">
          Connect {label}
        </h2>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
        <p>
          The OAuth flow for {label} is being finished. For now, your Meridian Digital account
          manager can connect your account on your behalf — drop us a note at{' '}
          <a className="text-[var(--color-blue-600)] underline" href="mailto:hello@meridian-digital-partners.com">
            hello@meridian-digital-partners.com
          </a>{' '}
          and we&apos;ll handle it.
        </p>
        <p className="mt-3 text-xs text-slate-400">
          (Self-serve connect is coming in the next release.)
        </p>
      </div>
    </div>
  );
}
