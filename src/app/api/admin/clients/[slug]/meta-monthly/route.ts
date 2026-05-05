// Manual Meta Ads numbers — admin-only upsert per client per month.
//
//   GET  /api/admin/clients/:slug/meta-monthly?month=YYYY-MM
//        → { entry: { spend, impressions, clicks, notes, updated_at, updated_by_email } | null }
//   POST /api/admin/clients/:slug/meta-monthly
//        body: { month: 'YYYY-MM', spend?, impressions?, clicks?, notes? }
//        → { ok, entry }
//
// We replace the live Meta API path until Tech Provider verification clears.
// Numbers entered here are the source of truth across the admin monthly view,
// the client dashboard, the downloadable PDF, and the cron-emailed report.

import { NextResponse } from 'next/server';
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from '@/lib/supabase/server';

function isValidYearMonth(s: string): boolean {
  return /^[0-9]{4}-(0[1-9]|1[0-2])$/.test(s);
}

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

async function gateAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  }
  return { userId: user.id };
}

async function resolveClientId(slug: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from('clients').select('id').eq('slug', slug).maybeSingle();
  return (data?.id as string | undefined) ?? null;
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
    return NextResponse.json({ error: 'invalid_month' }, { status: 400 });
  }

  const clientId = await resolveClientId(slug);
  if (!clientId) return NextResponse.json({ error: 'client_not_found' }, { status: 404 });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('client_meta_monthly')
    .select('spend, impressions, clicks, notes, updated_at, updated_by')
    .eq('client_id', clientId)
    .eq('year_month', month)
    .maybeSingle();
  if (error) {
    console.error('[meta-monthly/get] failed', error);
    return NextResponse.json({ error: 'fetch_failed', message: error.message }, { status: 500 });
  }

  // Resolve updater email for display (best-effort).
  let updatedByEmail: string | null = null;
  if (data?.updated_by) {
    const { data: u } = await admin
      .from('users')
      .select('email')
      .eq('id', data.updated_by as string)
      .maybeSingle();
    updatedByEmail = (u?.email as string | undefined) ?? null;
  }

  return NextResponse.json({
    month,
    entry: data
      ? {
          spend: data.spend,
          impressions: data.impressions,
          clicks: data.clicks,
          notes: data.notes,
          updated_at: data.updated_at,
          updated_by_email: updatedByEmail,
        }
      : null,
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
    month?: unknown;
    spend?: unknown;
    impressions?: unknown;
    clicks?: unknown;
    notes?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const month =
    typeof body.month === 'string' && isValidYearMonth(body.month)
      ? body.month
      : currentYearMonth();

  // Coerce numerics — accept "" / undefined / null as "clear this field".
  function toNumOrNull(v: unknown): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) && n >= 0 ? n : NaN as unknown as null;
  }
  const spend = toNumOrNull(body.spend);
  const impressions = toNumOrNull(body.impressions);
  const clicks = toNumOrNull(body.clicks);

  if (Number.isNaN(spend) || Number.isNaN(impressions) || Number.isNaN(clicks)) {
    return NextResponse.json(
      { error: 'invalid_number', message: 'Spend, impressions and clicks must be non-negative numbers.' },
      { status: 400 },
    );
  }

  const notes =
    typeof body.notes === 'string'
      ? body.notes.trim().slice(0, 2000) || null
      : null;

  const clientId = await resolveClientId(slug);
  if (!clientId) return NextResponse.json({ error: 'client_not_found' }, { status: 404 });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('client_meta_monthly')
    .upsert(
      {
        client_id: clientId,
        year_month: month,
        spend,
        impressions: impressions === null ? null : Math.round(impressions),
        clicks: clicks === null ? null : Math.round(clicks),
        notes,
        updated_by: gate.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'client_id,year_month' },
    )
    .select('spend, impressions, clicks, notes, updated_at')
    .single();

  if (error) {
    console.error('[meta-monthly/upsert] failed', error);
    return NextResponse.json({ error: 'save_failed', message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, entry: data });
}
