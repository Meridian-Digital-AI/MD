// Admin endpoint for managing the signup allowlist.
// Actions: approve, reject, add, remove.
// All mutations go through the service-role client; the caller is gated on
// being an admin in public.users first.

import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

type Action =
  | { action: 'approve'; request_id: string; email: string; role: 'client' | 'admin'; client_id: string | null }
  | { action: 'reject'; request_id: string }
  | { action: 'add'; email: string; role: 'client' | 'admin'; client_id: string | null; notes: string | null }
  | { action: 'remove'; email: string };

export async function POST(request: Request) {
  // 1. Auth: must be signed in and have role=admin in public.users.
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // 2. Parse body.
  let body: Action;
  try {
    body = (await request.json()) as Action;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  try {
    switch (body.action) {
      case 'approve': {
        const email = body.email.toLowerCase().trim();
        if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

        // Insert/upsert the allowlist row.
        const { error: upErr } = await admin
          .from('approved_emails')
          .upsert(
            {
              email,
              role: body.role,
              client_id: body.client_id,
              created_by: user.id,
            },
            { onConflict: 'email' },
          );
        if (upErr) throw upErr;

        // Mark the signup_request as approved.
        const { error: updErr } = await admin
          .from('signup_requests')
          .update({
            status: 'approved',
            decided_by: user.id,
            decided_at: new Date().toISOString(),
          })
          .eq('id', body.request_id);
        if (updErr) throw updErr;

        return NextResponse.json({ ok: true });
      }

      case 'reject': {
        const { error } = await admin
          .from('signup_requests')
          .update({
            status: 'rejected',
            decided_by: user.id,
            decided_at: new Date().toISOString(),
          })
          .eq('id', body.request_id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case 'add': {
        const email = body.email.toLowerCase().trim();
        if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

        const { error } = await admin
          .from('approved_emails')
          .upsert(
            {
              email,
              role: body.role,
              client_id: body.client_id,
              notes: body.notes,
              created_by: user.id,
            },
            { onConflict: 'email' },
          );
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case 'remove': {
        const email = body.email.toLowerCase().trim();
        if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

        const { error } = await admin.from('approved_emails').delete().eq('email', email);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: 'unknown action' }, { status: 400 });
    }
  } catch (e) {
    console.error('[admin/access] error', e);
    return NextResponse.json({ error: (e as Error).message || 'internal' }, { status: 500 });
  }
}
