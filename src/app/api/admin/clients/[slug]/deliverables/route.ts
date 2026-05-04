// Admin endpoints for the per-client monthly deliverables checklist.
//
//   GET  /api/admin/clients/:slug/deliverables?month=YYYY-MM
//   POST /api/admin/clients/:slug/deliverables
//        body: { title, type?, notes? }                      → create single
//        body: { applyTemplate: true, year_month?: 'YYYY-MM' } → seed from tier
//
// Month-scoped. PATCH/DELETE on individual rows live in [id]/route.ts.

import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { templatesForTier, type DeliverableType } from '@/lib/dashboard/deliverableTemplates';
import type { PackageTier } from '@/lib/dashboard/packageFeatures';

const VALID_TYPES: DeliverableType[] = ['call', 'creative', 'blog', 'audit', 'report', 'other'];

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function isValidYearMonth(s: string): boolean {
  return /^[0-9]{4}-(0[1-9]|1[0-2])$/.test(s);
}

async function gateAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  }
  return { user };
}

async function resolveClientIdFromSlug(slug: string): Promise<{ id: string; package_tier: PackageTier } | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('clients')
    .select('id, package_tier')
    .eq('slug', slug)
    .maybeSingle();
  return (data as { id: string; package_tier: PackageTier } | null) ?? null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const gate = await gateAdmin();
  if (gate.error) return gate.error;
  const { slug } = await params;

  const url = new URL(request.url);
  const month = url.searchParams.get('month') ?? currentYearMonth();
  if (!isValidYearMonth(month)) {
    return NextResponse.json({ error: 'invalid_month', message: 'Use YYYY-MM.' }, { status: 400 });
  }

  const client = await resolveClientIdFromSlug(slug);
  if (!client) return NextResponse.json({ error: 'client_not_found' }, { status: 404 });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('client_deliverables')
    .select('id, title, type, notes, order_index, completed_at, completed_by, created_at, updated_at')
    .eq('client_id', client.id)
    .eq('year_month', month)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[deliverables/list] failed', error);
    return NextResponse.json({ error: 'list_failed', message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    month,
    deliverables: data ?? [],
    completedCount: (data ?? []).filter((d) => d.completed_at).length,
    totalCount: (data ?? []).length,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const gate = await gateAdmin();
  if (gate.error) return gate.error;
  const { slug } = await params;

  let body: {
    title?: unknown;
    type?: unknown;
    notes?: unknown;
    applyTemplate?: unknown;
    year_month?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const month =
    typeof body.year_month === 'string' && isValidYearMonth(body.year_month)
      ? body.year_month
      : currentYearMonth();

  const client = await resolveClientIdFromSlug(slug);
  if (!client) return NextResponse.json({ error: 'client_not_found' }, { status: 404 });

  const admin = createSupabaseAdminClient();

  // Mode A: apply tier template — seeds N rows in one shot.
  if (body.applyTemplate === true) {
    const templates = templatesForTier(client.package_tier);
    if (templates.length === 0) {
      return NextResponse.json({ ok: true, inserted: 0, message: 'No template for this tier.' });
    }

    // Skip items whose title already exists for this client/month — idempotent.
    const { data: existing } = await admin
      .from('client_deliverables')
      .select('title')
      .eq('client_id', client.id)
      .eq('year_month', month);
    const existingTitles = new Set((existing ?? []).map((r) => r.title));

    const rows = templates
      .filter((t) => !existingTitles.has(t.title))
      .map((t, idx) => ({
        client_id: client.id,
        year_month: month,
        title: t.title,
        type: t.type,
        notes: t.notes ?? null,
        order_index: idx,
      }));

    if (rows.length === 0) {
      return NextResponse.json({ ok: true, inserted: 0, message: 'Already seeded for this month.' });
    }

    const { error } = await admin.from('client_deliverables').insert(rows);
    if (error) {
      console.error('[deliverables/seed] failed', error);
      return NextResponse.json({ error: 'seed_failed', message: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, inserted: rows.length });
  }

  // Mode B: single insert.
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title || title.length > 200) {
    return NextResponse.json({ error: 'title_invalid' }, { status: 400 });
  }
  const type = typeof body.type === 'string' ? body.type : 'other';
  if (!VALID_TYPES.includes(type as DeliverableType)) {
    return NextResponse.json({ error: 'type_invalid' }, { status: 400 });
  }
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 2000) : null;

  // Append at the end of the current month's list.
  const { count } = await admin
    .from('client_deliverables')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', client.id)
    .eq('year_month', month);

  const { data, error } = await admin
    .from('client_deliverables')
    .insert({
      client_id: client.id,
      year_month: month,
      title,
      type,
      notes,
      order_index: count ?? 0,
    })
    .select('id, title, type, notes, order_index, completed_at, created_at')
    .single();

  if (error) {
    console.error('[deliverables/create] failed', error);
    return NextResponse.json({ error: 'create_failed', message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deliverable: data });
}
