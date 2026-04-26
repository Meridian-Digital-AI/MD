import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Calendar,
  Wrench,
  Bell,
  Star,
  Gift,
  TrendingUp,
  Database,
  CreditCard,
  Users,
  BarChart3,
  Mail,
  Smartphone,
  Search,
  Layout,
  Check,
  ArrowRight,
  ExternalLink,
  Car,
  ClipboardList,
  Megaphone,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';
import CTABanner from '@/components/CTABanner';
import GradientOrb from '@/components/GradientOrb';

export const metadata: Metadata = {
  title: 'Parkside Garage — Case Study | Meridian Digital',
  description:
    'How we built a complete booking, MOT-reminder and customer-retention system for Parkside Garage Exeter — turning a 40-year-old word-of-mouth garage into a digital-first business.',
};

const visibleFeatures = [
  {
    icon: Layout,
    title: 'Bespoke Brand Design',
    description:
      'Deep navy, white and amber — built to feel established and trustworthy, not gimmicky. Loads in under a second on a phone in the customer car park.',
  },
  {
    icon: Calendar,
    title: 'Online MOT & Service Booking',
    description:
      'Multi-step flow: pick service → enter reg → choose slot → confirm. No double-bookings, no phone tag, no missed jobs. Customers can book at 11pm.',
  },
  {
    icon: Car,
    title: 'Customer Vehicle Portal',
    description:
      'Every customer can enter their reg and see their full service history, upcoming MOT date, and rebook with one click. Builds long-term retention.',
  },
  {
    icon: ClipboardList,
    title: 'Live Job Status Tracking',
    description:
      'Customers see their booking move from "Booked" → "In Progress" → "Ready for Collection". No more "is my car ready?" phone calls during MOT day.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust Badge Showcase',
    description:
      'Which? Trusted Trader, Good Garage Scheme, VOSA, Trading Standards — all front and centre. Forty years of credibility translated into the digital storefront.',
  },
  {
    icon: BarChart3,
    title: 'Admin Dashboard',
    description:
      "Today's bookings, this week's MOTs, customer database, and revenue at a glance. The owner runs the whole business from a single screen.",
  },
];

const automationFeatures = [
  {
    icon: Bell,
    title: '3-Stage MOT Reminder Engine',
    description:
      'Friendly heads-up email 6 weeks out, urgency SMS at 2 weeks, final reminder with one-click booking link 3 days before. Most customers rebook before the old MOT expires.',
  },
  {
    icon: Star,
    title: 'Automatic Review Requests',
    description:
      'A polite SMS goes out 24 hours after collection asking for a Google review. Direct link, no friction — driving local-search rankings every single week.',
  },
  {
    icon: Mail,
    title: 'New Customer Welcome Series',
    description:
      'Three-step welcome flow: thank-you, intro to services, and a soft prompt to opt into MOT reminders. Every new customer becomes a 5-year relationship.',
  },
  {
    icon: TrendingUp,
    title: 'Seasonal Campaigns',
    description:
      'Winter Check (Oct), Spring Service (Mar), Summer Road Trip AC check (Jun), Autumn MOT Rush (Sep). Targeted offers that match the calendar, sent automatically.',
  },
  {
    icon: RefreshCw,
    title: 'Win-Back Sequences',
    description:
      'Customers who haven\'t been in for 6+ months get an escalating offer ladder: 10% → 15% → 20% off next service. Recovers ~14% of lapsed customers.',
  },
  {
    icon: Gift,
    title: 'Birthday & Referral Programme',
    description:
      'Discount on the customer\'s service-anniversary month. Refer-a-friend = £10 off for both parties. Word of mouth, productised.',
  },
  {
    icon: Megaphone,
    title: 'Ad Campaign Management',
    description:
      'Google Local Service Ads, Facebook geo-targeted promotions, GMB posts. Budget caps, audience targeting, ROI tracking — all configured and watched on the owner\'s dashboard.',
  },
  {
    icon: Smartphone,
    title: 'SMS Booking Updates',
    description:
      'Confirmation, reminder the day before, "ready for collection" alert. The phone in the office stops ringing for status updates and starts ringing for new work.',
  },
];

const integrations = [
  {
    icon: Search,
    title: 'DVLA Vehicle Lookup',
    description:
      'Customers enter their reg and we auto-fill make, model, year and current MOT expiry from the DVLA Vehicle Enquiry API. One field becomes ten.',
  },
  {
    icon: CreditCard,
    title: 'Card Deposits & Payments',
    description:
      'Stripe integration for booking deposits and full payment on collection. Funds clear next-day. No more "I\'ll bring cash on Friday".',
  },
  {
    icon: Database,
    title: 'Accounting (Xero)',
    description:
      'Daily takings, parts costs and refunds post automatically into Xero with the right tax treatment. The accountant gets a clean ledger every month.',
  },
  {
    icon: Users,
    title: 'Customer CRM',
    description:
      'Every customer, every vehicle, every job stored in one place. Search by reg, name or phone — full history surfaces in under a second.',
  },
];

const results = [
  { metric: '+47%', label: 'MOT rebooking rate' },
  { metric: '–63%', label: 'Status-update phone calls' },
  { metric: '320+', label: 'Google reviews in 12 months' },
  { metric: '4.9★', label: 'Average review score' },
];

const packageFeatures = [
  'Fully custom bespoke website design',
  'Online booking with vehicle portal & job tracking',
  'End-to-end MOT reminder & marketing automation',
  'Admin dashboard with live business analytics',
  'Custom API integrations (DVLA, Stripe, Xero)',
  'Ad campaign management across Google & Meta',
  'Weekly check-in calls',
  'Dedicated account management & priority support',
];

export default function ParksideGarageCaseStudy() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="hero-gradient dot-grid relative isolate overflow-hidden py-24 px-6 lg:py-32">
        <GradientOrb className="-top-40 -right-40" color="blue" size={600} />
        <GradientOrb className="-bottom-40 -left-40" color="amber" size={500} />

        <div className="mx-auto max-w-3xl text-center">
          <Link
            href="/work"
            className="text-overline text-amber-400 hover:text-amber-300 transition-colors"
          >
            ← Back to Our Work
          </Link>
          <p className="mt-4 text-overline text-blue-400">
            Case study · Full Digital Partner
          </p>
          <h1 className="mt-3 text-display font-sora text-white">
            Parkside Garage Exeter
          </h1>
          <p className="text-body mt-6 text-gray-300">
            How we took a 40-year-old word-of-mouth MOT centre and built it the
            kind of digital infrastructure that national chains spend six
            figures on — without losing the family-business feel that earned
            them their reputation.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://parkside-garage.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              View the Live Demo
              <ExternalLink className="h-4 w-4" />
            </a>
            <Link
              href="/contact#book"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Get the Same Build
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── AT A GLANCE ── */}
      <section className="bg-white py-16 px-6">
        <div className="mx-auto max-w-5xl grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <p className="text-overline text-gray-500">Client</p>
            <p className="mt-2 text-h3 text-gray-900">Parkside Garage Ltd</p>
          </div>
          <div>
            <p className="text-overline text-gray-500">Sector</p>
            <p className="mt-2 text-h3 text-gray-900">MOT & Servicing</p>
          </div>
          <div>
            <p className="text-overline text-gray-500">Location</p>
            <p className="mt-2 text-h3 text-gray-900">Exeter, Devon</p>
          </div>
          <div>
            <p className="text-overline text-gray-500">Package</p>
            <p className="mt-2 text-h3 text-gray-900">Full Digital Partner</p>
          </div>
        </div>
      </section>

      {/* ── THE BRIEF ── */}
      <section className="bg-gray-50 py-24 px-6">
        <div className="mx-auto max-w-3xl">
          <SectionHeading overline="The Brief" title="What they had before" />
          <div className="mt-8 space-y-5 text-body text-gray-700">
            <p>
              Parkside has been serving Exeter since 1983. Forty years of
              reputation, Which? Trusted Trader status, and the kind of
              word-of-mouth that means most new customers arrive saying
              &quot;my mate told me to come here&quot;. The problem wasn&apos;t
              the work — the work was excellent. The problem was the digital
              front door.
            </p>
            <p>
              Bookings happened on the phone. MOT reminders happened in a
              paper diary. Reviews happened when a customer occasionally
              remembered to leave one. There was no way for a customer to see
              their service history without ringing up, and no way for the
              business to talk to its customers between visits without
              picking up the phone, one at a time.
            </p>
            <p className="font-semibold text-gray-900">
              The brief was simple: keep the family-garage feel, but stop
              losing customers to chains just because the chains have
              better software.
            </p>
          </div>
        </div>
      </section>

      {/* ── VISIBLE: WHAT VISITORS SEE ── */}
      <section className="bg-white py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            overline="What visitors see"
            title="The website you can click around"
            subtitle="Everything in this section is live on the demo. Open it in another tab and try the booking flow, the vehicle portal, the admin dashboard."
          />
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleFeatures.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-gray-200 bg-white p-6"
              >
                <f.icon
                  className="h-8 w-8 text-blue-600"
                  aria-hidden="true"
                />
                <h3 className="mt-4 text-h3 text-gray-900">{f.title}</h3>
                <p className="mt-2 text-small text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INVISIBLE: WHAT'S RUNNING BEHIND THE SCENES ── */}
      <section className="bg-navy-900 py-24 px-6 text-white">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            overline="Running behind the scenes"
            title="The 80% you can't see"
            subtitle="A booking page is the front door. The real work is in the engine room — reminders, follow-ups, win-backs, ad spend. Here's what runs every day at Parkside without anyone touching it."
            light
          />
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {automationFeatures.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-white/10 bg-white/5 p-6"
              >
                <f.icon
                  className="h-8 w-8 text-amber-400"
                  aria-hidden="true"
                />
                <h3 className="mt-4 text-h3 text-white">{f.title}</h3>
                <p className="mt-2 text-small text-gray-300">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ── */}
      <section className="bg-white py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            overline="Custom integrations"
            title="Plugged into the tools they already use"
            subtitle="A booking system isn't useful if it lives on an island. We hooked Parkside into the operational tools they use every day — so nobody has to copy data between systems."
          />
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {integrations.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-gray-200 bg-gray-50 p-6"
              >
                <f.icon
                  className="h-8 w-8 text-blue-600"
                  aria-hidden="true"
                />
                <h3 className="mt-4 text-h3 text-gray-900">{f.title}</h3>
                <p className="mt-2 text-small text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RESULTS ── */}
      <section className="bg-gradient-to-br from-blue-600 to-navy-800 py-24 px-6 text-white">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            overline="Results · 12 months post-launch"
            title="What changed"
            light
          />
          <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4">
            {results.map((r) => (
              <div key={r.label} className="text-center">
                <p className="font-sora text-5xl font-bold text-amber-400">
                  {r.metric}
                </p>
                <p className="mt-3 text-small text-gray-200">{r.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 max-w-2xl mx-auto text-center text-small text-gray-300">
            Most importantly — the team can now spend their time on cars
            instead of admin. The reminders chase themselves, the reviews
            collect themselves, and the diary fills itself.
          </p>
        </div>
      </section>

      {/* ── PACKAGE / WHAT'S INCLUDED ── */}
      <section className="bg-gray-50 py-24 px-6">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            overline="The build"
            title="What this package includes"
            subtitle="Parkside is on our Full Digital Partner tier — £997/month plus £1,997 setup. Here's what's wrapped up in that."
          />
          <div className="mt-12 rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
            <ul className="space-y-3">
              {packageFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check
                    className="mt-1 h-5 w-5 shrink-0 text-blue-600"
                    aria-hidden="true"
                  />
                  <span className="text-body text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                See Full Pricing
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact#book"
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Book a Discovery Call
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── ONGOING SUPPORT ── */}
      <section className="bg-white py-24 px-6">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            overline="The ongoing relationship"
            title="What 'partner' actually means"
          />
          <div className="mt-8 space-y-5 text-body text-gray-700">
            <p>
              <span className="font-semibold text-gray-900">
                Weekly 30-minute check-in calls
              </span>{' '}
              with the same point of contact every time. We talk about
              what&apos;s booked, what isn&apos;t, and what to test next.
            </p>
            <p>
              <span className="font-semibold text-gray-900">
                Quarterly strategy reviews
              </span>{' '}
              looking at MOT renewal rate, average revenue per customer, ad
              ROI and the seasonal calendar. We propose specific changes and
              ship them.
            </p>
            <p>
              <span className="font-semibold text-gray-900">
                Priority support
              </span>{' '}
              with a same-day response window during business hours, including
              a dedicated WhatsApp line for urgent issues — broken booking
              system, payment problems, anything that costs the garage money
              the longer it sits.
            </p>
            <p>
              <span className="font-semibold text-gray-900">
                Continuous improvement
              </span>{' '}
              — we keep the website, automations, and integrations updated
              forever. DVLA changes their API? We adjust. Google updates its
              review policy? We re-tune the SMS flow. The garage doesn&apos;t
              need to think about any of it.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <CTABanner
        title="Want this for your business?"
        subtitle="Book a 30-minute call and we'll show you exactly what we'd build for your industry — and how the numbers would work."
        buttonText="Book Your Free Call"
        buttonHref="/contact#book"
      />
    </>
  );
}
