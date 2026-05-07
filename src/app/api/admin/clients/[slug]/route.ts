// Admin endpoint to edit an existing client.
// PATCH /api/admin/clients/:slug
// Body (all optional): { business_name?, package_tier?, domain? }
//
// Slug is intentionally NOT editable here — slugs are baked into the lead
// capture URL and the demo-site env vars; renaming one would silently break
// in-flight integrations. If we ever need slug-rename, do it as its own flow.

import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

type Tier = 'get-started' | 'grow' | 'full-partner' | 'website-only';
const TIERS: Tier[] = ['get-started', 'grow', 'full-partner', 'website-only'];

type WebsiteStatus = 'live' | 'in_progress' | 'none';
const WEBSITE_STATUSES: WebsiteStatus[] = ['live', 'in_progress', 'none'];

interface Body {
  business_name?: string;
  package_tier?: string;
  domain?: string | null;
  website_status?: string;
  google_ads_customer_id?: string | null;
  ga4_property_id?: string | null;
}

// Loose format validation. Joe's note from 28 Apr:
//   google_ads → 10-digit customer ID, no dashes (e.g. "7687321878")
//   ga4        → 9-digit property ID            (e.g. "498712345")
// We accept dashes too because the Google Ads UI shows them as XXX-XXX-XXXX.
const GOOGLE_ADS_RE = /^[0-9]{10}$/;
const GA4_PROPERTY_RE = /^[0-9]{8,12}$/;

function normaliseDigits(v: string): string {
  return v.replace(/[\s-]/g, '');
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

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

  const updates: Record<string, string | null> = {};

  if (body.business_name !== undefined) {
    const v = body.business_name.trim();
    if (!v || v.length > 200) {
      return NextResponse.json({ error: 'business_name_invalid' }, { status: 400 });
    }
    updates.business_name = v;
  }

  if (body.package_tier !== undefined) {
    const v = body.package_tier.trim();
    if (!TIERS.includes(v as Tier)) {
      return NextResponse.json({ error: 'package_tier_invalid' }, { status: 400 });
    }
    updates.package_tier = v;
  }

  if (body.domain !== undefined) {
    const v = body.domain?.trim() || null;
    if (v && v.length > 200) {
      return NextResponse.json({ error: 'domain_invalid' }, { status: 400 });
    }
    updates.domain = v;
  }

  if (body.website_status !== undefined) {
    const v = body.website_status.trim();
    if (!WEBSITE_STATUSES.includes(v as WebsiteStatus)) {
      return NextResponse.json({ error: 'website_status_invalid' }, { status: 400 });
    }
    updates.website_status = v;
  }

  if (body.google_ads_customer_id !== undefined) {
    const raw = body.google_ads_customer_id?.trim() || null;
    if (raw === null || raw === '') {
      updates.google_ads_customer_id = null;
    } else {
      const v = normaliseDigits(raw);
      if (!GOOGLE_ADS_RE.test(v)) {
        return NextResponse.json(
          {
            error: 'google_ads_customer_id_invalid',
            message: 'Google Ads customer ID must be 10 digits (dashes allowed).',
          },
          { status: 400 },
        );
      }
      updates.google_ads_customer_id = v;
    }
  }

  if (body.ga4_property_id !== undefined) {
    const raw = body.ga4_property_id?.trim() || null;
    if (raw === null || raw === '') {
      updates.ga4_property_id = null;
    } else {
      const v = normaliseDigits(raw);
      if (!GA4_PROPERTY_RE.test(v)) {
        return NextResponse.json(
          {
            error: 'ga4_property_id_invalid',
            message: 'GA4 property ID must be 8–12 digits.',
          },
          { status: 400 },
        );
      }
      updates.ga4_property_id = v;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'no_changes' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('clients').update(updates).eq('slug', slug);
  if (error) {
    console.error('[admin/clients/edit] update failed', error);
    return NextResponse.json({ error: 'update_failed', message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
