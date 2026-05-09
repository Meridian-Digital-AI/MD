import Link from 'next/link';
import NewClientForm from './NewClientForm';
import MetaShareHelper from './MetaShareHelper';

export const dynamic = 'force-dynamic';

export default function NewClientPage() {
  const businessManagerId = process.env.META_BUSINESS_MANAGER_ID ?? null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-900">
          ← All clients
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--color-navy-900)]">
          New client
        </h2>
        <p className="mt-1 text-slate-600">
          Onboard a new client. Once created they appear in the admin list and can sign in (if you set their email).
        </p>
      </div>

      <NewClientForm />

      <MetaShareHelper businessManagerId={businessManagerId} />
    </div>
  );
}
