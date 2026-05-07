import Link from 'next/link';
import { isMetaConfigured } from '@/lib/meta/config';

// Force dynamic rendering — Vercel doesn't expose env vars marked
// "Sensitive" during static generation, only at runtime. Without this,
// isGoogleConfigured() can return false even when the vars are set.
export const dynamic = 'force-dynamic';

import { getAgencyMetaConnection } from '@/lib/meta/connection';
import { isGoogleConfigured } from '@/lib/google/config';
import { getAgencyGoogleConnection } from '@/lib/google/connection';
import MetaConnectionCard from './MetaConnectionCard';
import GoogleConnectionCard from './GoogleConnectionCard';

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    meta_connected?: string;
    meta_error?: string;
    google_connected?: string;
    google_error?: string;
  }>;
}) {
  const sp = await searchParams;
  const [metaConnection, metaConfigured, googleConnection, googleConfigured] =
    await Promise.all([
      getAgencyMetaConnection(),
      Promise.resolve(isMetaConfigured()),
      getAgencyGoogleConnection(),
      Promise.resolve(isGoogleConfigured()),
    ]);

  const metaExpiresAt = metaConnection?.token_expires_at
    ? new Date(metaConnection.token_expires_at)
    : null;
  const metaDaysLeft = metaExpiresAt
    ? Math.max(0, Math.round((metaExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
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
      {sp.google_connected === '1' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Google connected successfully.
        </div>
      )}
      {sp.google_error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Google connection failed: {sp.google_error}
        </div>
      )}

      <MetaConnectionCard
        configured={metaConfigured}
        connectedAs={metaConnection?.external_user_name ?? null}
        externalUserId={metaConnection?.external_user_id ?? null}
        connectedAt={metaConnection?.connected_at ?? null}
        expiresAt={metaConnection?.token_expires_at ?? null}
        daysLeft={metaDaysLeft}
      />

      <GoogleConnectionCard
        configured={googleConfigured}
        connectedAs={googleConnection?.external_user_name ?? null}
        externalUserId={googleConnection?.external_user_id ?? null}
        connectedAt={googleConnection?.connected_at ?? null}
        scope={googleConnection?.scope ?? null}
      />
    </div>
  );
}
