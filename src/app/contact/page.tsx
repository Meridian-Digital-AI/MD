import type { Metadata } from 'next';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';
import ScrollFadeIn from '@/components/ScrollFadeIn';
import ContactForm from '@/components/ContactForm';
import BookingCalendar from '@/components/BookingCalendar';
import { siteConfig } from '@/lib/data/config';

export const metadata: Metadata = {
  title: 'Let\'s Talk | Meridian Digital',
  description:
    'Book a free 15-minute discovery call or send us a message. Based in Exeter, Devon.',
};

export default function ContactPage() {
  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="hero-gradient dot-grid relative overflow-hidden py-28 sm:py-36">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <ScrollFadeIn>
            <h1 className="text-h1 font-sora text-white">Let&rsquo;s Talk</h1>
            <p className="text-body mx-auto mt-5 max-w-2xl text-gray-400">
              Book a free discovery call or send us a message. We usually respond
              within 2 hours.
            </p>
          </ScrollFadeIn>
        </div>
      </section>

      {/* ── BOOK A CALL ──────────────────────────────────────── */}
      <section id="book" className="bg-white py-24">
        <div className="mx-auto max-w-4xl px-6">
          <ScrollFadeIn>
            <SectionHeading
              overline="Book a Call"
              title="15 Minutes. Free. No Obligation."
            />
            <p className="text-body mx-auto mt-4 max-w-2xl text-center text-gray-500">
              We&rsquo;ll ask about your business and tell you exactly what
              we&rsquo;d build.
            </p>
          </ScrollFadeIn>

          <ScrollFadeIn delay={100}>
            <BookingCalendar />
          </ScrollFadeIn>
        </div>
      </section>

      {/* ── CONTACT FORM ─────────────────────────────────────── */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <ScrollFadeIn>
            <SectionHeading
              overline="Or Send a Message"
              title="Get in Touch"
            />
          </ScrollFadeIn>

          <div className="mt-14 grid gap-16 lg:grid-cols-5">
            {/* ── Form ──────────────────────────────────────── */}
            <div className="lg:col-span-3">
              <ScrollFadeIn delay={100}>
                <ContactForm />
              </ScrollFadeIn>
            </div>

            {/* ── Contact Details ────────────────────────────── */}
            <aside className="lg:col-span-2">
              <ScrollFadeIn delay={200}>
                <div className="flex flex-col gap-8">
                  {/* Email */}
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/10">
                      <Mail className="h-5 w-5 text-blue-600" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-small font-medium text-gray-700">
                        Email
                      </p>
                      <a
                        href={`mailto:${siteConfig.email}`}
                        className="text-body text-blue-600 underline-offset-2 hover:underline"
                      >
                        {siteConfig.email}
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/10">
                      <Phone className="h-5 w-5 text-blue-600" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-small font-medium text-gray-700">
                        Phone
                      </p>
                      <a
                        href={`tel:${siteConfig.phone.replace(/\s/g, '')}`}
                        className="text-body text-blue-600 underline-offset-2 hover:underline"
                      >
                        {siteConfig.phone}
                      </a>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/10">
                      <MapPin className="h-5 w-5 text-blue-600" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-small font-medium text-gray-700">
                        Location
                      </p>
                      <p className="text-body text-gray-500">
                        Based in Exeter, Devon — serving businesses across Devon
                        and the South West
                      </p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/10">
                      <Clock className="h-5 w-5 text-blue-600" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-small font-medium text-gray-700">
                        Hours
                      </p>
                      <p className="text-body text-gray-500">
                        {siteConfig.workingHours}
                      </p>
                      <p className="text-small mt-1 text-gray-500">
                        We usually respond to enquiries within 2 hours.
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollFadeIn>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
