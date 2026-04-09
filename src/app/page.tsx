import Link from 'next/link';
import { Monitor, Zap, Megaphone } from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';
import StatsCounter from '@/components/StatsCounter';
import SectorCard from '@/components/SectorCard';
import TestimonialCard from '@/components/TestimonialCard';
import CTABanner from '@/components/CTABanner';
import ScrollFadeIn from '@/components/ScrollFadeIn';
import GradientOrb from '@/components/GradientOrb';
import DeviceMockup from '@/components/DeviceMockup';
import { sectors } from '@/lib/data/sectors';
import { testimonials } from '@/lib/data/testimonials';

const resultsData = [
  {
    end: 45,
    suffix: ' orders/week',
    description: 'For a Pinhoe takeaway, replacing Just Eat dependency',
  },
  {
    end: 4,
    suffix: ' weeks ahead',
    description: 'MOT calendar fully booked via automated reminders',
  },
  {
    end: 800,
    prefix: '£',
    suffix: '/mo saved',
    description: 'In marketplace commission fees alone',
  },
  {
    end: 92,
    suffix: '% open rate',
    description: 'On MOT reminder emails — genuinely useful',
  },
];

const services = [
  {
    icon: Monitor,
    title: 'Modern Websites',
    description:
      'Built with Next.js, not WordPress. Faster loading, better SEO, mobile-first. Custom design that looks like a proper agency built it — because we did.',
  },
  {
    icon: Zap,
    title: 'Business Automation',
    description:
      'Email sequences, booking systems, loyalty programmes, review collection, CRM — all running behind the scenes so you can focus on your business.',
  },
  {
    icon: Megaphone,
    title: 'Ads & Marketing',
    description:
      'Google and Meta ads managed by our marketing specialist. Driving the right customers to your new digital presence.',
  },
];

export default function HomePage() {
  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative hero-gradient dot-grid overflow-hidden">
        <GradientOrb
          color="blue"
          size={600}
          className="top-[-200px] right-[-100px]"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <div className="flex flex-col items-start lg:flex-row lg:items-center lg:justify-between lg:gap-16">
            {/* Text */}
            <div className="max-w-4xl">
              <ScrollFadeIn>
                <h1 className="text-display text-white font-sora max-w-4xl">
                  Websites &amp; Automation That Bring Local Businesses More
                  Customers
                </h1>
              </ScrollFadeIn>

              <ScrollFadeIn delay={100}>
                <p className="mt-6 text-body text-gray-400 max-w-2xl">
                  We build modern websites with built-in email sequences, booking
                  systems, loyalty programmes, and AI — so your business grows on
                  autopilot. Based in Exeter.
                </p>
              </ScrollFadeIn>

              <ScrollFadeIn delay={200}>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/contact#book"
                    className="btn-primary"
                    data-analytics="hero-cta-primary"
                  >
                    Book a Free Discovery Call
                  </Link>
                  <Link
                    href="/work"
                    className="btn-ghost"
                    data-analytics="hero-cta-secondary"
                  >
                    See Our Work
                  </Link>
                </div>
              </ScrollFadeIn>

              <ScrollFadeIn delay={300}>
                <p className="mt-6 text-small text-gray-500">
                  Serving restaurants, garages, salons, and local businesses
                  across Devon
                </p>
              </ScrollFadeIn>
            </div>

            {/* Device mockup — visible on desktop */}
            <div className="hidden lg:block flex-shrink-0 mt-12 lg:mt-0">
              <ScrollFadeIn delay={400}>
                <DeviceMockup />
              </ScrollFadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* RESULTS / PROOF                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollFadeIn>
            <SectionHeading
              overline="Results"
              title="What Our Systems Are Built to Deliver"
            />
          </ScrollFadeIn>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {resultsData.map((item, i) => (
              <ScrollFadeIn key={i} delay={i * 100}>
                <div className="rounded-xl border border-gray-200 bg-white p-8 card-hover">
                  <p className="text-3xl font-sora font-bold text-blue-600">
                    <StatsCounter
                      end={item.end}
                      prefix={item.prefix}
                      suffix={item.suffix}
                    />
                  </p>
                  <p className="mt-3 text-body text-gray-700">
                    {item.description}
                  </p>
                </div>
              </ScrollFadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* WHAT WE DO                                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollFadeIn>
            <SectionHeading
              overline="What We Do"
              title="Everything Your Business Needs Online"
            />
          </ScrollFadeIn>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {services.map((service, i) => (
              <ScrollFadeIn key={i} delay={i * 100}>
                <div className="flex flex-col items-start">
                  <service.icon
                    className="h-8 w-8 text-blue-600"
                    aria-hidden="true"
                  />
                  <h3 className="mt-4 text-h3 text-gray-900">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-body text-gray-500">
                    {service.description}
                  </p>
                </div>
              </ScrollFadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* WHO WE HELP                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-white py-24 relative overflow-hidden">
          <GradientOrb
            color="emerald"
            size={400}
            className="bottom-[-150px] left-[-100px]"
          />
          <div className="relative mx-auto max-w-7xl px-6">
            <ScrollFadeIn>
              <SectionHeading
                overline="Who We Help"
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

      {/* ------------------------------------------------------------------ */}
      {/* TESTIMONIALS                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollFadeIn>
            <SectionHeading
              overline="What People Say"
              title="Built for Results"
            />
          </ScrollFadeIn>

          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <ScrollFadeIn key={t.id} delay={i * 100}>
                <TestimonialCard
                  quote={t.quote}
                  name={t.name}
                  businessType={t.businessType}
                  rating={t.rating}
                />
              </ScrollFadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA BANNER                                                          */}
      {/* ------------------------------------------------------------------ */}
      <CTABanner
        title="Ready to grow your business online?"
        subtitle="Book a free 15-minute discovery call. No obligation, no jargon — just a conversation about what's possible."
        buttonText="Book Your Free Call"
        buttonHref="/contact#book"
      />
    </>
  );
}
