// PATCH /api/admin/integration-requests/:id
// Body: { status: 'open' | 'in_progress' | 'done' | 'cancelled' }
//
// Used by the admin queue to mark a request as picked-up, finished, or cancelled.
// Sets resolved_at when status moves to a terminal state.

import { NextResponse } from 'next/server';
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from '@/lib/supabase/server';

const VALID_STATUSES = ['open', 'in_progress', 'done', 'cancelled'] as const;
type Status = (typeof VALID_STATUSES)[number];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: { status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const status =
    typeof body.status === 'string' && VALID_STATUSES.includes(body.status as Status)
      ? (body.status as Status)
      : null;
  if (!status) {
    return NextResponse.json({ error: 'invalid_status' }, { status: 400 });
  }

  const updates: Record<string, string | null> = { status };
  if (status === 'done' || status === 'cancelled') {
    updates.resolved_at = new Date().toISOString();
  } else {
    updates.resolved_at = null;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('integration_requests')
    .update(updates)
    .eq('id', id);
  if (error) {
    console.error('[admin/integration-requests PATCH]', error);
    return NextResponse.json({ error: 'update_failed', message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
