"""Email notification service with pluggable backends.

Backends:
  - console (default): prints emails to stdout. Great for dev — no API keys.
  - resend: sends real emails via Resend (https://resend.com).

Configure via env vars:
  EMAIL_BACKEND    = console | resend
  FROM_EMAIL       = "Meridian Digital <noreply@meridiandigital.co.uk>"
  RESEND_API_KEY   = re_xxxxx (only needed for resend backend)
"""

import os
import html as html_mod
import logging

log = logging.getLogger(__name__)

BACKEND = os.environ.get("EMAIL_BACKEND", "console").lower()
FROM_EMAIL = os.environ.get("FROM_EMAIL", "Meridian Digital <noreply@meridiandigital.co.uk>")
APP_URL = os.environ.get("APP_URL", "http://localhost:5000")

# Who gets the "new campaign approved — go set it up" operator notifications.
# Set in .env; falls back to a sensible default so it still works locally.
OWNER_EMAIL = os.environ.get("OWNER_EMAIL", "wandj@meridian-digital-partners.com")


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
    subject = "Welcome to Meridian Digital — your campaign is coming"
    text = (
        f"Hi {business_name},\n\n"
        f"Thanks for signing up to Meridian Digital! We're building your Google Ads "
        f"and Meta Ads campaigns right now.\n\n"
        f"You'll get another email as soon as your campaign is ready to review.\n\n"
        f"Dashboard: {APP_URL}/dashboard\n\n"
        f"— The Meridian Digital team"
    )
    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Welcome to Meridian Digital 👋</h2>
      <p>Hi <strong>{business_name}</strong>,</p>
      <p>Thanks for signing up! Our AI is building your Google Ads and Meta Ads
      campaigns right now.</p>
      <p>You'll get another email as soon as your campaign is ready to review.</p>
      <p><a href="{APP_URL}/dashboard"
            style="display:inline-block;background:#4f8cff;color:#fff;padding:12px 20px;
            border-radius:8px;text-decoration:none;font-weight:600;">Open Dashboard</a></p>
      <p style="color:#6b7280;font-size:14px;">— The Meridian Digital team</p>
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
        f"— The Meridian Digital team"
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


def send_campaign_to_owner(
    campaign_data: dict,
    customer_email: str,
    submission: dict | None = None,
    campaign_id: int | None = None,
) -> bool:
    """Email the operator (Joe) a full breakdown of an approved campaign.

    Used while we wait for Google/Meta API access: this is what Joe reads to
    set up the customer's ads in Google Ads Manager and Meta Business Suite
    by hand. Once API access lands, this stays on as an audit trail /
    "heads up, a customer just approved" notification.
    """
    business_name = campaign_data.get("business_name") or "(no name)"
    subject = f"[Action required] New campaign approved — {business_name}"
    text = _format_owner_campaign_text(
        campaign_data, customer_email, submission, campaign_id
    )
    # HTML version is the same text wrapped in a <pre> so email clients
    # preserve alignment, with a minimal header above.
    escaped = html_mod.escape(text)
    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 720px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">New campaign approved</h2>
      <p style="color:#444;">
        <strong>{html_mod.escape(business_name)}</strong> just approved their
        campaign. Details below &mdash; copy sections straight into Google Ads
        Manager and Meta Business Suite to get them set up.
      </p>
      <pre style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;
                  padding:16px;font-family: ui-monospace, Menlo, monospace;
                  font-size:13px;line-height:1.5;white-space:pre-wrap;
                  word-wrap:break-word;color:#1a1a2e;">{escaped}</pre>
    </div>
    """
    return send_email(OWNER_EMAIL, subject, html, text)


def _format_owner_campaign_text(
    campaign_data: dict,
    customer_email: str,
    submission: dict | None,
    campaign_id: int | None,
) -> str:
    """Build the plain-text body for the owner notification email."""
    sub = submission or {}
    business_name = campaign_data.get("business_name") or "(no name)"
    bar = "═" * 60
    thin = "─" * 60

    lines = [
        f"NEW CAMPAIGN APPROVED — {business_name}",
        bar,
        "",
        f"Customer email : {customer_email}",
        f"Business       : {business_name}",
        f"Website        : {sub.get('website_url') or '(not provided)'}",
        f"Phone          : {sub.get('phone_number') or '(not provided)'}",
        f"Service area   : {sub.get('service_area') or '(not specified)'}",
        f"Monthly budget : £{sub.get('monthly_budget', '?')}",
        f"Goal           : {sub.get('goal') or '(not set)'}",
        f"Target audience: {sub.get('target_audience') or '(not specified)'}",
    ]
    if campaign_id is not None:
        lines.append(f"Review online  : {APP_URL}/campaign/{campaign_id}")

    lines += [
        "",
        "WHAT TO DO NEXT",
        thin,
        "  1. Log in to Google Ads Manager (ads.google.com) and create the",
        "     campaign below",
        "  2. Log in to Meta Business Suite (business.facebook.com) and",
        "     create the Meta campaign below",
        "  3. Reply to this email with the platform campaign IDs so we can",
        "     track them",
        "",
    ]

    g = campaign_data.get("google_ads")
    if g:
        lines += _format_google_section(g, thin)

    m = campaign_data.get("meta_ads")
    if m:
        lines += _format_meta_section(m, thin)

    lines += [
        thin,
        "STRATEGY NOTES",
        thin,
        "",
        campaign_data.get("strategy_notes") or "(none)",
        "",
        f"Estimated monthly leads: {campaign_data.get('estimated_monthly_leads') or '(not estimated)'}",
        "",
    ]
    return "\n".join(lines)


def _format_google_section(g: dict, thin: str) -> list[str]:
    lines = [
        thin,
        "GOOGLE ADS",
        thin,
        "",
        f"Campaign name : {g.get('campaign_name', '(no name)')}",
        f"Type          : {g.get('campaign_type', '(not set)')}",
        f"Daily budget  : £{g.get('daily_budget_gbp', '?')}",
        f"Bidding       : {g.get('bidding_strategy', '(not set)')}",
        f"Locations     : {', '.join(g.get('location_targeting') or []) or '(none)'}",
        "",
        "Ad Groups & Keywords:",
    ]
    for i, group in enumerate(g.get("ad_groups") or [], 1):
        lines.append("")
        lines.append(f"  [{i}] {group.get('name', '(unnamed)')} — {group.get('theme', '')}")
        lines.append("      Keywords:")
        for kw in group.get("keywords") or []:
            lines.append(f"        • [{kw.get('match_type', 'broad')}] {kw.get('keyword', '')}")
        neg = group.get("negative_keywords") or []
        if neg:
            lines.append("      Negative keywords:")
            for nk in neg:
                lines.append(f"        • {nk}")

    lines += ["", "Ads:"]
    for i, ad in enumerate(g.get("ads") or [], 1):
        lines.append("")
        lines.append(f"  [{i}] For ad group: {ad.get('ad_group', '')}")
        lines.append("      Headlines (use 3–15, max 30 chars each):")
        for h in ad.get("headlines") or []:
            lines.append(f"        • {h}")
        lines.append("      Descriptions (use 2–4, max 90 chars each):")
        for d in ad.get("descriptions") or []:
            lines.append(f"        • {d}")

    callouts = g.get("callout_extensions") or []
    if callouts:
        lines += ["", "Callout Extensions (max 25 chars each):"]
        for c in callouts:
            lines.append(f"  • {c}")

    sitelinks = g.get("sitelink_extensions") or []
    if sitelinks:
        lines += ["", "Sitelink Extensions:"]
        for i, sl in enumerate(sitelinks, 1):
            lines.append("")
            lines.append(
                f"  [{i}] {sl.get('link_text', '')} → {sl.get('final_url_path', '')}"
            )
            lines.append(f"      {sl.get('description_1', '')}")
            lines.append(f"      {sl.get('description_2', '')}")

    lines.append("")
    return lines


def _format_meta_section(m: dict, thin: str) -> list[str]:
    lines = [
        thin,
        "META ADS",
        thin,
        "",
        f"Campaign name : {m.get('campaign_name', '(no name)')}",
        f"Objective     : {m.get('campaign_objective', '(not set)')}",
        f"Daily budget  : £{m.get('daily_budget_gbp', '?')}",
        "",
    ]
    aud = m.get("audience") or {}
    lines += [
        "Audience:",
        f"  Ages       : {aud.get('age_min', '?')}–{aud.get('age_max', '?')}",
        f"  Gender     : {aud.get('genders', 'all')}",
        f"  Interests  : {', '.join(aud.get('interests') or []) or '(none)'}",
        f"  Behaviours : {', '.join(aud.get('behaviours') or []) or '(none)'}",
        f"  Locations  : {', '.join(aud.get('locations') or []) or '(none)'}",
        f"  Lookalike  : {aud.get('lookalike_suggestion') or '(none)'}",
        "",
        "Ads:",
    ]
    for i, ad in enumerate(m.get("ads") or [], 1):
        lines.append("")
        lines.append(
            f"  [{i}] {ad.get('ad_name', '(unnamed)')} "
            f"({ad.get('ad_format', 'single_image')}, "
            f"CTA: {ad.get('call_to_action', '')})"
        )
        lines.append(f"      Primary text:")
        for line in (ad.get("primary_text") or "").split("\n"):
            lines.append(f"        {line}")
        lines.append(f"      Headline   : {ad.get('headline', '')}")
        lines.append(f"      Description: {ad.get('description', '')}")
        lines.append(f"      Visual brief:")
        for line in (ad.get("visual_brief") or "").split("\n"):
            lines.append(f"        {line}")

    placements = m.get("placement_recommendations") or []
    if placements:
        lines += ["", "Placement recommendations:"]
        for p in placements:
            lines.append(f"  • {p}")

    lines.append("")
    return lines


def send_campaign_approved(to: str, business_name: str) -> bool:
    subject = f"Campaign approved — {business_name} ads going live"
    text = (
        f"Your campaign for {business_name} has been approved.\n\n"
        f"We'll set up your Google Ads and Meta Ads within 24 hours and email you "
        f"when they're live.\n\n"
        f"— The Meridian Digital team"
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
      <p style="color:#6b7280;font-size:14px;">— The Meridian Digital team</p>
    </div>
    """
    return send_email(to, subject, html, text)
