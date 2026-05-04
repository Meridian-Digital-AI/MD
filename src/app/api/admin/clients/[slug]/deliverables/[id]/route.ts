// PATCH /api/admin/clients/:slug/deliverables/:id
//   body: { completed?: boolean, title?, type?, notes? }
//
// DELETE /api/admin/clients/:slug/deliverables/:id

import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import type { DeliverableType } from '@/lib/dashboard/deliverableTemplates';

const VALID_TYPES: DeliverableType[] = ['call', 'creative', 'blog', 'audit', 'report', 'other'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function gate() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  }
  return { userId: user.id };
}

async function ensureBelongsToSlug(slug: string, deliverableId: string): Promise<boolean> {
  if (!UUID_RE.test(deliverableId)) return false;
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('client_deliverables')
    .select('id, clients!inner(slug)')
    .eq('id', deliverableId)
    .maybeSingle();
  // The join shape is { id, clients: { slug } }
  const joined = data as unknown as { id: string; clients: { slug: string } } | null;
  return !!joined && joined.clients.slug === slug;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const g = await gate();
  if (g.error) return g.error;
  const { slug, id } = await params;

  const ok = await ensureBelongsToSlug(slug, id);
  if (!ok) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  let body: { completed?: unknown; title?: unknown; type?: unknown; notes?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const updates: Record<string, string | null | undefined> = {
    updated_at: new Date().toISOString(),
  };

  if (body.completed !== undefined) {
    if (typeof body.completed !== 'boolean') {
      return NextResponse.json({ error: 'completed_invalid' }, { status: 400 });
    }
    if (body.completed) {
      updates.completed_at = new Date().toISOString();
      updates.completed_by = g.userId;
    } else {
      updates.completed_at = null;
      updates.completed_by = null;
    }
  }

  if (body.title !== undefined) {
    if (typeof body.title !== 'string') return NextResponse.json({ error: 'title_invalid' }, { status: 400 });
    const v = body.title.trim();
    if (!v || v.length > 200) return NextResponse.json({ error: 'title_invalid' }, { status: 400 });
    updates.title = v;
  }

  if (body.type !== undefined) {
    if (typeof body.type !== 'string' || !VALID_TYPES.includes(body.type as DeliverableType)) {
      return NextResponse.json({ error: 'type_invalid' }, { status: 400 });
    }
    updates.type = body.type;
  }

  if (body.notes !== undefined) {
    if (body.notes === null) {
      updates.notes = null;
    } else if (typeof body.notes === 'string') {
      updates.notes = body.notes.trim().slice(0, 2000) || null;
    } else {
      return NextResponse.json({ error: 'notes_invalid' }, { status: 400 });
    }
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'no_changes' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('client_deliverables')
    .update(updates)
    .eq('id', id)
    .select('id, title, type, notes, completed_at, completed_by, updated_at')
    .single();

  if (error) {
    console.error('[deliverables/patch] failed', error);
    return NextResponse.json({ error: 'update_failed', message: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, deliverable: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const g = await gate();
  if (g.error) return g.error;
  const { slug, id } = await params;

  const ok = await ensureBelongsToSlug(slug, id);
  if (!ok) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('client_deliverables').delete().eq('id', id);
  if (error) {
    console.error('[deliverables/delete] failed', error);
    return NextResponse.json({ error: 'delete_failed', message: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
