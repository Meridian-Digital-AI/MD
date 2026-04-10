"""Email notification service with pluggable backends.

Backends:
  - console (default): prints emails to stdout. Great for dev — no API keys.
  - resend: sends real emails via Resend (https://resend.com).

Configure via env vars:
  EMAIL_BACKEND    = console | resend
  FROM_EMAIL       = "AdPilot AI <noreply@adpilot.ai>"
  RESEND_API_KEY   = re_xxxxx (only needed for resend backend)
"""

import os
import logging

log = logging.getLogger(__name__)

BACKEND = os.environ.get("EMAIL_BACKEND", "console").lower()
FROM_EMAIL = os.environ.get("FROM_EMAIL", "AdPilot AI <noreply@adpilot.ai>")
APP_URL = os.environ.get("APP_URL", "http://localhost:5000")


# ─── Core send function ──────────────────────────────────────────────────────

def send_email(to: str, subject: str, html: str, text: str = "") -> bool:
    """Send an email via the configured backend. Returns True on success."""
    if BACKEND == "resend":
        return _send_resend(to, subject, html, text)
    return _send_console(to, subject, html, text)


def _send_console(to: str, subject: str, html: str, text: str) -> bool:
    import sys
    border = "─" * 60
    sys.stderr.write(f"\n{border}\n")
    sys.stderr.write(f"[EMAIL:{BACKEND}] To: {to}\n")
    sys.stderr.write(f"From: {FROM_EMAIL}\n")
    sys.stderr.write(f"Subject: {subject}\n")
    sys.stderr.write(f"{border}\n")
    sys.stderr.write((text or html) + "\n")
    sys.stderr.write(f"{border}\n\n")
    sys.stderr.flush()
    return True


def _send_resend(to: str, subject: str, html: str, text: str) -> bool:
    try:
        import resend
        resend.api_key = os.environ.get("RESEND_API_KEY", "")
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": to,
            "subject": subject,
            "html": html,
            "text": text or None,
        })
        return True
    except Exception as e:
        log.error(f"Resend email failed: {e}")
        return False


# ─── Email templates ─────────────────────────────────────────────────────────

def send_welcome(to: str, business_name: str) -> bool:
    subject = "Welcome to AdPilot AI — your campaign is coming"
    text = (
        f"Hi {business_name},\n\n"
        f"Thanks for signing up to AdPilot AI! We're building your Google Ads "
        f"and Meta Ads campaigns right now.\n\n"
        f"You'll get another email as soon as your campaign is ready to review.\n\n"
        f"Dashboard: {APP_URL}/dashboard\n\n"
        f"— The AdPilot AI team"
    )
    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Welcome to AdPilot AI 👋</h2>
      <p>Hi <strong>{business_name}</strong>,</p>
      <p>Thanks for signing up! Our AI is building your Google Ads and Meta Ads
      campaigns right now.</p>
      <p>You'll get another email as soon as your campaign is ready to review.</p>
      <p><a href="{APP_URL}/dashboard"
            style="display:inline-block;background:#4f8cff;color:#fff;padding:12px 20px;
            border-radius:8px;text-decoration:none;font-weight:600;">Open Dashboard</a></p>
      <p style="color:#6b7280;font-size:14px;">— The AdPilot AI team</p>
    </div>
    """
    return send_email(to, subject, html, text)


def send_campaign_ready(to: str, business_name: str, campaign_id: int) -> bool:
    subject = f"Your {business_name} campaign is ready to review"
    review_url = f"{APP_URL}/campaign/{campaign_id}"
    text = (
        f"Good news — your AI-generated ad campaign is ready!\n\n"
        f"Review and approve it here: {review_url}\n\n"
        f"Once approved, we'll set it up on Google Ads and Meta Ads within 24 hours.\n\n"
        f"— The AdPilot AI team"
    )
    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Your campaign is ready 🚀</h2>
      <p>Good news — your AI-generated campaign for <strong>{business_name}</strong>
      is ready to review.</p>
      <p>Take a look at the Google Ads keywords, ad copy, Meta audience targeting,
      and creative briefs. If everything looks good, approve it in one click.</p>
      <p><a href="{review_url}"
            style="display:inline-block;background:#4f8cff;color:#fff;padding:12px 20px;
            border-radius:8px;text-decoration:none;font-weight:600;">Review Campaign</a></p>
      <p style="color:#6b7280;font-size:14px;">
        Once approved, we'll set it up on Google Ads and Meta Ads within 24 hours.
      </p>
    </div>
    """
    return send_email(to, subject, html, text)


def send_campaign_approved(to: str, business_name: str) -> bool:
    subject = f"Campaign approved — {business_name} ads going live"
    text = (
        f"Your campaign for {business_name} has been approved.\n\n"
        f"We'll set up your Google Ads and Meta Ads within 24 hours and email you "
        f"when they're live.\n\n"
        f"— The AdPilot AI team"
    )
    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #22c55e;">Campaign approved ✅</h2>
      <p>Your campaign for <strong>{business_name}</strong> has been approved.</p>
      <p>We'll set up your Google Ads and Meta Ads within 24 hours. You'll get one
      more email from us as soon as your ads are live.</p>
      <p><a href="{APP_URL}/dashboard"
            style="display:inline-block;background:#4f8cff;color:#fff;padding:12px 20px;
            border-radius:8px;text-decoration:none;font-weight:600;">View Dashboard</a></p>
      <p style="color:#6b7280;font-size:14px;">— The AdPilot AI team</p>
    </div>
    """
    return send_email(to, subject, html, text)
