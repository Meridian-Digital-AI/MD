"""
AI Campaign Builder
Generates Google Ads and Meta Ads campaigns from business information
using Claude Opus 4.6 with adaptive thinking and structured output.
"""

from __future__ import annotations

import os
import json
import anthropic
from models import BusinessInfo, CampaignDraft, GoogleAdsCampaign, MetaAdsCampaign


SYSTEM_PROMPT = """You are an expert digital advertising strategist with deep expertise in
Google Ads and Meta (Facebook/Instagram) Ads. You build high-performing ad campaigns for
local and regional businesses in the UK.

Your campaigns must:
- Be highly targeted to the business's service area and audience
- Use proven ad copy frameworks (problem-agitate-solution, social proof, urgency)
- Follow Google Ads and Meta Ads best practices and character limits
- Be realistic about budget allocation and expected results
- Include specific, relevant keywords — not generic ones

For Google Ads:
- Headlines must be max 30 characters each
- Descriptions must be max 90 characters each
- Callout extensions must be max 25 characters each
- Sitelink link text must be max 25 characters each

For Meta Ads:
- Primary text should be compelling and conversational
- Headline max 40 characters
- Description max 30 characters

Always think carefully about the business's specific situation, location, and competitive landscape."""


def _business_context(business: BusinessInfo, google_daily: float, meta_daily: float) -> str:
    # Service area can be blank for e-commerce / online-only businesses.
    # When empty, signal that to Claude so it doesn't try to invent geo
    # targeting that wouldn't make sense.
    service_area_line = (
        f"Service Area: {business.service_area}"
        if business.service_area
        else "Service Area: (online / e-commerce, no fixed geographic area)"
    )
    return f"""Business Name: {business.business_name}
Industry: {business.industry}
Location: {business.location}
{service_area_line}
Monthly Ad Budget: £{business.monthly_budget_gbp:.2f}
Primary Goal: {business.goal}
Target Audience: {business.target_audience}
Unique Selling Points: {", ".join(business.usps)}
Website: {business.website_url or "Not provided"}
Phone: {business.phone_number or "Not provided"}
Additional Context: {business.additional_context or "None"}

Budget allocation (operator-set, not auto-split):
- Google Ads daily budget: £{google_daily}
- Meta Ads daily budget: £{meta_daily}"""


def _build_google_ads(client: anthropic.Anthropic, business: BusinessInfo, context: str) -> GoogleAdsCampaign:
    prompt = f"""{context}

Generate a Google Ads Search campaign including:
- 2–3 tightly themed ad groups with 8–12 keywords each (mix of phrase and exact match)
- 5–8 negative keywords per ad group
- 1 responsive search ad per ad group (8–12 headlines, 3–4 descriptions)
- 6–8 callout extensions
- 3–4 sitelink extensions
- Appropriate bidding strategy and location targeting"""

    response = client.messages.parse(
        model="claude-opus-4-6",
        max_tokens=16000,
        thinking={"type": "adaptive"},
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
        output_format=GoogleAdsCampaign,
    )
    result = response.parsed_output
    if result is None:
        # Show what Claude actually returned for debugging
        text = next((b.text for b in response.content if b.type == "text"), "")
        raise ValueError(f"Google Ads generation failed. stop_reason={response.stop_reason}. Response: {text[:500]}")
    return result


def _build_meta_ads(client: anthropic.Anthropic, business: BusinessInfo, context: str) -> MetaAdsCampaign:
    prompt = f"""{context}

Generate a Meta (Facebook/Instagram) Ads campaign including:
- Campaign objective suited to the business goal
- Detailed audience targeting (interests, behaviours, demographics, age range)
- 2–3 ad variations with different creative angles and formats
- Placement recommendations
- A visual brief for each ad describing what the image/video should show"""

    response = client.messages.parse(
        model="claude-opus-4-6",
        max_tokens=16000,
        thinking={"type": "adaptive"},
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
        output_format=MetaAdsCampaign,
    )
    result = response.parsed_output
    if result is None:
        text = next((b.text for b in response.content if b.type == "text"), "")
        raise ValueError(f"Meta Ads generation failed. stop_reason={response.stop_reason}. Response: {text[:500]}")
    return result


def build_campaign(business: BusinessInfo, platforms: list[str] = None) -> CampaignDraft:
    """
    Generate ad campaign drafts for selected platforms.
    Makes one API call per platform to keep schemas within limits.
    """
    if platforms is None:
        platforms = ["google_ads", "meta_ads"]

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    # Per-platform monthly budgets are operator-driven now (no auto-split).
    # Each platform's daily budget = (its monthly) / 30. Skipped platforms
    # (budget = 0) just generate with 0/day, which the caller can filter on.
    google_daily = round(business.google_monthly_budget / 30, 2) if business.google_monthly_budget else 0.0
    meta_daily = round(business.meta_monthly_budget / 30, 2) if business.meta_monthly_budget else 0.0
    context = _business_context(business, google_daily, meta_daily)

    google = None
    meta = None
    step = 1

    if "google_ads" in platforms:
        print(f"  [{step}/{len(platforms) + 1}] Generating Google Ads campaign...")
        google = _build_google_ads(client, business, context)
        step += 1

    if "meta_ads" in platforms:
        print(f"  [{step}/{len(platforms) + 1}] Generating Meta Ads campaign...")
        meta = _build_meta_ads(client, business, context)
        step += 1

    print(f"  [{step}/{len(platforms) + 1}] Generating strategy summary...")

    # Build summary prompt based on what was generated
    summary_parts = []
    if google:
        summary_parts.append(f"Google campaign: {google.campaign_name} with {len(google.ad_groups)} ad groups.")
    if meta:
        summary_parts.append(f"Meta campaign: {meta.campaign_name} targeting ages {meta.audience.age_min}-{meta.audience.age_max}.")

    platform_names = " and ".join(p.replace("_", " ").title().replace("Ads", "Ads") for p in platforms)
    strategy_response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"""{context}

I've built a {platform_names} campaign for this business.

{" ".join(summary_parts)}

Write 2-3 sentences of strategy notes explaining the overall approach,
and give a realistic estimated monthly leads figure (e.g. "15-30 leads").
Format as:
STRATEGY: <your notes>
LEADS: <your estimate>"""}],
    )

    strategy_text = next(
        (b.text for b in strategy_response.content if b.type == "text"), ""
    )
    strategy_notes = ""
    estimated_leads = ""
    for line in strategy_text.strip().split("\n"):
        if line.startswith("STRATEGY:"):
            strategy_notes = line.replace("STRATEGY:", "").strip()
        elif line.startswith("LEADS:"):
            estimated_leads = line.replace("LEADS:", "").strip()

    if not strategy_notes:
        strategy_notes = strategy_text.strip()
    if not estimated_leads:
        estimated_leads = "See strategy notes"

    return CampaignDraft(
        business_name=business.business_name,
        platforms=platforms,
        google_ads=google,
        meta_ads=meta,
        strategy_notes=strategy_notes,
        estimated_monthly_leads=estimated_leads,
    )


def print_campaign_summary(campaign: CampaignDraft) -> None:
    """Print a human-readable summary of the campaign draft."""
    print("\n" + "=" * 65)
    print(f"  CAMPAIGN DRAFT -- {campaign.business_name.upper()}")
    print(f"  Status: {campaign.approval_status.replace('_', ' ').title()}")
    print("=" * 65)

    print(f"\nSTRATEGY\n{campaign.strategy_notes}")
    print(f"\nEstimated Monthly Leads: {campaign.estimated_monthly_leads}")

    # Google Ads
    g = campaign.google_ads
    print(f"\n{'_' * 65}")
    print(f"GOOGLE ADS -- {g.campaign_name}")
    print(f"   Daily Budget: GBP{g.daily_budget_gbp} | Bidding: {g.bidding_strategy}")
    print(f"   Location Targeting: {', '.join(g.location_targeting)}")

    for group in g.ad_groups:
        print(f"\n   Ad Group: {group.name}")
        print(f"   Theme: {group.theme}")
        kw_list = [f"[{k.match_type}] {k.keyword}" for k in group.keywords[:5]]
        print(f"   Keywords (first 5): {', '.join(kw_list)}")

    print(f"\n   Callouts: {' | '.join(g.callout_extensions)}")

    for ad in g.ads:
        print(f"\n   RSA ({ad.ad_group}):")
        for i, h in enumerate(ad.headlines[:3], 1):
            print(f"     Headline {i}: {h}")
        for i, d in enumerate(ad.descriptions[:2], 1):
            print(f"     Description {i}: {d}")

    # Meta Ads
    m = campaign.meta_ads
    print(f"\n{'_' * 65}")
    print(f"META ADS -- {m.campaign_name}")
    print(f"   Objective: {m.campaign_objective} | Daily Budget: GBP{m.daily_budget_gbp}")
    aud = m.audience
    print(f"   Audience: Age {aud.age_min}-{aud.age_max}, {aud.genders}")
    print(f"   Interests: {', '.join(aud.interests[:5])}")
    print(f"   Placements: {', '.join(m.placement_recommendations)}")

    for ad in m.ads:
        print(f"\n   Ad: {ad.ad_name}")
        print(f"     Format: {ad.ad_format} | CTA: {ad.call_to_action}")
        print(f"     Primary: {ad.primary_text[:80]}{'...' if len(ad.primary_text) > 80 else ''}")
        print(f"     Headline: {ad.headline}")

    print("\n" + "=" * 65)
    print("  Ready for client review and approval before going live")
    print("=" * 65 + "\n")


def save_campaign_json(campaign: CampaignDraft, filepath: str) -> None:
    """Save the campaign draft as a JSON file."""
    with open(filepath, "w") as f:
        json.dump(campaign.model_dump(), f, indent=2)
    print(f"Campaign saved to: {filepath}")
