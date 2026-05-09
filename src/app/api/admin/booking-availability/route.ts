// POST /api/admin/booking-availability
//
// Admin-only. Toggle a slot in blocked_slots. Body:
//   { slotISO: string, action: 'block' | 'unblock', reason?: string }

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: { slotISO?: unknown; action?: unknown; reason?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const slotISO = typeof body.slotISO === 'string' ? body.slotISO : '';
  const action = typeof body.action === 'string' ? body.action : '';
  const reason = typeof body.reason === 'string' ? body.reason.slice(0, 200) : null;

  if (!slotISO || Number.isNaN(Date.parse(slotISO))) {
    return NextResponse.json({ error: 'invalid_slot' }, { status: 400 });
  }
  if (action !== 'block' && action !== 'unblock') {
    return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  if (action === 'block') {
    const { error } = await admin.from('blocked_slots').upsert(
      { slot_iso: slotISO, reason, blocked_by: user.id },
      { onConflict: 'slot_iso' },
    );
    if (error) {
      console.error('[admin-availability] block', error);
      return NextResponse.json({ error: 'db_error', message: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, action: 'blocked' });
  }

  // unblock
  const { error } = await admin.from('blocked_slots').delete().eq('slot_iso', slotISO);
  if (error) {
    console.error('[admin-availability] unblock', error);
    return NextResponse.json({ error: 'db_error', message: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, action: 'unblocked' });
}
