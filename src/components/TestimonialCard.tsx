import { Star } from 'lucide-react';
import type { Testimonial } from '@/lib/data/testimonials';

type TestimonialCardProps = Pick<
  Testimonial,
  'quote' | 'name' | 'businessType' | 'rating'
>;

export default function TestimonialCard({
  quote,
  name,
  businessType,
  rating,
}: TestimonialCardProps) {
  return (
    <blockquote className="card-hover rounded-2xl border border-gray-200 bg-white p-6 dark:border-navy-700 dark:bg-navy-800">
      <div className="flex gap-0.5 mb-4" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-200 text-gray-200 dark:fill-navy-700 dark:text-navy-700'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
      <p className="text-body italic text-gray-700 dark:text-gray-400">
        &ldquo;{quote}&rdquo;
      </p>
      <footer className="mt-4">
        <cite className="not-italic">
          <span className="font-semibold text-gray-900 dark:text-white">
            {name}
          </span>
          <span className="block text-small text-gray-500">{businessType}</span>
        </cite>
      </footer>
    </blockquote>
  );
}
