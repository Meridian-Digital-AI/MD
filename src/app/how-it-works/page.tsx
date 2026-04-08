import type { Metadata } from 'next';
import Link from 'next/link';

import SectionHeading from '@/components/SectionHeading';
import ScrollFadeIn from '@/components/ScrollFadeIn';
import CTABanner from '@/components/CTABanner';
import ProcessStep from '@/components/ProcessStep';
import FAQ from '@/components/FAQ';
import GradientOrb from '@/components/GradientOrb';
import { faqItems } from '@/lib/data/faq';

export const metadata: Metadata = {
  title: 'How It Works | Meridian Digital',
  description:
    'From first call to live website in four simple steps. Discover our streamlined process that gets your business online in just three weeks.',
};

const steps = [
  {
    stepNumber: 1,
    title: 'Discovery Call',
    description:
      'We learn about your business, your customers, and what\u2019s not working right now. You tell us your goals \u2014 we tell you exactly what we\u2019d build. 15 minutes, free, no obligation.',
    icon: 'Phone',
  },
  {
    stepNumber: 2,
    title: 'We Build',
    description:
      'We design and build your website and automation system. You\u2019ll see a staging preview within the first week so you can give feedback early. Typical build time: 2\u20133 weeks.',
    icon: 'Code',
  },
  {
    stepNumber: 3,
    title: 'Review & Refine',
    description:
      'You review everything on a private staging link. We refine based on your feedback until you\u2019re happy. We handle all the technical setup \u2014 domain, hosting, email, analytics.',
    icon: 'ClipboardCheck',
  },
  {
    stepNumber: 4,
    title: 'Launch & Grow',
    description:
      'Your site goes live, automations start running, and we monitor everything. You get regular check-ins, performance reports, and ongoing updates included in your plan.',
    icon: 'Rocket',
    isLast: true,
  },
] satisfies { stepNumber: number; title: string; description: string; icon: string; isLast?: boolean }[];

export default function HowItWorksPage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="hero-gradient dot-grid relative overflow-hidden py-24 px-6 lg:py-32">
        <GradientOrb className="-top-40 -right-40" color="blue" size={600} />
        <GradientOrb className="-bottom-40 -left-40" color="amber" size={500} />

        <div className="relative mx-auto max-w-3xl text-center">
          <ScrollFadeIn>
            <h1 className="text-display font-sora text-white">How It Works</h1>
            <p className="text-body mt-6 text-gray-400">
              From first call to live website in three weeks. Here&rsquo;s
              exactly what happens.
            </p>
          </ScrollFadeIn>
        </div>
      </section>

      {/* ── PROCESS STEPS ── */}
      <section className="bg-white py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <ScrollFadeIn>
            <SectionHeading
              overline="Our Process"
              title="Four Simple Steps"
            />
          </ScrollFadeIn>

          {/* Desktop timeline (lg+) */}
          <div className="relative mt-16 hidden lg:block">
            {/* Horizontal connecting line */}
            <div
              className="absolute left-[calc(12.5%+32px)] right-[calc(12.5%+32px)] top-8 h-px bg-gray-200"
              aria-hidden="true"
            />

            <div className="grid grid-cols-4 gap-8">
              {steps.map((step, i) => (
                <ScrollFadeIn key={step.stepNumber} delay={i * 120}>
                  <ProcessStep
                    stepNumber={step.stepNumber}
                    title={step.title}
                    description={step.description}
                    icon={step.icon}
                    isLast={step.isLast ?? false}
                  />
                </ScrollFadeIn>
              ))}
            </div>
          </div>

          {/* Mobile / tablet timeline */}
          <div className="relative mt-16 lg:hidden">
            {/* Vertical connecting line */}
            <div
              className="absolute bottom-0 left-8 top-0 w-px bg-gray-200"
              aria-hidden="true"
            />

            <div className="flex flex-col gap-12">
              {steps.map((step, i) => (
                <ScrollFadeIn key={step.stepNumber} delay={i * 100}>
                  <div className="relative flex gap-6">
                    {/* Step circle */}
                    <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                      {step.stepNumber}
                    </div>

                    {/* Text content */}
                    <div className="pt-1">
                      <h3 className="text-h3 text-gray-900">{step.title}</h3>
                      <p className="mt-2 text-small text-gray-500">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </ScrollFadeIn>
              ))}
            </div>
          </div>

          {/* CTA below steps */}
          <ScrollFadeIn>
            <div className="mt-16 text-center">
              <p className="text-body text-gray-500">
                Most clients are live within 3 weeks of their discovery call.
              </p>
              <Link href="/contact#book" className="btn-primary mt-6 inline-flex">
                Book Your Discovery Call
              </Link>
            </div>
          </ScrollFadeIn>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-gray-50 py-24 px-6">
        <div className="mx-auto max-w-3xl">
          <ScrollFadeIn>
            <SectionHeading overline="FAQ" title="Common Questions" />
          </ScrollFadeIn>

          <ScrollFadeIn>
            <div className="mt-12">
              <FAQ items={faqItems} />
            </div>
          </ScrollFadeIn>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
              <CTABanner
          title="Still have questions?"
          subtitle="Book a free call and we'll answer everything in plain English. No jargon, no pressure."
          buttonText="Book Your Free Call"
          buttonHref="/contact#book"
        />
    </>
  );
}
