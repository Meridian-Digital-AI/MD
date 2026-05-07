// POST /api/stripe/webhook
//
// Stripe webhook receiver. Stripe POSTs subscription lifecycle events here;
// we update the client's subscription_status in Supabase accordingly.
//
// Setup:
//   1. In Stripe Dashboard → Developers → Webhooks → Add endpoint
//   2. URL:  https://meridian-digital-partners.com/api/stripe/webhook
//   3. Events to send:
//        - checkout.session.completed
//        - customer.subscription.updated
//        - customer.subscription.deleted
//        - invoice.payment_failed
//   4. Copy the "Signing secret" (whsec_…) into STRIPE_WEBHOOK_SECRET on
//      Vercel. Without it the request signature can't be verified.
//
// Auth: this endpoint is unauthenticated by design (Stripe calls it). The
// Stripe-Signature header is verified instead, which only Stripe can produce.

import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

// We need the raw body to verify the signature; can't use req.json() here.
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret.' },
      { status: 400 },
    );
  }

  const rawBody = await req.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature verification failed.';
    console.error('[stripe-webhook] Bad signature:', message);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // The client_id was stamped into metadata when we created the session.
        const clientId = session.metadata?.client_id ?? session.client_reference_id;
        if (!clientId) {
          console.warn('[stripe-webhook] No client_id on session', session.id);
          break;
        }
        await supabase
          .from('clients')
          .update({
            subscription_status: 'active',
            stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
            stripe_subscription_id:
              typeof session.subscription === 'string' ? session.subscription : null,
            subscribed_at: new Date().toISOString(),
            canceled_at: null,
          })
          .eq('id', clientId);
        console.log(`[stripe-webhook] Client ${clientId} subscription activated.`);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const clientId = sub.metadata?.client_id;
        if (!clientId) break;
        // Map Stripe's subscription.status to ours. They mostly align.
        await supabase
          .from('clients')
          .update({ subscription_status: sub.status })
          .eq('id', clientId);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const clientId = sub.metadata?.client_id;
        if (!clientId) break;
        await supabase
          .from('clients')
          .update({
            subscription_status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('id', clientId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        // Look the client up by Stripe customer id (subscription metadata
        // isn't on invoice events, only the customer reference is reliable).
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : null;
        if (!customerId) break;
        await supabase
          .from('clients')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId);
        break;
      }

      default:
        // Unhandled event type — Stripe sends a lot we don't care about.
        // Still return 200 so Stripe stops retrying.
        break;
    }
  } catch (err) {
    console.error(`[stripe-webhook] Handler error for ${event.type}:`, err);
    // Return 500 so Stripe retries — better than silently dropping.
    return NextResponse.json({ error: 'Handler failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
