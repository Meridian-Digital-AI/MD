// GET /api/admin/meta/ad-accounts
//
// Returns the list of ad accounts the agency token can see. Empty array if
// not connected or token is invalid. Used by the per-client picker.

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAgencyMetaConnection } from '@/lib/meta/connection';
import { fetchMetaAdAccounts } from '@/lib/meta/api';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const conn = await getAgencyMetaConnection();
  if (!conn) return NextResponse.json({ connected: false, accounts: [] });

  try {
    const accounts = await fetchMetaAdAccounts(conn.access_token);
    return NextResponse.json({
      connected: true,
      accounts: accounts.map((a) => ({
        id: a.id,
        account_id: a.account_id,
        name: a.name,
        currency: a.currency,
        active: a.account_status === 1,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { connected: true, accounts: [], error: (err as Error).message || 'meta_api_error' },
      { status: 200 },
    );
  }
}
