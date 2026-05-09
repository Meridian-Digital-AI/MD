// GET /api/booking/availability?from=ISO&to=ISO
//
// Public — used by the BookingCalendar component to grey out booked
// and admin-blocked slots. Returns only slot ISOs (no PII) so it's
// safe to be unauthenticated.

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const MAX_WINDOW_DAYS = 60;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const fromParam = url.searchParams.get('from');
  const toParam = url.searchParams.get('to');

  if (!fromParam || !toParam) {
    return NextResponse.json({ error: 'missing_range' }, { status: 400 });
  }
  const from = new Date(fromParam);
  const to = new Date(toParam);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: 'invalid_range' }, { status: 400 });
  }
  if (to.getTime() - from.getTime() > MAX_WINDOW_DAYS * 24 * 3600 * 1000) {
    return NextResponse.json({ error: 'range_too_wide' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const [bookingsRes, blockedRes] = await Promise.all([
    admin
      .from('bookings')
      .select('slot_iso')
      .gte('slot_iso', from.toISOString())
      .lte('slot_iso', to.toISOString()),
    admin
      .from('blocked_slots')
      .select('slot_iso, reason')
      .gte('slot_iso', from.toISOString())
      .lte('slot_iso', to.toISOString()),
  ]);

  if (bookingsRes.error || blockedRes.error) {
    console.error('[availability]', bookingsRes.error || blockedRes.error);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  return NextResponse.json({
    booked: (bookingsRes.data ?? []).map((r) => r.slot_iso),
    blocked: (blockedRes.data ?? []).map((r) => ({ slot_iso: r.slot_iso, reason: r.reason })),
  });
}
