import Link from 'next/link';
import { isMetaConfigured } from '@/lib/meta/config';
import { getAgencyMetaConnection } from '@/lib/meta/connection';
import MetaConnectionCard from './MetaConnectionCard';

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ meta_connected?: string; meta_error?: string }>;
}) {
  const sp = await searchParams;
  const [connection, configured] = await Promise.all([
    getAgencyMetaConnection(),
    Promise.resolve(isMetaConfigured()),
  ]);

  const expiresAt = connection?.token_expires_at ? new Date(connection.token_expires_at) : null;
  const daysLeft = expiresAt
    ? Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to admin
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--color-navy-900)]">
          Agency settings
        </h2>
        <p className="mt-1 text-slate-600">
          Platform connections used across all clients. Connect once here, then
          assign each client to one of the available ad accounts on their
          detail page.
        </p>
      </div>

      {sp.meta_connected === '1' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Meta connected successfully.
        </div>
      )}
      {sp.meta_error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Meta connection failed: {sp.meta_error}
        </div>
      )}

      <MetaConnectionCard
        configured={configured}
        connectedAs={connection?.external_user_name ?? null}
        externalUserId={connection?.external_user_id ?? null}
        connectedAt={connection?.connected_at ?? null}
        expiresAt={connection?.token_expires_at ?? null}
        daysLeft={daysLeft}
      />
    </div>
  );
}
