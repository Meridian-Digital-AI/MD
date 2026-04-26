import type { Metadata } from 'next';
import { Monitor, Zap, Headphones, Scissors, Sparkles, Shirt } from 'lucide-react';
import { demos } from '@/lib/data/demos';
import DemoCard from '@/components/DemoCard';
import SectionHeading from '@/components/SectionHeading';
import ScrollFadeIn from '@/components/ScrollFadeIn';
import CTABanner from '@/components/CTABanner';
import GradientOrb from '@/components/GradientOrb';

export const metadata: Metadata = {
  title: 'Our Work | Meridian Digital',
  description:
    'See what we build — complete business systems with websites, automation, and ongoing support for local businesses.',
};

const includedItems = [
  {
    icon: Monitor,
    label: 'Website',
    description: 'Custom-designed, fast, and mobile-first — built to convert visitors into customers.',
  },
  {
    icon: Zap,
    label: 'Automation',
    description: 'Bookings, reminders, loyalty, reviews — running 24/7 behind the scenes.',
  },
  {
    icon: Headphones,
    label: 'Ongoing Support',
    description: 'Regular check-ins, updates, and strategy calls to keep everything growing.',
  },
];

const comingSoon = [
  { icon: Scissors, sector: 'Salons' },
  { icon: Sparkles, sector: 'Cleaning' },
  { icon: Shirt, sector: 'Dry Cleaners' },
];

export default function WorkPage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="hero-gradient dot-grid relative isolate overflow-hidden py-24 px-6 lg:py-32">
        <GradientOrb className="-top-40 -right-40" color="blue" size={600} />
        <GradientOrb className="-bottom-40 -left-40" color="amber" size={500} />

        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-display font-sora text-white">Our Work</h1>
          <p className="text-body mt-6 text-gray-400">
            See what we build. These are complete business systems — websites
            with built-in automation, not just brochure sites.
          </p>
        </div>
      </section>

      {/* ── DEMO PROJECTS ── */}
              <section className="bg-white py-24 px-6">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {demos.map((demo) => (
                <DemoCard
                  key={demo.id}
                  name={demo.name}
                  businessType={demo.businessType}
                  features={demo.features}
                  description={demo.description}
                  gradientFrom={demo.gradientFrom}
                  gradientTo={demo.gradientTo}
                  demoUrl={demo.demoUrl}
                  screenshotAlt={demo.screenshotAlt}
                  slug={demo.slug}
                  caseStudyAvailable={demo.slug === 'oriental-city' || demo.slug === 'parkside-garage'}
                />
              ))}
            </div>
          </div>
        </section>

      {/* ── WHAT'S INCLUDED ── */}
              <section className="bg-gray-50 py-24 px-6">
          <div className="mx-auto max-w-4xl">
            <SectionHeading title="More Than Just Websites" />

            <p className="mt-6 text-center text-body text-gray-700 max-w-2xl mx-auto">
              These aren&apos;t just websites — they&apos;re complete business
              systems. The ordering flow, the reminders, the loyalty programme,
              the review requests — it all runs automatically behind the scenes.
            </p>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {includedItems.map((item) => (
                <div key={item.label} className="text-center">
                  <item.icon
                    className="mx-auto h-10 w-10 text-blue-600"
                    aria-hidden="true"
                  />
                  <h3 className="mt-4 text-h3 text-gray-900">{item.label}</h3>
                  <p className="mt-2 text-small text-gray-500">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

      {/* ── COMING SOON ── */}
              <section className="bg-white py-24 px-6">
          <div className="mx-auto max-w-4xl">
            <SectionHeading
              overline="Coming Soon"
              title="More Demos on the Way"
            />

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {comingSoon.map((item) => (
                <div
                  key={item.sector}
                  className="flex flex-col items-center rounded-xl border border-gray-200 bg-gray-50 p-8 text-center"
                >
                  <item.icon
                    className="h-10 w-10 text-gray-400"
                    aria-hidden="true"
                  />
                  <h3 className="mt-4 text-h3 text-gray-900">{item.sector}</h3>
                  <span className="mt-3 text-overline text-amber-400">
                    Coming Soon
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

      {/* ── CTA ── */}
              <CTABanner
          title="Like what you see?"
          subtitle="Book a call and we'll show you exactly what we'd build for your business."
          buttonText="Book Your Free Call"
          buttonHref="/contact#book"
        />
    </>
  );
}
