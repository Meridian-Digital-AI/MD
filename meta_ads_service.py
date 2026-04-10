"""Meta (Facebook/Instagram) Ads API integration — push campaigns from CampaignDraft.

Backends:
  - console (default): logs all API calls to stderr, returns dry-run IDs.
  - live: uses facebook-business SDK to create real campaigns.

Env vars (live mode only):
  META_APP_ID, META_APP_SECRET, META_ACCESS_TOKEN, META_AD_ACCOUNT_ID, META_PAGE_ID
"""

from __future__ import annotations

import os
import sys
import json
import uuid
from typing import Optional

from models import MetaAdsCampaign, PushResult

BACKEND = os.environ.get("ADS_PUSH_BACKEND", "console").lower()


def push_meta_campaign(
    campaign: MetaAdsCampaign,
    website_url: str | None = None,
    page_id: str | None = None,
) -> PushResult:
    """Push a Meta Ads campaign to the configured backend."""
    page_id = page_id or os.environ.get("META_PAGE_ID", "")
    if BACKEND == "live":
        return _push_live(campaign, website_url, page_id)
    return _push_console(campaign, website_url, page_id)


# ─── Console (dry-run) backend ────────────────────────────────────────────────

def _log(msg):
    sys.stderr.write(msg + "\n")
    sys.stderr.flush()


def _push_console(
    campaign: MetaAdsCampaign,
    website_url: str | None,
    page_id: str,
) -> PushResult:
    dry_id = f"DRY-RUN-meta-{uuid.uuid4().hex[:8]}"
    border = "─" * 60

    _log(f"\n{border}")
    _log(f"[META ADS: console] Pushing campaign: {campaign.campaign_name}")
    _log(border)

    # 1. Campaign
    _log(f"\n1. CREATE CAMPAIGN")
    _log(json.dumps({
        "name": campaign.campaign_name,
        "objective": campaign.campaign_objective,
        "status": "PAUSED",
        "special_ad_categories": [],
    }, indent=2))

    # 2. Ad set with targeting
    _log(f"\n2. CREATE AD SET")
    aud = campaign.audience
    _log(json.dumps({
        "name": f"{campaign.campaign_name} - Ad Set",
        "daily_budget": int(campaign.daily_budget_gbp * 100),
        "billing_event": "IMPRESSIONS",
        "optimization_goal": "LEAD_GENERATION" if campaign.campaign_objective == "LEAD_GENERATION" else "LINK_CLICKS",
        "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
        "targeting": {
            "age_min": aud.age_min,
            "age_max": aud.age_max,
            "genders": aud.genders,
            "geo_locations": aud.locations,
            "interests": aud.interests,
            "behaviours": aud.behaviours,
        },
        "placements": campaign.placement_recommendations,
        "lookalike_suggestion": aud.lookalike_suggestion,
    }, indent=2))

    # 3. Ad creatives + ads
    for i, ad in enumerate(campaign.ads, 1):
        _log(f"\n3.{i} CREATE AD CREATIVE + AD: {ad.ad_name}")
        _log(json.dumps({
            "name": ad.ad_name,
            "format": ad.ad_format,
            "page_id": page_id or "(not set)",
            "primary_text": ad.primary_text,
            "headline": ad.headline,
            "description": ad.description,
            "call_to_action": ad.call_to_action,
            "link": website_url or "https://example.com",
            "visual_brief": ad.visual_brief,
            "note": "Image not uploaded — visual_brief describes desired creative",
        }, indent=2))

    _log(f"\n{border}")
    _log(f"[META ADS: console] Dry-run complete. ID: {dry_id}")
    _log(f"Campaign created as PAUSED — enable in Meta Ads Manager when ready.")
    _log(f"NOTE: Ad images need manual upload (visual briefs provided, no files).")
    _log(f"{border}\n")

    return PushResult(
        platform="meta_ads",
        success=True,
        platform_campaign_id=dry_id,
        details={
            "ads_created": len(campaign.ads),
            "image_note": "Visual briefs only — images need manual upload",
            "mode": "dry-run",
        },
    )


# ─── Live backend ─────────────────────────────────────────────────────────────

def _push_live(
    campaign: MetaAdsCampaign,
    website_url: str | None,
    page_id: str,
) -> PushResult:
    """Push a real campaign to Meta Ads API."""
    try:
        from facebook_business.api import FacebookAdsApi
        from facebook_business.adobjects.adaccount import AdAccount
        from facebook_business.adobjects.campaign import Campaign
        from facebook_business.adobjects.adset import AdSet
        from facebook_business.adobjects.adcreative import AdCreative
        from facebook_business.adobjects.ad import Ad
    except ImportError:
        return PushResult(
            platform="meta_ads",
            success=False,
            errors=["facebook-business package not installed. Run: pip install facebook-business"],
        )

    app_id = os.environ.get("META_APP_ID", "")
    app_secret = os.environ.get("META_APP_SECRET", "")
    access_token = os.environ.get("META_ACCESS_TOKEN", "")
    ad_account_id = os.environ.get("META_AD_ACCOUNT_ID", "")

    if not all([access_token, ad_account_id]):
        return PushResult(
            platform="meta_ads",
            success=False,
            errors=["META_ACCESS_TOKEN and META_AD_ACCOUNT_ID must be set in .env"],
        )

    try:
        FacebookAdsApi.init(app_id, app_secret, access_token)
        account = AdAccount(ad_account_id)
        errors_list = []
        details = {}

        # 1. Create campaign
        campaign_params = {
            Campaign.Field.name: campaign.campaign_name,
            Campaign.Field.objective: campaign.campaign_objective,
            Campaign.Field.status: Campaign.Status.paused,
            Campaign.Field.special_ad_categories: [],
        }
        meta_campaign = account.create_campaign(params=campaign_params)
        campaign_id = meta_campaign.get_id()
        details["campaign_id"] = campaign_id

        # 2. Build targeting spec
        aud = campaign.audience
        targeting = {
            "age_min": aud.age_min,
            "age_max": aud.age_max,
        }
        if aud.genders == "male":
            targeting["genders"] = [1]
        elif aud.genders == "female":
            targeting["genders"] = [2]

        # Resolve locations (best-effort — use city names)
        geo_locations = {"cities": [], "countries": ["GB"]}
        targeting["geo_locations"] = geo_locations

        # Resolve interests via Targeting Search API (best-effort)
        resolved_interests = []
        for interest_name in aud.interests:
            try:
                from facebook_business.adobjects.targetingsearch import TargetingSearch
                results = TargetingSearch.search(params={
                    "q": interest_name,
                    "type": "adinterest",
                })
                if results:
                    resolved_interests.append({"id": results[0]["id"], "name": results[0]["name"]})
            except Exception as e:
                errors_list.append(f"Interest '{interest_name}' not resolved: {e}")

        if resolved_interests:
            targeting["interests"] = resolved_interests

        # 3. Create ad set
        adset_params = {
            AdSet.Field.name: f"{campaign.campaign_name} - Ad Set",
            AdSet.Field.campaign_id: campaign_id,
            AdSet.Field.daily_budget: int(campaign.daily_budget_gbp * 100),
            AdSet.Field.billing_event: AdSet.BillingEvent.impressions,
            AdSet.Field.optimization_goal: AdSet.OptimizationGoal.lead_generation
                if campaign.campaign_objective == "LEAD_GENERATION"
                else AdSet.OptimizationGoal.link_clicks,
            AdSet.Field.bid_strategy: AdSet.BidStrategy.lowest_cost_without_cap,
            AdSet.Field.targeting: targeting,
            AdSet.Field.status: AdSet.Status.paused,
        }
        meta_adset = account.create_ad_set(params=adset_params)
        adset_id = meta_adset.get_id()
        details["adset_id"] = adset_id

        # 4. Create ads (creative + ad for each)
        CTA_MAP = {
            "Get Quote": "GET_QUOTE",
            "Learn More": "LEARN_MORE",
            "Book Now": "BOOK_NOW",
            "Call Now": "CALL_NOW",
            "Contact Us": "CONTACT_US",
            "Sign Up": "SIGN_UP",
            "Shop Now": "SHOP_NOW",
        }

        ad_ids = []
        for meta_ad in campaign.ads:
            try:
                cta_type = CTA_MAP.get(meta_ad.call_to_action, "LEARN_MORE")
                creative_params = {
                    AdCreative.Field.name: meta_ad.ad_name,
                    AdCreative.Field.object_story_spec: {
                        "page_id": page_id,
                        "link_data": {
                            "message": meta_ad.primary_text,
                            "name": meta_ad.headline,
                            "description": meta_ad.description,
                            "link": website_url or "https://example.com",
                            "call_to_action": {"type": cta_type},
                        },
                    },
                }
                creative = account.create_ad_creative(params=creative_params)

                ad_params = {
                    Ad.Field.name: meta_ad.ad_name,
                    Ad.Field.adset_id: adset_id,
                    Ad.Field.creative: {"creative_id": creative.get_id()},
                    Ad.Field.status: Ad.Status.paused,
                }
                ad = account.create_ad(params=ad_params)
                ad_ids.append(ad.get_id())
            except Exception as e:
                errors_list.append(f"Ad '{meta_ad.ad_name}': {e}")

        details["ads_created"] = len(ad_ids)
        details["image_note"] = "No images uploaded — visual briefs need manual creative upload"

        return PushResult(
            platform="meta_ads",
            success=True,
            platform_campaign_id=str(campaign_id),
            errors=errors_list,
            details=details,
        )

    except Exception as e:
        return PushResult(
            platform="meta_ads",
            success=False,
            errors=[str(e)],
        )
