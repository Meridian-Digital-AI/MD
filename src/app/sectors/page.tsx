import type { Metadata } from 'next';
import Link from 'next/link';

import SectionHeading from '@/components/SectionHeading';
import SectorCard from '@/components/SectorCard';
import ScrollFadeIn from '@/components/ScrollFadeIn';
import GradientOrb from '@/components/GradientOrb';
import CTABanner from '@/components/CTABanner';
import { sectors } from '@/lib/data/sectors';

export const metadata: Metadata = {
  title: 'Industries We Serve | Meridian Digital',
  description:
    'We build modern websites and automation systems for restaurants, garages, salons, cleaning companies, and dry cleaners across Exeter and Devon.',
};

export default function SectorsPage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="hero-gradient dot-grid relative overflow-hidden py-24 px-6 lg:py-32">
        <GradientOrb className="-top-40 -right-40" color="blue" size={600} />
        <GradientOrb className="-bottom-40 -left-40" color="emerald" size={500} />

        <div className="relative mx-auto max-w-3xl text-center">
          <ScrollFadeIn>
            <h1 className="text-display font-sora text-white">
              Industries We Serve
            </h1>
            <p className="text-body mt-6 text-gray-400">
              Every local business is different. We build tailored websites and
              automation systems designed for the way your industry actually
              works.
            </p>
          </ScrollFadeIn>
        </div>
      </section>

      {/* ── SECTOR CARDS ── */}
      <section className="bg-white py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <ScrollFadeIn>
            <SectionHeading
              overline="Sectors"
              title="Built for Local Businesses Like Yours"
            />
          </ScrollFadeIn>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {sectors.map((sector) => (
              <ScrollFadeIn key={sector.id}>
                <SectorCard
                  name={sector.name}
                  slug={sector.slug}
                  icon={sector.icon}
                  shortDescription={sector.shortDescription}
                />
              </ScrollFadeIn>
            ))}
          </div>

          <ScrollFadeIn>
            <p className="mt-12 text-center text-body text-gray-500">
              Don&apos;t see your business type? We build for any local
              business.{' '}
              <Link
                href="/contact"
                className="font-semibold text-blue-600 underline transition-colors hover:text-blue-500"
              >
                Get in touch
              </Link>
            </p>
          </ScrollFadeIn>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <CTABanner
        title="Ready to grow your business online?"
        subtitle="Book a free 15-minute discovery call. No obligation, no jargon — just a conversation about what's possible."
        buttonText="Book Your Free Call"
        buttonHref="/contact#book"
      />
    </>
  );
}
