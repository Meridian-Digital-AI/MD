// Admin endpoint to create a new client.
// POST /api/admin/clients
// Body: { business_name, slug, package_tier, domain?, primary_email? }
// Inserts into public.clients (api_key auto-generates via gen_random_uuid()).
// If primary_email is provided, also adds it to approved_emails so the client
// can sign in and is auto-attached to this client_id.

import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

type Tier = 'get-started' | 'grow' | 'full-partner' | 'website-only';
const TIERS: Tier[] = ['get-started', 'grow', 'full-partner', 'website-only'];

interface Body {
  business_name?: string;
  slug?: string;
  package_tier?: string;
  domain?: string | null;
  primary_email?: string | null;
}

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  // Auth: must be admin.
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

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // Validate.
  const business_name = (body.business_name ?? '').trim();
  const slug = (body.slug ?? '').trim().toLowerCase();
  const package_tier = (body.package_tier ?? '').trim();
  const domain = body.domain?.trim() || null;
  const primary_email = body.primary_email?.trim().toLowerCase() || null;

  if (!business_name || business_name.length > 200) {
    return NextResponse.json({ error: 'business_name_invalid' }, { status: 400 });
  }
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: 'slug_invalid', message: 'Slug must be lowercase letters, numbers and hyphens (2-50 chars).' },
      { status: 400 },
    );
  }
  if (!TIERS.includes(package_tier as Tier)) {
    return NextResponse.json({ error: 'package_tier_invalid' }, { status: 400 });
  }
  if (primary_email && !EMAIL_RE.test(primary_email)) {
    return NextResponse.json({ error: 'primary_email_invalid' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Check slug uniqueness up-front for a clean error.
  const { data: existing } = await admin
    .from('clients')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: 'slug_taken', message: `Slug "${slug}" is already in use.` },
      { status: 409 },
    );
  }

  // Insert client.
  const { data: created, error: insertErr } = await admin
    .from('clients')
    .insert({ business_name, slug, package_tier, domain })
    .select('id, slug')
    .single();
  if (insertErr || !created) {
    console.error('[admin/clients] insert failed', insertErr);
    return NextResponse.json({ error: 'insert_failed', message: insertErr?.message }, { status: 500 });
  }

  // Optional: add primary_email to approved_emails so the client can sign in.
  if (primary_email) {
    const { error: emailErr } = await admin
      .from('approved_emails')
      .upsert(
        {
          email: primary_email,
          role: 'client',
          client_id: created.id,
          business_name_hint: business_name,
          created_by: user.id,
        },
        { onConflict: 'email' },
      );
    if (emailErr) {
      // Client is created, but email allowlist failed. Surface but don't block.
      console.error('[admin/clients] approved_emails upsert failed', emailErr);
      return NextResponse.json(
        { ok: true, slug: created.slug, warning: 'client_created_but_email_allowlist_failed', message: emailErr.message },
        { status: 201 },
      );
    }
  }

  return NextResponse.json({ ok: true, slug: created.slug }, { status: 201 });
}
