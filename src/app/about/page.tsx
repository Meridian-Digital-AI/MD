import type { Metadata } from 'next';

import SectionHeading from '@/components/SectionHeading';
import ScrollFadeIn from '@/components/ScrollFadeIn';
import CTABanner from '@/components/CTABanner';
import GradientOrb from '@/components/GradientOrb';
import { team } from '@/lib/data/team';

export const metadata: Metadata = {
  title: 'About Us | Meridian Digital',
  description:
    'Meet the team behind Meridian Digital. Two people, one mission: give local businesses in Exeter the digital tools they deserve.',
};

export default function AboutPage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="hero-gradient dot-grid relative overflow-hidden py-24 px-6 lg:py-32">
        <GradientOrb className="-top-40 -right-40" color="blue" size={600} />
        <GradientOrb className="-bottom-40 -left-40" color="emerald" size={500} />

        <div className="relative mx-auto max-w-3xl text-center">
          <ScrollFadeIn>
            <h1 className="text-display font-sora text-white">About Us</h1>
            <p className="text-body mt-6 text-gray-400">
              Two people, one mission: give local businesses in Exeter the
              digital tools they deserve.
            </p>
          </ScrollFadeIn>
        </div>
      </section>

      {/* ── OUR STORY ── */}
      <section className="bg-white py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 lg:grid-cols-2">
            {/* Left: text content */}
            <ScrollFadeIn>
              <div className="max-w-prose space-y-6">
                <p className="text-body text-gray-700">
                  We&rsquo;re Will and Joe, and we run Meridian Digital from
                  Exeter. Between us, we cover everything a local business needs
                  to grow online &mdash; from website design and automation to
                  advertising and marketing strategy.
                </p>
                <p className="text-body text-gray-700">
                  We use AI to build our code, which means we can deliver the
                  same quality as a London agency &mdash; custom Next.js sites,
                  not WordPress templates &mdash; at a fraction of the cost. Our
                  overheads are low, our tech is modern, and our margins mean we
                  can price fairly without cutting corners.
                </p>
                <p className="text-body text-gray-700">
                  We started Meridian Digital because we saw local businesses in
                  Exeter paying too much for too little &mdash; or getting
                  nothing at all. A takeaway losing 30% to Just Eat. A garage
                  with an empty diary because nobody knows they exist online. A
                  salon losing thousands to no-shows because they don&rsquo;t
                  send reminders.
                </p>
                <p className="text-body text-gray-700">
                  We fix all of that. Not with a brochure website, but with a
                  system that actively brings you customers.
                </p>
              </div>
            </ScrollFadeIn>

            {/* Right: team member placeholders */}
            <ScrollFadeIn delay={150}>
              <div className="flex flex-wrap items-start justify-center gap-12 lg:justify-start lg:pt-4">
                {/* PLACEHOLDER: Replace with actual photos before launch */}
                {team.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col items-center text-center"
                  >
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="h-32 w-32 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-navy-800">
                        <span className="text-2xl font-bold text-white">
                          {member.initials}
                        </span>
                      </div>
                    )}
                    <p className="mt-4 text-h3 text-gray-900">{member.name}</p>
                    <p className="mt-1 text-small text-gray-500">
                      {member.role}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollFadeIn>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="bg-gray-50 py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <ScrollFadeIn>
            <blockquote className="relative text-center">
              <div
                className="mx-auto mb-6 h-1 w-16 rounded-full bg-blue-600"
                aria-hidden="true"
              />
              <p className="text-h2 font-sora text-gray-900">
                Plain English. Fair pricing.
                <br />
                Work that actually works.
              </p>
              <div
                className="mx-auto mt-6 h-1 w-16 rounded-full bg-blue-600"
                aria-hidden="true"
              />
            </blockquote>
          </ScrollFadeIn>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
              <CTABanner
          title="Want to work with us?"
          subtitle="Book a free call and see if we're the right fit for your business."
          buttonText="Book Your Free Call"
          buttonHref="/contact#book"
        />
    </>
  );
}
