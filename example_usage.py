"""
Example: Generate an ad campaign for Aquablast Drain Services Ltd
Run with: python example_usage.py
Requires: ANTHROPIC_API_KEY environment variable
"""

from models import BusinessInfo
from campaign_builder import build_campaign, print_campaign_summary, save_campaign_json


def main():
    # Define the business
    business = BusinessInfo(
        business_name="Aquablast Drain Services Ltd",
        industry="Drainage & Plumbing Services",
        location="Plymouth, South West England",
        service_area="Plymouth, Exeter, Torquay, Newton Abbot, South Devon",
        monthly_budget_gbp=600.00,
        goal="leads",
        usps=[
            "24/7 emergency response",
            "No call-out fee",
            "CCTV drain surveys",
            "High-pressure water jetting",
            "Fully insured and accredited",
            "Same-day service available",
        ],
        target_audience="Homeowners and landlords aged 30–65 in South Devon with blocked drains or drainage problems",
        website_url="https://www.aquablastdrainservices.co.uk",
        phone_number="01752 000000",
        additional_context="Main competitors are large national firms. We win on speed and local expertise.",
    )

    print(f"\nGenerating campaign for: {business.business_name}")
    print("This may take 30–60 seconds (Claude is thinking through your campaign)...\n")

    # Generate the campaign
    campaign = build_campaign(business)

    # Print summary to terminal
    print_campaign_summary(campaign)

    # Save full JSON for later use (onboarding system, dashboard, etc.)
    save_campaign_json(campaign, "aquablast_campaign_draft.json")


if __name__ == "__main__":
    main()
