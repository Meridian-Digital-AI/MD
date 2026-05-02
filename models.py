from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field


# ─── Shared ───────────────────────────────────────────────────────────────────

class BusinessInfo(BaseModel):
    business_name: str
    industry: str
    location: str                        # e.g. "Bristol, South West England"
    # Optional — e-commerce / online-only businesses leave this blank.
    # When empty, the campaign builder treats the business as serving online
    # rather than a fixed geographic area.
    service_area: Optional[str] = ""     # e.g. "Bristol, Bath, Somerset" or "" for online-only
    # Per-platform monthly budgets — operator-driven, no auto-split. Either
    # can be 0 to skip that platform entirely. monthly_budget_gbp stays as the
    # legacy total field for downstream code (computed = google + meta).
    google_monthly_budget: float = 0.0
    meta_monthly_budget: float = 0.0
    monthly_budget_gbp: float            # total monthly ad spend budget
    goal: Literal["leads", "sales", "awareness"]
    usps: list[str]                      # unique selling points, e.g. ["24/7 service", "No call-out fee"]
    target_audience: str                 # free text, e.g. "homeowners aged 30-65 in Bristol"
    website_url: Optional[str] = None
    phone_number: Optional[str] = None
    additional_context: Optional[str] = None


# ─── Google Ads ───────────────────────────────────────────────────────────────

class Keyword(BaseModel):
    keyword: str
    match_type: Literal["broad", "phrase", "exact"]


class SitelinkExtension(BaseModel):
    link_text: str = Field(description="Max 25 characters")
    description_1: str = Field(description="Max 35 characters")
    description_2: str = Field(description="Max 35 characters")
    final_url_path: str = Field(description="Page path, e.g. /emergency or /contact")


class GoogleAdGroup(BaseModel):
    name: str
    theme: str                           # e.g. "Emergency Drain Unblocking"
    keywords: list[Keyword]
    negative_keywords: list[str]


class ResponsiveSearchAd(BaseModel):
    ad_group: str                        # which ad group this belongs to
    headlines: list[str] = Field(
        description="3 to 15 headlines, each max 30 characters"
    )
    descriptions: list[str] = Field(
        description="2 to 4 descriptions, each max 90 characters"
    )


class GoogleAdsCampaign(BaseModel):
    campaign_name: str
    campaign_type: str                   # e.g. "Search"
    daily_budget_gbp: float
    bidding_strategy: str                # e.g. "Maximise Conversions", "Target CPA"
    location_targeting: list[str]
    ad_groups: list[GoogleAdGroup]
    ads: list[ResponsiveSearchAd]
    callout_extensions: list[str] = Field(
        description="Short callouts, each max 25 characters"
    )
    sitelink_extensions: list[SitelinkExtension]


# ─── Meta Ads ─────────────────────────────────────────────────────────────────

class MetaAudience(BaseModel):
    age_min: int
    age_max: int
    genders: Literal["all", "male", "female"]
    interests: list[str]
    behaviours: list[str]
    locations: list[str]
    lookalike_suggestion: str            # e.g. "1% lookalike of website visitors"


class MetaAd(BaseModel):
    ad_name: str
    primary_text: str = Field(description="Main body copy, ideally under 125 characters for preview")
    headline: str = Field(description="Max 40 characters")
    description: str = Field(description="Max 30 characters, shown under headline")
    call_to_action: str                  # e.g. "Get Quote", "Learn More", "Book Now", "Call Now"
    ad_format: Literal["single_image", "carousel", "video"]
    visual_brief: str                    # Description of what the image/video should show


class MetaAdsCampaign(BaseModel):
    campaign_name: str
    campaign_objective: Literal[
        "LEAD_GENERATION",
        "TRAFFIC",
        "CONVERSIONS",
        "BRAND_AWARENESS",
        "REACH",
    ]
    daily_budget_gbp: float
    audience: MetaAudience
    ads: list[MetaAd]
    placement_recommendations: list[str]  # e.g. ["Facebook Feed", "Instagram Feed", "Stories"]


# ─── Combined Campaign Draft ──────────────────────────────────────────────────

class CampaignDraft(BaseModel):
    business_name: str
    platforms: list[str] = ["google_ads", "meta_ads"]  # selected platforms
    google_ads: Optional[GoogleAdsCampaign] = None
    meta_ads: Optional[MetaAdsCampaign] = None
    strategy_notes: str                  # AI reasoning about approach
    estimated_monthly_leads: str         # rough estimate, e.g. "15–30 leads"
    approval_status: Literal["pending_review"] = "pending_review"


# ─── Push Result ─────────────────────────────────────────────────────────────

class PushResult(BaseModel):
    platform: Literal["google_ads", "meta_ads"]
    success: bool
    platform_campaign_id: Optional[str] = None
    errors: list[str] = []
    details: dict = {}
