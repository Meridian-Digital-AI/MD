import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShoppingCart,
  ListFilter,
  Award,
  UserPlus,
  Mail,
  Clock,
  Star,
  BarChart3,
} from 'lucide-react';
import { sectors, type Sector } from '@/lib/data/sectors';
import SectionHeading from '@/components/SectionHeading';
import ScrollFadeIn from '@/components/ScrollFadeIn';
import CTABanner from '@/components/CTABanner';
import GradientOrb from '@/components/GradientOrb';

const sector = sectors.find((s) => s.slug === 'restaurants') as Sector;

export const metadata: Metadata = {
  title: sector.metaTitle,
  description: sector.metaDescription,
};

const iconMap: Record<string, typeof ShoppingCart> = {
  ShoppingCart,
  ListFilter,
  Award,
  UserPlus,
  Mail,
  Clock,
  Star,
  BarChart3,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Meridian Digital',
  description: sector.metaDescription,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Exeter',
    addressRegion: 'Devon',
    addressCountry: 'UK',
  },
  priceRange: '££',
};

export default function RestaurantsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── HERO ── */}
      <section className="hero-gradient dot-grid relative isolate overflow-hidden py-24 px-6 lg:py-32">
        <GradientOrb className="-top-40 -right-40" color="blue" size={600} />
        <GradientOrb className="-bottom-40 -left-40" color="amber" size={500} />

        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-display font-sora text-white">
            {sector.heroHeadline}
          </h1>
          <p className="text-body mt-6 text-gray-400">
            {sector.heroSubheadline}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/contact#book" className="btn-primary">
              {sector.ctaText}
            </Link>
            {sector.demoAvailable && sector.demoLabel && (
              <Link href="/work" className="btn-ghost">
                {sector.demoLabel}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── COMMISSION COMPARISON ── */}
              <section className="bg-white py-16 px-6">
          <div className="mx-auto max-w-3xl">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-8 text-center">
                <p className="text-overline text-rose-600 mb-2">Just Eat</p>
                <p className="text-display font-sora text-rose-600">30%</p>
                <p className="text-body mt-2 text-rose-500">
                  commission per order
                </p>
              </div>
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-8 text-center">
                <p className="text-overline text-emerald-600 mb-2">
                  Your own site
                </p>
                <p className="text-display font-sora text-emerald-600">£0</p>
                <p className="text-body mt-2 text-emerald-500">
                  commission per order
                </p>
              </div>
            </div>
          </div>
        </section>

      {/* ── PAIN POINTS ── */}
              <section className="bg-white py-24 px-6">
          <div className="mx-auto max-w-4xl">
            <SectionHeading overline="The Problem" title="Sound Familiar?" />
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {sector.painPoints.map((point) => (
                <article
                  key={point.title}
                  className="rounded-xl border border-gray-200 border-l-4 border-l-rose-400 bg-gray-50 p-8"
                >
                  <h3 className="text-h3 font-sora text-gray-900">
                    {point.title}
                  </h3>
                  <p className="text-body mt-3 text-gray-500">
                    {point.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

      {/* ── WHAT WE BUILD ── */}
              <section className="bg-gray-50 py-24 px-6">
          <div className="mx-auto max-w-5xl">
            <SectionHeading
              overline="The Solution"
              title={`What We Build for ${sector.name}`}
            />
            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sector.features.map((feature) => {
                const Icon = iconMap[feature.icon];
                return (
                  <article
                    key={feature.title}
                    className="card-hover rounded-xl border border-gray-200 bg-white p-6"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10">
                      {Icon && (
                        <Icon
                          className="h-8 w-8 text-blue-600"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <h3 className="text-h3 mt-4 font-sora text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="text-small mt-2 text-gray-500">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

      {/* ── PROOF / PROJECTION ── */}
              <section className="bg-white py-16 px-6">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl bg-navy-900 p-8 text-center lg:p-12">
              <h2 className="text-h1 font-sora text-white">
                {sector.proofHeadline}
              </h2>
              <p className="text-body mt-4 text-gray-400">
                {sector.proofDescription}
              </p>
            </div>
          </div>
        </section>

      {/* ── DEMO LINK ── */}
              <section className="bg-gray-50 py-16 px-6">
          <div className="mx-auto max-w-2xl text-center">
            {sector.demoAvailable ? (
              <>
                <p className="text-h3 font-sora text-gray-900">
                  See it in action
                </p>
                <Link href="/work" className="btn-primary mt-6 inline-flex">
                  {sector.demoLabel}
                </Link>
              </>
            ) : (
              <p className="text-body text-gray-500">
                Demo coming soon — ask us for a walkthrough on your discovery
                call.
              </p>
            )}
          </div>
        </section>

      {/* ── CTA BANNER ── */}
              <CTABanner
          title={`Ready to transform your ${sector.name.toLowerCase()}?`}
          subtitle="Book a free 15-minute call and we'll show you exactly what we'd build."
          buttonText="Book Your Free Call"
          buttonHref="/contact#book"
        />
    </>
  );
}
