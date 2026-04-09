import Link from 'next/link';
import {
  UtensilsCrossed,
  Wrench,
  Scissors,
  Sparkles,
  Shirt,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Wrench,
  Scissors,
  Sparkles,
  Shirt,
};

interface SectorCardProps {
  name: string;
  slug: string;
  icon: string;
  shortDescription: string;
}

export default function SectorCard({
  name,
  slug,
  icon,
  shortDescription,
}: SectorCardProps) {
  const IconComponent = iconMap[icon];

  return (
    <Link
      href={`/sectors/${slug}`}
      className="flex cursor-pointer flex-col items-start rounded-xl border border-gray-200 bg-white p-6 card-hover h-full"
      aria-label={`Learn more about our ${name} services`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10">
        {IconComponent ? (
          <IconComponent className="h-12 w-12 text-blue-600" aria-hidden="true" />
        ) : (
          <div className="h-12 w-12" />
        )}
      </div>

      <h3 className="mt-4 text-h3 text-gray-900">{name}</h3>
      <p className="mt-2 text-small text-gray-500">{shortDescription}</p>
    </Link>
  );
}
