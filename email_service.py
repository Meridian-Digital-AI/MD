"""Email notification service with pluggable backends.

Backends:
  - console (default): prints emails to stdout. Great for dev — no API keys.
  - resend: sends real emails via Resend (https://resend.com).

Configure via env vars:
  EMAIL_BACKEND    = console | resend
  FROM_EMAIL       = "Meridian Digital <noreply@meridiandigital.co.uk>"
  RESEND_API_KEY   = re_xxxxx (only needed for resend backend)
"""

from __future__ import annotations

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
#
# Every customer-facing email is built by _layout() so headers, typography,
# CTA buttons, and the footer stay consistent. Writing email HTML is the
# worst — we aim for table-free flex-y structure that degrades gracefully
# in Outlook/Gmail alike, with generous inline styles because lots of
# email clients strip <style> tags.


def _layout(
    *,
    title: str,
    preheader: str,
    body_html: str,
    cta_label: str | None = None,
    cta_url: str | None = None,
    accent: str = "#4f8cff",
) -> str:
    """Wrap body_html in Meridian-branded email chrome.

    - preheader: hidden preview text that shows in inbox list views
    - accent:    colour for the top strip + CTA (blue by default; green for
                 approvals, amber for action-required, etc.)
    """
    cta_html = ""
    if cta_label and cta_url:
        cta_html = f"""
        <p style="margin:28px 0 8px;">
          <a href="{cta_url}" style="display:inline-block;background:{accent};
            color:#ffffff;padding:13px 26px;border-radius:8px;
            text-decoration:none;font-weight:600;font-size:15px;
            letter-spacing:0.01em;">{cta_label}</a>
        </p>"""

    return f"""\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html_mod.escape(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fb;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,
             'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;">
  <!-- Preheader: hidden but pulled into inbox preview -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    {html_mod.escape(preheader)}
  </div>

  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <!-- Brand strip -->
    <div style="background:{accent};height:4px;border-radius:4px 4px 0 0;"></div>

    <!-- Card -->
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;
                border-radius:0 0 12px 12px;padding:32px 36px;">
      <div style="font-family:'Sora',-apple-system,sans-serif;font-weight:700;
                  font-size:18px;color:#1a1a2e;margin-bottom:24px;
                  letter-spacing:-0.01em;">
        Meridian <span style="color:{accent};">Digital</span>
      </div>

      <div style="font-size:15px;line-height:1.6;color:#1f2937;">
        {body_html}
        {cta_html}
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top:24px;text-align:center;color:#6b7280;font-size:12px;
                line-height:1.6;">
      <div>Meridian Digital &middot; Exeter, Devon</div>
      <div>
        <a href="{APP_URL}/dashboard" style="color:#6b7280;text-decoration:underline;">Dashboard</a>
        &nbsp;&middot;&nbsp;
        <a href="{APP_URL}/privacy" style="color:#6b7280;text-decoration:underline;">Privacy</a>
        &nbsp;&middot;&nbsp;
        <a href="{APP_URL}/terms" style="color:#6b7280;text-decoration:underline;">Terms</a>
      </div>
      <div style="margin-top:6px;">
        Questions? Reply to this email &mdash; we read every one.
      </div>
    </div>
  </div>
</body>
</html>"""


def send_welcome(to: str, business_name: str) -> bool:
    subject = "Welcome to Meridian Digital — your campaign is coming"
    safe_name = html_mod.escape(business_name)
    text = (
        f"Hi {business_name},\n\n"
        f"Thanks for signing up to Meridian Digital! We're building your Google Ads "
        f"and Meta Ads campaigns right now.\n\n"
        f"You'll get another email as soon as your campaign is ready to review.\n\n"
        f"Dashboard: {APP_URL}/dashboard\n\n"
        f"— The Meridian Digital team"
    )
    body = f"""
      <h1 style="font-family:'Sora',sans-serif;font-size:22px;margin:0 0 16px;
                 color:#1a1a2e;font-weight:700;">Welcome aboard</h1>
      <p style="margin:0 0 14px;">Hi <strong>{safe_name}</strong>,</p>
      <p style="margin:0 0 14px;">
        Thanks for signing up. Our AI is building your Google Ads and Meta Ads
        campaigns right now &mdash; usually takes a couple of minutes.
      </p>
      <p style="margin:0 0 14px;">
        You&rsquo;ll get another email from us as soon as your campaign is ready
        to review. Nothing goes live until you approve it.
      </p>"""
    html = _layout(
        title="Welcome to Meridian Digital",
        preheader="Your campaign is being built right now — we'll email when it's ready to review.",
        body_html=body,
        cta_label="Open dashboard",
        cta_url=f"{APP_URL}/dashboard",
    )
    return send_email(to, subject, html, text)


def send_campaign_ready(to: str, business_name: str, campaign_id: int) -> bool:
    subject = f"Your {business_name} campaign is ready to review"
    review_url = f"{APP_URL}/campaign/{campaign_id}"
    safe_name = html_mod.escape(business_name)
    text = (
        f"Good news — your AI-generated ad campaign is ready!\n\n"
        f"Review and approve it here: {review_url}\n\n"
        f"Once approved, we'll set it up on Google Ads and Meta Ads within 24 hours.\n\n"
        f"— The Meridian Digital team"
    )
    body = f"""
      <h1 style="font-family:'Sora',sans-serif;font-size:22px;margin:0 0 16px;
                 color:#1a1a2e;font-weight:700;">Your campaign is ready</h1>
      <p style="margin:0 0 14px;">
        Good news &mdash; your AI-generated campaign for
        <strong>{safe_name}</strong> is ready to review.
      </p>
      <p style="margin:0 0 14px;">
        Take a look at the Google Ads keywords, ad copy, Meta audience
        targeting, and creative briefs. Tweak anything you&rsquo;d like, then
        approve it in a single click.
      </p>
      <p style="margin:0 0 14px;color:#6b7280;font-size:14px;">
        Once approved, we&rsquo;ll set it up on Google Ads and Meta Ads within
        24 hours.
      </p>"""
    html = _layout(
        title="Your campaign is ready",
        preheader=f"Review and approve the {business_name} campaign whenever you're ready.",
        body_html=body,
        cta_label="Review campaign",
        cta_url=review_url,
    )
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
    safe_name = html_mod.escape(business_name)
    safe_email = html_mod.escape(customer_email)
    escaped = html_mod.escape(text)
    body = f"""
      <h1 style="font-family:'Sora',sans-serif;font-size:22px;margin:0 0 8px;
                 color:#1a1a2e;font-weight:700;">Action required &mdash; new campaign approved</h1>
      <p style="margin:0 0 14px;color:#6b7280;font-size:13px;">
        <strong>{safe_name}</strong> ({safe_email}) just approved their
        campaign. Full breakdown below &mdash; copy sections straight into
        Google Ads Manager and Meta Business Suite.
      </p>
      <pre style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;
                  padding:16px;font-family:ui-monospace,Menlo,Consolas,monospace;
                  font-size:12.5px;line-height:1.55;white-space:pre-wrap;
                  word-wrap:break-word;color:#1a1a2e;margin:0;">{escaped}</pre>"""
    cta_url = f"{APP_URL}/campaign/{campaign_id}" if campaign_id is not None else None
    html = _layout(
        title=f"Action required: {business_name}",
        preheader=f"{business_name} just approved — copy into Google Ads + Meta Business Suite.",
        body_html=body,
        cta_label="Open in dashboard" if cta_url else None,
        cta_url=cta_url,
        accent="#d97706",  # amber — this is an action-required alert
    )
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
    safe_name = html_mod.escape(business_name)
    text = (
        f"Your campaign for {business_name} has been approved.\n\n"
        f"We'll set up your Google Ads and Meta Ads within 24 hours and email you "
        f"when they're live.\n\n"
        f"— The Meridian Digital team"
    )
    body = f"""
      <h1 style="font-family:'Sora',sans-serif;font-size:22px;margin:0 0 16px;
                 color:#1a1a2e;font-weight:700;">Campaign approved</h1>
      <p style="margin:0 0 14px;">
        Your campaign for <strong>{safe_name}</strong> has been approved &mdash;
        thanks for the go-ahead.
      </p>
      <p style="margin:0 0 14px;">
        We&rsquo;ll set it up on Google Ads and Meta Ads within 24 hours.
        You&rsquo;ll get one more email from us as soon as your ads are live.
      </p>
      <p style="margin:0;color:#6b7280;font-size:14px;">
        Need to change something before it goes live? Just reply to this email.
      </p>"""
    html = _layout(
        title="Campaign approved",
        preheader=f"Your {business_name} campaign is approved and going live within 24 hours.",
        body_html=body,
        cta_label="View dashboard",
        cta_url=f"{APP_URL}/dashboard",
        accent="#22c55e",  # green for good news
    )
    return send_email(to, subject, html, text)
