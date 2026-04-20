"""Stripe helpers for the Ads Builder.

Billing now lives on the marketing website (meridiandigital.co.uk). This
module only *verifies* that a given email address has an active subscription
to any Meridian Digital plan. If they do, they get access.
"""

from __future__ import annotations

import os
from typing import Optional

import stripe

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")

# Statuses that count as "paid-up and allowed in". `trialing` is included so
# Stripe trial subscriptions work; `past_due` is included so a one-off failed
# payment doesn't immediately lock the client out — Stripe's retry logic will
# either recover or flip to `canceled`.
ACTIVE_SUBSCRIPTION_STATUSES = {"active", "trialing", "past_due"}


class StripeNotConfigured(Exception):
    """Raised when STRIPE_SECRET_KEY is missing — surfaces as a friendly error."""


def _ensure_configured() -> None:
    if not stripe.api_key:
        raise StripeNotConfigured(
            "STRIPE_SECRET_KEY is not set. Add it to .env before running."
        )


def get_active_subscription_by_email(email: str) -> Optional[dict]:
    """Return info about the customer's active subscription, or None.

    Looks up Stripe customers by email (there may be more than one if they
    re-entered their email on checkout), then checks for any active
    subscription. Returns a small dict the caller can store, e.g.:

        {
            "stripe_customer_id": "cus_abc123",
            "subscription_id": "sub_xyz",
            "status": "active",
            "tier_id": "grow",   # pulled from subscription metadata
            "tier_name": "Grow Your Business",
        }

    Returns None if:
      - no Stripe customer exists for that email
      - no subscription is in an allowed status
    """
    _ensure_configured()
    email_clean = (email or "").strip().lower()
    if not email_clean:
        return None

    # Stripe customer search by email. `list` is lowercase-insensitive on
    # their end but we normalise anyway for safety.
    customers = stripe.Customer.list(email=email_clean, limit=10).data
    if not customers:
        return None

    for cust in customers:
        subs = stripe.Subscription.list(
            customer=cust.id, status="all", limit=10
        ).data
        for sub in subs:
            if sub.status not in ACTIVE_SUBSCRIPTION_STATUSES:
                continue
            tier_id = (sub.metadata or {}).get("tier_id")
            tier_name = (sub.metadata or {}).get("tier_name")
            return {
                "stripe_customer_id": cust.id,
                "subscription_id": sub.id,
                "status": sub.status,
                "tier_id": tier_id,
                "tier_name": tier_name,
            }

    return None


def verify_webhook(payload, sig_header):
    """Verify a Stripe webhook signature.

    Kept for completeness but the Ads Builder no longer registers a webhook
    endpoint — the marketing website handles those.
    """
    _ensure_configured()
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    return stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
