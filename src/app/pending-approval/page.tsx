import Link from 'next/link';

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-12 text-center">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
          ← Meridian Digital
        </Link>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl">
            ⏳
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-[var(--color-navy-900)]">
            Account pending approval
          </h1>
          <p className="mt-3 text-slate-600">
            Thanks for trying to sign in. Meridian Digital dashboards are invite-only — your
            request has been logged and we&apos;ll be in touch shortly.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            If you think this is a mistake, drop us a note at{' '}
            <a
              className="underline"
              href="mailto:wandj@meridian-digital-partners.com"
            >
              wandj@meridian-digital-partners.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
