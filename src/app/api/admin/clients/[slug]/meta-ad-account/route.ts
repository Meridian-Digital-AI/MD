// PATCH /api/admin/clients/:slug/meta-ad-account
// Body: { meta_ad_account_id: string | null }
//
// Lightweight endpoint specifically for assigning/unassigning the Meta ad
// account. We could fold this into the main PATCH handler, but keeping it
// separate makes the picker UI simpler (single field, single endpoint).

import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let body: { meta_ad_account_id?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // Accept null/empty to unassign. Otherwise must look like an ad account ID.
  let value: string | null = null;
  if (body.meta_ad_account_id) {
    const v = body.meta_ad_account_id.trim();
    // Meta ad account IDs: optional "act_" + numeric. Allow either format.
    if (!/^(act_)?\d{6,20}$/.test(v)) {
      return NextResponse.json({ error: 'invalid_ad_account_id' }, { status: 400 });
    }
    value = v.startsWith('act_') ? v : `act_${v}`;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('clients').update({ meta_ad_account_id: value }).eq('slug', slug);
  if (error) {
    return NextResponse.json({ error: 'update_failed', message: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, meta_ad_account_id: value });
}
