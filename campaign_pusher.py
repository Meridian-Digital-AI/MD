"""Orchestrate pushing approved campaigns to Google Ads + Meta Ads."""

import json
import database as db
import google_ads_service
import meta_ads_service
import email_service
from models import CampaignDraft


def push_campaign_live(campaign_id: int) -> dict:
    """Push an approved campaign to both ad platforms.

    Returns dict with google_result and meta_result PushResult objects.
    """
    campaign = db.get_campaign(campaign_id)
    if not campaign:
        raise ValueError(f"Campaign {campaign_id} not found")

    data = CampaignDraft.model_validate(json.loads(campaign["campaign_json"]))
    platforms = data.platforms

    # Get submission for website/phone
    sub = db.get_submission(campaign["submission_id"])
    website_url = sub.get("website_url") if sub else None
    phone = sub.get("phone_number") if sub else None

    results = {}

    # Push to Google Ads (only if selected)
    if "google_ads" in platforms and data.google_ads:
        db.update_push_status(campaign_id, "google", "pushing")
        try:
            google_result = google_ads_service.push_google_campaign(
                data.google_ads, website_url, phone
            )
            db.update_push_status(
                campaign_id, "google",
                "live" if google_result.success else "failed",
                google_result.platform_campaign_id,
                "; ".join(google_result.errors) if google_result.errors else None,
            )
            results["google"] = google_result
        except Exception as e:
            db.update_push_status(campaign_id, "google", "failed", error=str(e))
            results["google"] = None
    else:
        db.update_push_status(campaign_id, "google", "skipped")

    # Push to Meta Ads (only if selected)
    if "meta_ads" in platforms and data.meta_ads:
        db.update_push_status(campaign_id, "meta", "pushing")
        try:
            meta_result = meta_ads_service.push_meta_campaign(
                data.meta_ads, website_url
            )
            db.update_push_status(
                campaign_id, "meta",
                "live" if meta_result.success else "failed",
                meta_result.platform_campaign_id,
                "; ".join(meta_result.errors) if meta_result.errors else None,
            )
            results["meta"] = meta_result
        except Exception as e:
            db.update_push_status(campaign_id, "meta", "failed", error=str(e))
            results["meta"] = None
    else:
        db.update_push_status(campaign_id, "meta", "skipped")

    # Determine overall status (only count selected platforms)
    selected_results = []
    if "google_ads" in platforms:
        selected_results.append(results.get("google") and results["google"].success)
    if "meta_ads" in platforms:
        selected_results.append(results.get("meta") and results["meta"].success)

    if all(selected_results):
        overall = "live"
    elif any(selected_results):
        overall = "partially_live"
    else:
        overall = "push_failed"

    db.update_campaign_push_result(campaign_id, overall)

    # Send notification email
    try:
        conn = db.get_db()
        cust = conn.execute(
            "SELECT email FROM customers WHERE id = ?",
            (campaign["customer_id"],),
        ).fetchone()
        conn.close()
        if cust:
            email_service.send_campaign_approved(
                cust["email"], data.business_name
            )
    except Exception:
        pass

    return results
