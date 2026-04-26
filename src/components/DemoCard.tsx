import { Check } from 'lucide-react';
import Link from 'next/link';
import type { Demo } from '@/lib/data/demos';
import DemoHero from './DemoHero';

type DemoCardProps = Pick<
  Demo,
  | 'name'
  | 'businessType'
  | 'features'
  | 'description'
  | 'gradientFrom'
  | 'gradientTo'
  | 'demoUrl'
  | 'screenshotAlt'
  | 'slug'
> & { caseStudyAvailable?: boolean };

export default function DemoCard({
  name,
  businessType,
  features,
  description,
  demoUrl,
  screenshotAlt,
  slug,
  caseStudyAvailable = false,
}: DemoCardProps) {
  const displayedFeatures = features.slice(0, 8);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white card-hover">
      <div role="img" aria-label={screenshotAlt}>
        <DemoHero slug={slug} name={name} />
      </div>

      {/* Content */}
      <div className="p-6">
        <span className="inline-block rounded-full bg-blue-600/10 px-3 py-1 text-overline text-blue-600">
          {businessType}
        </span>

        <h3 className="mt-3 text-h3 text-gray-900">{name}</h3>
        <p className="mt-2 text-body text-gray-500">{description}</p>

        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2" role="list">
          {displayedFeatures.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
                aria-hidden="true"
              />
              <span className="text-small text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <a
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex-1 text-center"
            aria-label={`View live demo of ${name}`}
          >
            View Live Demo
          </a>
          {caseStudyAvailable && (
            <Link
              href={`/work/${slug}`}
              className="flex-1 inline-flex items-center justify-center rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              aria-label={`Read full case study for ${name}`}
            >
              Read Case Study
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
