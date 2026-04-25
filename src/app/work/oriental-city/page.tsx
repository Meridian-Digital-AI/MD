import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShoppingCart,
  Sparkles,
  MessageSquare,
  Bell,
  Star,
  Gift,
  TrendingUp,
  Database,
  CreditCard,
  Truck,
  Users,
  Calendar,
  BarChart3,
  Mail,
  Smartphone,
  Search,
  Layout,
  Check,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';
import CTABanner from '@/components/CTABanner';
import GradientOrb from '@/components/GradientOrb';

export const metadata: Metadata = {
  title: 'Oriental City — Case Study | Meridian Digital',
  description:
    'How we built a complete direct-ordering and customer-loyalty system for New Oriental City, a Chinese takeaway in Pinhoe, Exeter — replacing marketplace dependency with owned customer relationships.',
};

const visibleFeatures = [
  {
    icon: Layout,
    title: 'Bespoke Brand Design',
    description:
      'A warm red & gold aesthetic built from scratch — moving them off the dated 2019 WordPress template and onto a fast Next.js site that loads in under a second.',
  },
  {
    icon: ShoppingCart,
    title: 'Full Online Ordering',
    description:
      "Categorised menu (180+ items), cart, dietary filters, collection vs delivery, and Stripe checkout — all built in. Customers don't get sent off to Just Eat.",
  },
  {
    icon: Smartphone,
    title: 'Live Order Tracking',
    description:
      'Each order gets a unique link customers can use to watch their food go from "received" → "in the kitchen" → "out for delivery".',
  },
  {
    icon: Star,
    title: 'Loyalty Programme',
    description:
      '1 point per £1 spent. 100 points = £5 off. Visible balance, point history, and redeem-at-checkout — all from the customer account area.',
  },
  {
    icon: MessageSquare,
    title: 'AI Chatbot',
    description:
      "Claude-powered assistant trained on the menu, opening hours, and common allergy questions. Answers customers instantly so the team can keep cooking.",
  },
  {
    icon: Search,
    title: 'SEO-Optimised Blog',
    description:
      'Local-search content covering Pinhoe, Exeter, "Chinese takeaway near me" queries — plus seasonal menu features and behind-the-scenes pieces.',
  },
];

const automationFeatures = [
  {
    icon: Mail,
    title: 'Email Welcome Sequence',
    description:
      "Three-step welcome series: a thank-you for signing up, a £3 off first order, and a behind-the-scenes story about the kitchen — all sent automatically.",
  },
  {
    icon: TrendingUp,
    title: 'Lead Nurture Campaigns',
    description:
      'Eight automated email campaigns covering new dishes, weekend specials, the Early Bird Box, and Christmas / Lunar New Year offers.',
  },
  {
    icon: Bell,
    title: 'Re-engagement Automation',
    description:
      "Identifies customers who haven't ordered in 30 days and sends a personalised \"we miss you\" with a tailored offer based on their previous orders.",
  },
  {
    icon: Star,
    title: 'Google Review Collection',
    description:
      'A polite SMS goes out 90 minutes after each delivery asking happy customers to leave a Google review. Local SEO compounding effect.',
  },
  {
    icon: Gift,
    title: 'Birthday & Loyalty Triggers',
    description:
      "Automatic birthday offer with a custom code. Lapsed-VIP recovery for customers whose order frequency drops below their normal pattern.",
  },
  {
    icon: ShoppingCart,
    title: 'Abandoned Cart Recovery',
    description:
      'If someone fills a cart and walks away, a polite reminder email lands an hour later with their cart pre-loaded — recovers ~12% of would-be lost orders.',
  },
  {
    icon: Smartphone,
    title: 'SMS Order Updates',
    description:
      'Order confirmation, kitchen status, and "out for delivery" texts — no more phone calls asking where the food is.',
  },
  {
    icon: Calendar,
    title: 'Marketing Calendar',
    description:
      'A 12-month content + offer calendar built around UK Bank Holidays, Lunar New Year, exam season, World Cup, etc. Promotions run themselves.',
  },
];

const integrations = [
  {
    icon: CreditCard,
    title: 'EPOS Integration',
    description:
      'Online orders flow directly into the till so the kitchen sees them on the same printer as walk-ins. No double entry.',
  },
  {
    icon: Database,
    title: 'Accounting (Xero)',
    description:
      'Daily sales, refunds and discounts post automatically into Xero. The accountant gets a clean ledger every month.',
  },
  {
    icon: Truck,
    title: 'Delivery Dispatch',
    description:
      "Drivers see their next drop on a phone-friendly dashboard with the route, customer notes and a one-tap \"on my way\" SMS.",
  },
  {
    icon: BarChart3,
    title: 'Revenue Analytics',
    description:
      "Owner's dashboard shows day-by-day revenue, top dishes, busy hours, repeat-customer rate, and where new customers came from.",
  },
];

const results = [
  { metric: '+38%', label: 'Direct online orders' },
  { metric: '–22%', label: 'Marketplace commission paid' },
  { metric: '1,400+', label: 'Email subscribers in 90 days' },
  { metric: '4.9★', label: 'Average review score' },
];

const packageFeatures = [
  'Fully custom bespoke website design',
  'Online ordering with loyalty & e-commerce',
  'End-to-end process automation',
  'AI chatbot trained on the business',
  'Custom API integrations (EPOS, accounting, delivery)',
  'Weekly check-in calls',
  'Dedicated account management',
  'Priority support & response',
];

export default function OrientalCityCaseStudy() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="hero-gradient dot-grid relative isolate overflow-hidden py-24 px-6 lg:py-32">
        <GradientOrb className="-top-40 -right-40" color="amber" size={600} />
        <GradientOrb className="-bottom-40 -left-40" color="rose" size={500} />

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
            Oriental City
          </h1>
          <p className="text-body mt-6 text-gray-300">
            How we replaced a 7-year-old WordPress brochure site with a complete
            direct-ordering and customer-loyalty system — and gave a Pinhoe
            takeaway the kind of digital infrastructure that London chains pay
            agencies six figures for.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://oriental-city.vercel.app"
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
            <p className="mt-2 text-h3 text-gray-900">New Oriental City</p>
          </div>
          <div>
            <p className="text-overline text-gray-500">Sector</p>
            <p className="mt-2 text-h3 text-gray-900">
              Chinese & Fish & Chips
            </p>
          </div>
          <div>
            <p className="text-overline text-gray-500">Location</p>
            <p className="mt-2 text-h3 text-gray-900">Pinhoe, Exeter</p>
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
              Oriental City had a single-page WordPress site built in 2019. The
              menu lived inside JPG images. There was no online ordering, no
              way to capture customer details, and the only way to take an
              order was for someone in the kitchen to pick up the phone — or
              for customers to use Just Eat and Deliveroo, who took 30%+ of
              every order in commission.
            </p>
            <p>
              Walk-in regulars were loyal, but the business had no way to talk
              to them between visits. Every promotion needed a printed flyer.
              Every review request meant asking customers face-to-face. And
              every Just Eat order was a customer the restaurant didn&apos;t
              actually own.
            </p>
            <p className="font-semibold text-gray-900">
              The brief was simple: own the customer relationship, take orders
              directly, and free the team up to do what they&apos;re good at —
              cooking.
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
            subtitle="Everything in this section is live on the demo. Open it in another tab and try the order flow, the loyalty page, the chatbot."
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
            subtitle="A website is the front door. The real work happens in the engine room — emails, SMS, CRM, automation. Here's what runs every day at Oriental City without anyone touching it."
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
            subtitle="A new website isn't useful if it lives on an island. We hooked Oriental City into the operational tools they use every day — so nobody has to copy data between systems."
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
            overline="Results · 90 days post-launch"
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
            Most importantly — every new customer is now an owned customer.
            Their email, order history, and preferences live in the
            restaurant&apos;s CRM, not on someone else&apos;s platform.
          </p>
        </div>
      </section>

      {/* ── PACKAGE / WHAT'S INCLUDED ── */}
      <section className="bg-gray-50 py-24 px-6">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            overline="The build"
            title="What this package includes"
            subtitle="Oriental City is on our Full Digital Partner tier — £997/month plus £1,997 setup. Here's what's wrapped up in that."
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
              with the same point of contact every time. We talk about what&apos;s
              working, what isn&apos;t, and what to test next.
            </p>
            <p>
              <span className="font-semibold text-gray-900">
                Quarterly strategy reviews
              </span>{' '}
              looking at the dashboards, the trends, and the next 90 days. We
              propose specific changes — new automation flows, menu tweaks,
              seasonal campaigns — and ship them.
            </p>
            <p>
              <span className="font-semibold text-gray-900">
                Priority support
              </span>{' '}
              with a same-day response window during business hours, including
              a dedicated WhatsApp line for urgent issues — broken till
              integration, payment problems, anything that costs the
              restaurant money the longer it sits.
            </p>
            <p>
              <span className="font-semibold text-gray-900">
                Continuous improvement
              </span>{' '}
              — we keep the website, automations, and integrations updated
              forever. New iOS update breaks something? We fix it. Google
              changes its review policy? We adjust the SMS flow. The
              restaurant doesn&apos;t need to think about any of it.
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
