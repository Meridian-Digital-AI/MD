import type { Metadata } from 'next';
import { Calendar, MapPin, Package, Users } from 'lucide-react';
import { pricingTiers, websiteOnlyTiers, addonPricing, commitmentPerks } from '@/lib/data/pricing';
import PricingCard from '@/components/PricingCard';
import SectionHeading from '@/components/SectionHeading';
import ScrollFadeIn from '@/components/ScrollFadeIn';
import CTABanner from '@/components/CTABanner';
import GradientOrb from '@/components/GradientOrb';

export const metadata: Metadata = {
  title: 'What We Build | Meridian Digital',
  description:
    'Transparent pricing tiers for local businesses — managed websites with built-in automation, website-only packages, and paid ads add-ons.',
};

const perkIcons: Record<string, typeof Calendar> = {
  Calendar,
  MapPin,
  Package,
  Users,
};

export default function ServicesPage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="hero-gradient dot-grid relative isolate overflow-hidden py-24 px-6 lg:py-32">
        <GradientOrb className="-top-40 -right-40" color="blue" size={600} />
        <GradientOrb className="-bottom-40 -left-40" color="amber" size={500} />

        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-display font-sora text-white">What We Build</h1>
          <p className="text-body mt-6 text-gray-400">
            Modern websites with built-in automation — everything your business
            needs to grow online. Transparent pricing, no hidden fees.
          </p>
        </div>
      </section>

      {/* ── MANAGED TIERS ── */}
              <section className="bg-white py-24 px-6">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              overline="Managed Packages"
              title="Choose Your Growth Plan"
            />

            <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={
                    tier.highlighted
                      ? 'lg:-translate-y-4 lg:scale-[1.02]'
                      : ''
                  }
                >
                  <PricingCard
                    name={tier.name}
                    monthlyPrice={tier.monthlyPrice}
                    setupFee={tier.setupFee}
                    target={tier.target}
                    highlighted={tier.highlighted}
                    features={tier.features}
                    contractLength={tier.contractLength}
                    slug={tier.slug}
                  />
                </div>
              ))}
            </div>

            <p className="mt-10 text-center text-small text-gray-500 max-w-2xl mx-auto">
              All tiers include: 6-month minimum contract, website hosting &amp;
              SSL, ongoing maintenance, all automation infrastructure and
              updates.
            </p>
          </div>
        </section>

      {/* ── PAID ADS ADD-ON ── */}
              <section className="bg-gray-50 py-24 px-6">
          <div className="mx-auto max-w-4xl">
            <SectionHeading overline="Add-On" title="Add Paid Ads to Any Tier" />

            <div className="mt-12 rounded-xl border border-gray-200 bg-white p-8 lg:p-12">
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="text-center">
                  <p className="text-overline text-blue-600">Flat Fee</p>
                  <p className="mt-2 text-[2rem] font-bold text-gray-900">
                    &pound;{addonPricing.flatFee}
                  </p>
                  <p className="text-small text-gray-500">/month</p>
                </div>

                <div className="text-center">
                  <p className="text-overline text-blue-600">Min Ad Spend</p>
                  <p className="mt-2 text-[2rem] font-bold text-gray-900">
                    &pound;{addonPricing.minAdSpend}
                  </p>
                  <p className="text-small text-gray-500">/month</p>
                </div>

                <div className="text-center">
                  <p className="text-overline text-blue-600">
                    Above &pound;{addonPricing.percentageThreshold.toLocaleString()}
                  </p>
                  <p className="mt-2 text-[2rem] font-bold text-gray-900">
                    {addonPricing.percentageRate}%
                  </p>
                  <p className="text-small text-gray-500">
                    replaces flat fee
                  </p>
                </div>
              </div>

              <p className="mt-8 text-body text-gray-700">
                {addonPricing.description}
              </p>

              <p className="mt-4 text-small text-gray-500">
                For example, at &pound;2,000/month ad spend, your management fee
                is &pound;300 (15%) rather than the &pound;247 flat fee.
              </p>
            </div>
          </div>
        </section>

      {/* ── WEBSITE-ONLY ── */}
              <section className="bg-white py-24 px-6">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              overline="Website Only"
              title="Just Need a Website? No Problem."
            />

            <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
              {websiteOnlyTiers.map((tier) => (
                <div
                  key={tier.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-8"
                >
                  <h3 className="text-h3 text-gray-900">{tier.name}</h3>

                  <div className="mt-4">
                    <span className="text-[2rem] font-bold text-gray-900">
                      &pound;{tier.oneOffPrice.toLocaleString()}
                    </span>
                    <span className="text-small text-gray-500"> one-off</span>
                  </div>

                  <p className="mt-1 text-small text-gray-400">
                    + &pound;{tier.monthlyHosting}/month hosting
                  </p>

                  <p className="mt-4 text-body text-gray-700">
                    {tier.description}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-10 text-center text-small text-gray-500">
              Website-only clients can upgrade to a managed tier at any time.
            </p>
          </div>
        </section>

      {/* ── COMMITMENT PERKS ── */}
              <section className="bg-gray-50 py-16 px-6">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {commitmentPerks.map((perk) => {
                const Icon = perkIcons[perk.icon] ?? Calendar;
                return (
                  <div key={perk.id} className="text-center">
                    <Icon
                      className="mx-auto h-8 w-8 text-blue-600"
                      aria-hidden="true"
                    />
                    <p className="mt-3 font-bold text-gray-900">{perk.name}</p>
                    <p className="mt-1 text-small text-gray-500">
                      {perk.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      {/* ── CTA ── */}
              <CTABanner
          title="Not sure which plan is right?"
          subtitle="Book a free 15-minute call and we'll recommend the perfect package for your business."
          buttonText="Book Your Free Call"
          buttonHref="/contact#book"
        />
    </>
  );
}
