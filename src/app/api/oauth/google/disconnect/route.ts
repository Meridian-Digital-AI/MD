// Admin-only — drops the agency Google connection. Client dashboards lose
// live GA4 data until someone reconnects.

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteAgencyGoogleConnection } from '@/lib/google/connection';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    await deleteAgencyGoogleConnection();
  } catch (err) {
    console.error('[oauth/google/disconnect] failed', err);
    return NextResponse.json(
      { error: 'disconnect_failed', message: (err as Error).message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
