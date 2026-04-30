// POST /api/oauth/meta/disconnect — admin only.
// Removes the agency Meta token. Per-client meta_ad_account_id values are
// left in place since the IDs themselves aren't sensitive.

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteAgencyMetaConnection } from '@/lib/meta/connection';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  try {
    await deleteAgencyMetaConnection();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'disconnect_failed', message: (err as Error).message }, { status: 500 });
  }
}
