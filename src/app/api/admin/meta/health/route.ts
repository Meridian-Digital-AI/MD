// GET /api/admin/meta/health — admin only.
// Live-checks the saved agency Meta token by calling /me + /me/adaccounts.
// Used by the settings page to surface token revocation immediately
// (System User tokens can be invalidated by the BM owner without warning).

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAgencyMetaConnection } from '@/lib/meta/connection';
import { fetchMetaUser, fetchMetaAdAccounts } from '@/lib/meta/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const connection = await getAgencyMetaConnection();
  if (!connection) {
    return NextResponse.json({ ok: false, status: 'not_connected' });
  }

  try {
    const [me, accounts] = await Promise.all([
      fetchMetaUser(connection.access_token),
      fetchMetaAdAccounts(connection.access_token).catch(() => []),
    ]);
    return NextResponse.json({
      ok: true,
      status: 'connected',
      connectedAs: me.name,
      externalUserId: me.id,
      adAccountCount: accounts.length,
      activeAdAccounts: accounts.filter((a) => a.account_status === 1).length,
      expiresAt: connection.token_expires_at,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      status: 'token_invalid',
      error: (err as Error).message || 'Token rejected by Meta.',
    });
  }
}
