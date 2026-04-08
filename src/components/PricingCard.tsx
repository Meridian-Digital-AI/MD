import { Check } from 'lucide-react';
import type { PricingTier } from '@/lib/data/pricing';

type PricingCardProps = Pick<
  PricingTier,
  'name' | 'monthlyPrice' | 'setupFee' | 'target' | 'highlighted' | 'features' | 'contractLength'
>;

export default function PricingCard({
  name,
  monthlyPrice,
  setupFee,
  target,
  highlighted,
  features,
  contractLength,
}: PricingCardProps) {
  return (
    <div
      className={`relative flex flex-col rounded-xl border bg-white p-6 card-hover ${
        highlighted
          ? 'border-blue-600 border-t-[3px]'
          : 'border-gray-200'
      }`}
    >
      {highlighted && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-overline text-gray-900">
          Most Popular
        </span>
      )}

      <h3 className="text-h3 text-gray-900">{name}</h3>
      <p className="mt-1 text-small text-gray-500">{target}</p>

      <div className="mt-4">
        <span className="text-[2rem] font-bold text-gray-900">
          &pound;{monthlyPrice}
        </span>
        <span className="text-small text-gray-500">/month</span>
      </div>

      <p className="mt-1 text-small text-gray-400">
        &pound;{setupFee} one-off setup fee
      </p>

      <p className="mt-1 text-small text-gray-400">{contractLength}</p>

      <ul className="mt-6 flex flex-col gap-3" role="list">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check
              className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
              aria-hidden="true"
            />
            <span className="text-small text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <a
          href="/contact"
          className={highlighted ? 'btn-primary w-full' : 'btn-secondary w-full'}
          aria-label={`Get started with the ${name} plan`}
        >
          Get Started
        </a>
      </div>
    </div>
  );
}
