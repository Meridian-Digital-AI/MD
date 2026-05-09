// GET /api/cron/meta-health
//
// Daily health check for the agency Meta token. Runs unauthenticated but
// gated by CRON_SECRET (Vercel sets the Authorization header automatically
// when scheduled via vercel.json). If the saved token has been revoked or
// is within 7 days of expiry, logs a warning row to agency_alerts so the
// settings page can surface a banner.

import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getAgencyMetaConnection } from '@/lib/meta/connection';
import { fetchMetaUser } from '@/lib/meta/api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const connection = await getAgencyMetaConnection();
  if (!connection) {
    return NextResponse.json({ status: 'no_connection' });
  }

  const admin = createSupabaseAdminClient();
  const now = new Date();

  // Token validity check.
  let tokenValid = true;
  let tokenError: string | null = null;
  try {
    await fetchMetaUser(connection.access_token);
  } catch (err) {
    tokenValid = false;
    tokenError = (err as Error).message || 'Token rejected by Meta.';
  }

  // Expiry check (only meaningful if expires_at is set; "never expires"
  // System User tokens leave it null).
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
  const daysUntilExpiry = expiresAt
    ? Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (!tokenValid) {
    await admin.from('agency_alerts').insert({
      severity: 'critical',
      provider: 'meta',
      message: `Meta token revoked: ${tokenError}`,
    }).then(() => {}, (e) => console.error('[meta-health] alert insert failed', e));
    return NextResponse.json({ status: 'token_invalid', error: tokenError });
  }

  if (daysUntilExpiry !== null && daysUntilExpiry <= 7) {
    await admin.from('agency_alerts').insert({
      severity: 'warning',
      provider: 'meta',
      message: `Meta token expires in ${daysUntilExpiry} day(s). Re-generate it in Business Manager.`,
    }).then(() => {}, (e) => console.error('[meta-health] alert insert failed', e));
    return NextResponse.json({ status: 'expiring_soon', daysUntilExpiry });
  }

  return NextResponse.json({ status: 'healthy', daysUntilExpiry });
}
