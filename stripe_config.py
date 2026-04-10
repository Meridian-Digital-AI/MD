"""Stripe configuration and helpers."""

import os
import stripe

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")

PLANS = {
    "starter": {
        "name": "Starter",
        "price": 149,
        "price_id": os.environ.get("STRIPE_STARTER_PRICE_ID", ""),
        "features": [
            "Google Ads OR Meta Ads",
            "1 AI campaign generation",
            "1 campaign refresh / month",
            "Email support",
        ],
    },
    "growth": {
        "name": "Growth",
        "price": 299,
        "price_id": os.environ.get("STRIPE_GROWTH_PRICE_ID", ""),
        "popular": True,
        "features": [
            "Google Ads + Meta Ads",
            "Unlimited AI campaigns",
            "2 campaign refreshes / month",
            "Priority email support",
        ],
    },
    "pro": {
        "name": "Pro",
        "price": 499,
        "price_id": os.environ.get("STRIPE_PRO_PRICE_ID", ""),
        "features": [
            "Google Ads + Meta Ads",
            "Unlimited AI campaigns",
            "4 campaign refreshes / month",
            "Dedicated account manager",
            "Monthly strategy call",
        ],
    },
}


def create_checkout_session(customer_email, customer_id, plan_key, base_url):
    plan = PLANS[plan_key]
    session = stripe.checkout.Session.create(
        mode="subscription",
        payment_method_types=["card"],
        customer_email=customer_email,
        client_reference_id=str(customer_id),
        metadata={"plan": plan_key},
        line_items=[{"price": plan["price_id"], "quantity": 1}],
        success_url=f"{base_url}/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{base_url}/pricing",
    )
    return session


def verify_webhook(payload, sig_header):
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    return stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
