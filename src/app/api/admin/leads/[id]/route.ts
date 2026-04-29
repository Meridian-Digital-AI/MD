// Admin endpoint to delete a single lead.
// DELETE /api/admin/leads/:id

import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

export async function DELETE(
  _request: Request,
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

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('leads').delete().eq('id', id);
  if (error) {
    console.error('[admin/leads] delete failed', error);
    return NextResponse.json({ error: 'delete_failed', message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
