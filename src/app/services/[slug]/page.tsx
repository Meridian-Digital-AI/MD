import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Globe,
  Mail,
  Zap,
  Calendar,
  BarChart3,
  Send,
  Star,
  Heart,
  Bot,
  Workflow,
  Plug,
  Megaphone,
  Check,
  ArrowUpRight,
} from 'lucide-react';
import { pricingTiers } from '@/lib/data/pricing';
import { packageDetails, getPackageDetail } from '@/lib/data/packageDetails';
import SectionHeading from '@/components/SectionHeading';
import GradientOrb from '@/components/GradientOrb';
import CTABanner from '@/components/CTABanner';

const ICONS = {
  Globe,
  Mail,
  Zap,
  Calendar,
  BarChart3,
  Send,
  Star,
  Heart,
  Bot,
  Workflow,
  Plug,
  Megaphone,
} as const;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return packageDetails.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = getPackageDetail(slug);
  const tier = pricingTiers.find((t) => t.slug === slug);
  if (!detail || !tier) return {};
  return {
    title: `${tier.name} \u2014 What\u2019s Included | Meridian Digital`,
    description: detail.tagline,
  };
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const detail = getPackageDetail(slug);
  const tier = pricingTiers.find((t) => t.slug === slug);
  if (!detail || !tier) notFound();

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero-gradient dot-grid relative isolate overflow-hidden py-24 px-6 lg:py-32">
        <GradientOrb className="-top-40 -right-40" color="blue" size={600} />
        <GradientOrb className="-bottom-40 -left-40" color="amber" size={500} />

        <div className="mx-auto max-w-3xl text-center">
          <Link
            href="/services"
            className="text-overline text-blue-400 hover:text-blue-300"
          >
            &larr; All packages
          </Link>
          <h1 className="text-display font-sora text-white mt-4">
            {tier.name}
          </h1>
          <p className="text-body mt-6 text-gray-400">{detail.tagline}</p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-small text-gray-300">
            <span>
              <strong className="text-white">&pound;{tier.monthlyPrice}</strong>{' '}
              / month
            </span>
            <span className="text-gray-600">&bull;</span>
            <span>
              <strong className="text-white">&pound;{tier.setupFee}</strong>{' '}
              one-off setup
            </span>
            <span className="text-gray-600">&bull;</span>
            <span>{tier.contractLength}</span>
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR / TIMELINE ── */}
      <section className="bg-white py-16 px-6">
        <div className="mx-auto max-w-4xl grid gap-8 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
            <p className="text-overline text-blue-600">Who it&rsquo;s for</p>
            <p className="mt-2 text-body text-gray-700">{detail.whoItsFor}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
            <p className="text-overline text-blue-600">Build time</p>
            <p className="mt-2 text-body text-gray-700">{detail.buildTime}</p>
          </div>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ── */}
      <section className="bg-white py-16 px-6">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            overline="What's actually included"
            title="Every automation, in plain English"
          />

          <div className="mt-12 space-y-6">
            {detail.categories.map((cat) => {
              const Icon = ICONS[cat.icon as keyof typeof ICONS] ?? Zap;
              return (
                <div
                  key={cat.id}
                  className="rounded-xl border border-gray-200 bg-white p-6 lg:p-8"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-h3 text-gray-900">{cat.title}</h3>
                      <p className="mt-1 text-body text-gray-600">
                        {cat.intro}
                      </p>
                      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                        {cat.items.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <Check
                              className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                              aria-hidden="true"
                            />
                            <span className="text-small text-gray-700">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── NOT INCLUDED / UPGRADE ── */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="mx-auto max-w-4xl">
          <SectionHeading
            overline="Honest scope"
            title={
              detail.upgradePath
                ? "What's not in this tier"
                : 'A note on scope'
            }
          />

          <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6 lg:p-8">
            <ul className="space-y-3">
              {detail.notIncluded.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                  <span className="text-small text-gray-700">{item}</span>
                </li>
              ))}
            </ul>

            {detail.upgradePath && (
              <Link
                href={detail.upgradePath.href}
                className="mt-6 inline-flex items-center gap-1 text-small font-semibold text-blue-600 hover:text-blue-700"
              >
                See what {detail.upgradePath.name} adds
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <CTABanner
        title={`Ready for ${tier.name}?`}
        subtitle="Book a free 15-minute call and we'll walk you through exactly how this would work for your business."
        buttonText="Book Your Free Call"
        buttonHref="/contact#book"
      />
    </>
  );
}
