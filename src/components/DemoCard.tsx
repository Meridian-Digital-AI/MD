import { Check } from 'lucide-react';
import type { Demo } from '@/lib/data/demos';

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
>;

export default function DemoCard({
  name,
  businessType,
  features,
  description,
  gradientFrom,
  gradientTo,
  demoUrl,
  screenshotAlt,
}: DemoCardProps) {
  const displayedFeatures = features.slice(0, 8);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white card-hover">
      {/* Gradient preview area */}
      <div
        className="flex min-h-[300px] items-center justify-center p-8"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
        }}
        role="img"
        aria-label={screenshotAlt}
      >
        <span className="text-h2 text-center font-bold text-white drop-shadow-lg">
          {name}
        </span>
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

        <div className="mt-6">
          <a
            href={demoUrl}
            className="btn-primary w-full"
            aria-label={`View live demo of ${name}`}
          >
            View Live Demo
          </a>
        </div>
      </div>
    </div>
  );
}
