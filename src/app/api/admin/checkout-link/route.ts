// POST /api/admin/checkout-link
//
// Admin-only endpoint. Given a client_id + email, generates a Stripe Checkout
// URL for that client's tier (setup fee + monthly recurring) and returns it.
// The admin pastes that URL into an email/WhatsApp to the prospect.
//
// Auth: requires the caller to be a logged-in admin (users.role = 'admin').
// Anyone hitting this without being an admin gets 403 — keeps the endpoint
// safe to expose at /api/...

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createCheckoutSession, type ClientTier } from '@/lib/stripe';

interface RequestBody {
  client_id?: string;
  customer_email?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();

  // 1. Auth check — must be admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only.' }, { status: 403 });
  }

  // 2. Parse + validate body
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const clientId = body.client_id?.trim();
  const customerEmail = body.customer_email?.trim().toLowerCase();
  if (!clientId) {
    return NextResponse.json({ error: 'client_id is required.' }, { status: 400 });
  }
  if (!customerEmail || !EMAIL_REGEX.test(customerEmail)) {
    return NextResponse.json(
      { error: 'A valid customer_email is required.' },
      { status: 400 },
    );
  }

  // 3. Look up the client
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('id, business_name, slug, package_tier, stripe_customer_id')
    .eq('id', clientId)
    .single();
  if (clientErr || !client) {
    return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
  }

  // 4. Create the Stripe Checkout Session
  const origin =
    req.headers.get('origin') ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://meridian-digital-partners.com';

  try {
    const { url } = await createCheckoutSession({
      client: {
        id: client.id,
        business_name: client.business_name,
        slug: client.slug,
        package_tier: client.package_tier as ClientTier,
        stripe_customer_id: client.stripe_customer_id,
      },
      customer_email: customerEmail,
      origin,
    });
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error.';
    console.error('[checkout-link] Stripe error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
