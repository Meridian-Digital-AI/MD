-- Stripe subscription state on each client record. Lets the admin panel
-- decide whether to show "Generate payment link" or "Manage subscription",
-- and lets the dashboard gate features behind subscription_status = 'active'
-- once we go fully live.
--
-- Webhook flow (from /api/stripe/webhook):
--   checkout.session.completed       -> status='active'  + store ids + subscribed_at
--   customer.subscription.updated    -> status reflects Stripe's status
--   customer.subscription.deleted    -> status='canceled' + canceled_at
--   invoice.payment_failed           -> status='past_due'

alter table public.clients
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status    text default 'unpaid'
    check (subscription_status in (
      'unpaid', 'active', 'trialing', 'past_due', 'paused', 'canceled', 'incomplete'
    )),
  add column if not exists subscribed_at          timestamptz,
  add column if not exists canceled_at            timestamptz;

-- Quick lookup by Stripe customer/subscription IDs from the webhook handler.
create index if not exists clients_stripe_customer_idx
  on public.clients (stripe_customer_id) where stripe_customer_id is not null;
create index if not exists clients_stripe_subscription_idx
  on public.clients (stripe_subscription_id) where stripe_subscription_id is not null;
