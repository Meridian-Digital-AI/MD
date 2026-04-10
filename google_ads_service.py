"""Google Ads API integration — push campaigns from CampaignDraft to Google Ads.

Backends:
  - console (default): logs all API calls to stderr, returns dry-run IDs.
  - live: uses google-ads Python client to create real campaigns.

Env vars (live mode only):
  GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET,
  GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_LOGIN_CUSTOMER_ID
"""

from __future__ import annotations

import os
import sys
import json
import uuid
from typing import Optional

from models import GoogleAdsCampaign, PushResult

BACKEND = os.environ.get("ADS_PUSH_BACKEND", "console").lower()


def push_google_campaign(
    campaign: GoogleAdsCampaign,
    website_url: str | None = None,
    phone: str | None = None,
) -> PushResult:
    """Push a Google Ads campaign to the configured backend."""
    if BACKEND == "live":
        return _push_live(campaign, website_url, phone)
    return _push_console(campaign, website_url, phone)


# ─── Console (dry-run) backend ────────────────────────────────────────────────

def _log(msg):
    sys.stderr.write(msg + "\n")
    sys.stderr.flush()


def _push_console(
    campaign: GoogleAdsCampaign,
    website_url: str | None,
    phone: str | None,
) -> PushResult:
    dry_id = f"DRY-RUN-google-{uuid.uuid4().hex[:8]}"
    border = "─" * 60

    _log(f"\n{border}")
    _log(f"[GOOGLE ADS: console] Pushing campaign: {campaign.campaign_name}")
    _log(border)

    # 1. Budget
    daily_micros = int(campaign.daily_budget_gbp * 1_000_000)
    _log(f"\n1. CREATE CAMPAIGN BUDGET")
    _log(json.dumps({
        "name": f"{campaign.campaign_name} Budget",
        "amount_micros": daily_micros,
        "delivery_method": "STANDARD",
    }, indent=2))

    # 2. Campaign
    _log(f"\n2. CREATE CAMPAIGN")
    _log(json.dumps({
        "name": campaign.campaign_name,
        "advertising_channel_type": "SEARCH",
        "status": "PAUSED",
        "bidding_strategy": campaign.bidding_strategy,
        "location_targeting": campaign.location_targeting,
    }, indent=2))

    # 3. Ad groups
    for i, ag in enumerate(campaign.ad_groups, 1):
        _log(f"\n3.{i} CREATE AD GROUP: {ag.name}")
        _log(json.dumps({
            "name": ag.name,
            "theme": ag.theme,
            "keywords": [{"keyword": k.keyword, "match_type": k.match_type} for k in ag.keywords],
            "negative_keywords": ag.negative_keywords,
        }, indent=2))

    # 4. RSA ads
    for i, ad in enumerate(campaign.ads, 1):
        _log(f"\n4.{i} CREATE RESPONSIVE SEARCH AD for: {ad.ad_group}")
        _log(json.dumps({
            "ad_group": ad.ad_group,
            "headlines": ad.headlines,
            "descriptions": ad.descriptions,
            "final_urls": [website_url or "https://example.com"],
        }, indent=2))

    # 5. Extensions
    _log(f"\n5. CREATE CALLOUT EXTENSIONS")
    _log(json.dumps({"callouts": campaign.callout_extensions}, indent=2))

    _log(f"\n6. CREATE SITELINK EXTENSIONS")
    for sl in campaign.sitelink_extensions:
        _log(json.dumps({
            "link_text": sl.link_text,
            "description_1": sl.description_1,
            "description_2": sl.description_2,
            "final_url": f"{website_url or 'https://example.com'}{sl.final_url_path}",
        }, indent=2))

    _log(f"\n{border}")
    _log(f"[GOOGLE ADS: console] Dry-run complete. ID: {dry_id}")
    _log(f"Campaign created as PAUSED — switch to ENABLED when ready.")
    _log(f"{border}\n")

    return PushResult(
        platform="google_ads",
        success=True,
        platform_campaign_id=dry_id,
        details={
            "ad_groups_created": len(campaign.ad_groups),
            "ads_created": len(campaign.ads),
            "mode": "dry-run",
        },
    )


# ─── Live backend ─────────────────────────────────────────────────────────────

def _push_live(
    campaign: GoogleAdsCampaign,
    website_url: str | None,
    phone: str | None,
) -> PushResult:
    """Push a real campaign to Google Ads API."""
    try:
        from google.ads.googleads.client import GoogleAdsClient
        from google.ads.googleads.errors import GoogleAdsException
    except ImportError:
        return PushResult(
            platform="google_ads",
            success=False,
            errors=["google-ads package not installed. Run: pip install google-ads"],
        )

    customer_id = os.environ.get("GOOGLE_ADS_CUSTOMER_ID", "").replace("-", "")
    if not customer_id:
        return PushResult(
            platform="google_ads",
            success=False,
            errors=["GOOGLE_ADS_CUSTOMER_ID not set in .env"],
        )

    try:
        client = GoogleAdsClient.load_from_dict({
            "developer_token": os.environ.get("GOOGLE_ADS_DEVELOPER_TOKEN", ""),
            "client_id": os.environ.get("GOOGLE_ADS_CLIENT_ID", ""),
            "client_secret": os.environ.get("GOOGLE_ADS_CLIENT_SECRET", ""),
            "refresh_token": os.environ.get("GOOGLE_ADS_REFRESH_TOKEN", ""),
            "login_customer_id": os.environ.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID", customer_id),
            "use_proto_plus": True,
        })

        errors_list = []
        details = {}

        # 1. Create budget
        budget_service = client.get_service("CampaignBudgetService")
        budget_op = client.get_type("CampaignBudgetOperation")
        budget = budget_op.create
        budget.name = f"{campaign.campaign_name} Budget"
        budget.amount_micros = int(campaign.daily_budget_gbp * 1_000_000)
        budget.delivery_method = client.enums.BudgetDeliveryMethodEnum.STANDARD

        budget_response = budget_service.mutate_campaign_budgets(
            customer_id=customer_id, operations=[budget_op]
        )
        budget_rn = budget_response.results[0].resource_name
        details["budget_resource"] = budget_rn

        # 2. Create campaign
        campaign_service = client.get_service("CampaignService")
        campaign_op = client.get_type("CampaignOperation")
        camp = campaign_op.create
        camp.name = campaign.campaign_name
        camp.advertising_channel_type = client.enums.AdvertisingChannelTypeEnum.SEARCH
        camp.status = client.enums.CampaignStatusEnum.PAUSED
        camp.campaign_budget = budget_rn

        # Bidding strategy
        bs = campaign.bidding_strategy.lower()
        if "maximize conversions" in bs or "maximise conversions" in bs:
            camp.maximize_conversions.target_cpa_micros = 0
        elif "maximize clicks" in bs or "maximise clicks" in bs:
            camp.maximize_clicks.cpc_bid_ceiling_micros = 0
        elif "target cpa" in bs:
            camp.maximize_conversions.target_cpa_micros = 0
        else:
            camp.maximize_conversions.target_cpa_micros = 0

        campaign_response = campaign_service.mutate_campaigns(
            customer_id=customer_id, operations=[campaign_op]
        )
        campaign_rn = campaign_response.results[0].resource_name
        details["campaign_resource"] = campaign_rn

        # 3. Location targeting
        geo_service = client.get_service("GeoTargetConstantService")
        criterion_service = client.get_service("CampaignCriterionService")
        for loc_name in campaign.location_targeting:
            try:
                geo_request = client.get_type("SuggestGeoTargetConstantsRequest")
                geo_request.locale = "en"
                geo_request.country_code = "GB"
                geo_request.location_names.names.append(loc_name)
                geo_results = geo_service.suggest_geo_target_constants(request=geo_request)
                if geo_results.geo_target_constant_suggestions:
                    best = geo_results.geo_target_constant_suggestions[0]
                    crit_op = client.get_type("CampaignCriterionOperation")
                    crit = crit_op.create
                    crit.campaign = campaign_rn
                    crit.location.geo_target_constant = best.geo_target_constant.resource_name
                    criterion_service.mutate_campaign_criteria(
                        customer_id=customer_id, operations=[crit_op]
                    )
            except Exception as e:
                errors_list.append(f"Location '{loc_name}': {e}")

        # 4. Ad groups + keywords
        ag_service = client.get_service("AdGroupService")
        ag_crit_service = client.get_service("AdGroupCriterionService")
        ag_ad_service = client.get_service("AdGroupAdService")

        ag_resource_map = {}
        for ag in campaign.ad_groups:
            ag_op = client.get_type("AdGroupOperation")
            ag_obj = ag_op.create
            ag_obj.name = ag.name
            ag_obj.campaign = campaign_rn
            ag_obj.status = client.enums.AdGroupStatusEnum.ENABLED
            ag_obj.type_ = client.enums.AdGroupTypeEnum.SEARCH_STANDARD

            ag_response = ag_service.mutate_ad_groups(
                customer_id=customer_id, operations=[ag_op]
            )
            ag_rn = ag_response.results[0].resource_name
            ag_resource_map[ag.name] = ag_rn

            # Keywords
            kw_ops = []
            for kw in ag.keywords:
                kw_op = client.get_type("AdGroupCriterionOperation")
                kw_crit = kw_op.create
                kw_crit.ad_group = ag_rn
                kw_crit.status = client.enums.AdGroupCriterionStatusEnum.ENABLED
                kw_crit.keyword.text = kw.keyword
                match_map = {
                    "broad": client.enums.KeywordMatchTypeEnum.BROAD,
                    "phrase": client.enums.KeywordMatchTypeEnum.PHRASE,
                    "exact": client.enums.KeywordMatchTypeEnum.EXACT,
                }
                kw_crit.keyword.match_type = match_map.get(
                    kw.match_type, client.enums.KeywordMatchTypeEnum.BROAD
                )
                kw_ops.append(kw_op)

            # Negative keywords
            for neg in ag.negative_keywords:
                neg_op = client.get_type("AdGroupCriterionOperation")
                neg_crit = neg_op.create
                neg_crit.ad_group = ag_rn
                neg_crit.negative = True
                neg_crit.keyword.text = neg
                neg_crit.keyword.match_type = client.enums.KeywordMatchTypeEnum.BROAD
                kw_ops.append(neg_op)

            if kw_ops:
                ag_crit_service.mutate_ad_group_criteria(
                    customer_id=customer_id, operations=kw_ops
                )

        # 5. RSA ads
        for rsa in campaign.ads:
            ag_rn = ag_resource_map.get(rsa.ad_group)
            if not ag_rn:
                errors_list.append(f"No ad group resource for '{rsa.ad_group}'")
                continue

            ad_op = client.get_type("AdGroupAdOperation")
            ad_obj = ad_op.create
            ad_obj.ad_group = ag_rn
            ad_obj.status = client.enums.AdGroupAdStatusEnum.ENABLED
            ad_obj.ad.final_urls.append(website_url or "https://example.com")

            for h in rsa.headlines[:15]:
                headline_asset = client.get_type("AdTextAsset")
                headline_asset.text = h[:30]
                ad_obj.ad.responsive_search_ad.headlines.append(headline_asset)

            for d in rsa.descriptions[:4]:
                desc_asset = client.get_type("AdTextAsset")
                desc_asset.text = d[:90]
                ad_obj.ad.responsive_search_ad.descriptions.append(desc_asset)

            ag_ad_service.mutate_ad_group_ads(
                customer_id=customer_id, operations=[ad_op]
            )

        # 6. Callout extensions
        asset_service = client.get_service("AssetService")
        camp_asset_service = client.get_service("CampaignAssetService")
        for callout in campaign.callout_extensions:
            try:
                asset_op = client.get_type("AssetOperation")
                asset_op.create.name = callout[:25]
                asset_op.create.callout_asset.callout_text = callout[:25]
                asset_resp = asset_service.mutate_assets(
                    customer_id=customer_id, operations=[asset_op]
                )
                asset_rn = asset_resp.results[0].resource_name

                link_op = client.get_type("CampaignAssetOperation")
                link_op.create.campaign = campaign_rn
                link_op.create.asset = asset_rn
                link_op.create.field_type = client.enums.AssetFieldTypeEnum.CALLOUT
                camp_asset_service.mutate_campaign_assets(
                    customer_id=customer_id, operations=[link_op]
                )
            except Exception as e:
                errors_list.append(f"Callout '{callout}': {e}")

        google_campaign_id = campaign_rn.split("/")[-1] if "/" in campaign_rn else campaign_rn
        return PushResult(
            platform="google_ads",
            success=True,
            platform_campaign_id=google_campaign_id,
            errors=errors_list,
            details=details,
        )

    except GoogleAdsException as ex:
        error_msgs = [
            f"{err.error_code}: {err.message}" for err in ex.failure.errors
        ]
        return PushResult(
            platform="google_ads",
            success=False,
            errors=error_msgs,
        )
    except Exception as e:
        return PushResult(
            platform="google_ads",
            success=False,
            errors=[str(e)],
        )
