// Stripe client + helpers for the admin-driven payment flow.
//
// Usage shape: admin clicks "Generate payment link" on a client detail page →
// /api/admin/checkout-link creates a Stripe Checkout Session for that
// client's tier (setup fee + monthly recurring) → returns a hosted-checkout
// URL → admin pastes that URL into an email/WhatsApp to the client. Client
// pays → webhook flips the client's subscription_status to 'active'.

import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment.');
  }
  _stripe = new Stripe(key, {
    // Pin the API version so silent server-side breaking changes can't bite us.
    apiVersion: '2026-04-22.dahlia',
    typescript: true,
  });
  return _stripe;
}

// ────────────────────────────────────────────────────────────────────────
// Tier → Price ID lookup
// Each tier has a one-off setup fee + a recurring monthly subscription.
// Both are passed to Stripe Checkout as separate line items in one session.
// ────────────────────────────────────────────────────────────────────────

export type ClientTier =
  | 'get-started'
  | 'grow'
  | 'full-partner'
  | 'website-only';

interface TierPrices {
  monthly: string;
  setup: string;
}

export function getTierPrices(tier: ClientTier): TierPrices {
  const config: Record<ClientTier, TierPrices> = {
    'get-started': {
      monthly: process.env.STRIPE_PRICE_GET_STARTED ?? '',
      setup: process.env.STRIPE_PRICE_GET_STARTED_SETUP ?? '',
    },
    grow: {
      monthly: process.env.STRIPE_PRICE_GROW ?? '',
      setup: process.env.STRIPE_PRICE_GROW_SETUP ?? '',
    },
    'full-partner': {
      monthly: process.env.STRIPE_PRICE_FULL_PARTNER ?? '',
      setup: process.env.STRIPE_PRICE_FULL_PARTNER_SETUP ?? '',
    },
    // website-only doesn't have its own Stripe prices yet — falls back to
    // get-started until we add them. Update this when website-only goes live.
    'website-only': {
      monthly: process.env.STRIPE_PRICE_GET_STARTED ?? '',
      setup: process.env.STRIPE_PRICE_GET_STARTED_SETUP ?? '',
    },
  };
  const prices = config[tier];
  if (!prices.monthly || !prices.setup) {
    throw new Error(
      `Stripe price IDs missing for tier "${tier}". ` +
        `Check STRIPE_PRICE_${tier.toUpperCase().replace('-', '_')} ` +
        `and STRIPE_PRICE_${tier.toUpperCase().replace('-', '_')}_SETUP in env.`,
    );
  }
  return prices;
}

// ────────────────────────────────────────────────────────────────────────
// Create a checkout session for a client
// Returns the hosted-checkout URL for the admin to send to the client.
// ────────────────────────────────────────────────────────────────────────

interface CreateCheckoutInput {
  client: {
    id: string;
    business_name: string;
    slug: string;
    package_tier: ClientTier;
    stripe_customer_id?: string | null;
  };
  customer_email: string;
  origin: string; // e.g. https://meridian-digital-partners.com
}

export async function createCheckoutSession({
  client,
  customer_email,
  origin,
}: CreateCheckoutInput): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripeClient();
  const prices = getTierPrices(client.package_tier);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    // Setup fee = one-off line, monthly subscription = recurring line.
    line_items: [
      { price: prices.setup, quantity: 1 },
      { price: prices.monthly, quantity: 1 },
    ],
    // Reuse the same Stripe Customer if we've created one before, otherwise
    // let Stripe create one and we'll capture its id on the webhook.
    customer: client.stripe_customer_id ?? undefined,
    customer_email: client.stripe_customer_id ? undefined : customer_email,
    // The webhook uses these to find the client row in Supabase.
    client_reference_id: client.id,
    metadata: {
      client_id: client.id,
      client_slug: client.slug,
      package_tier: client.package_tier,
    },
    subscription_data: {
      metadata: {
        client_id: client.id,
        client_slug: client.slug,
        package_tier: client.package_tier,
      },
    },
    success_url: `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/admin/clients/${client.slug}?checkout=canceled`,
    // 24 hour expiry — admin sends the link, client typically pays within a day.
    expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    // No promo codes for v1; turn on later if we want them.
    allow_promotion_codes: false,
  });

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL.');
  }

  return { url: session.url, sessionId: session.id };
}
