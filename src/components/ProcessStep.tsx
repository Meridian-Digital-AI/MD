import {
  Phone,
  Code,
  ClipboardCheck,
  Rocket,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Phone,
  Code,
  ClipboardCheck,
  Rocket,
};

interface ProcessStepProps {
  stepNumber: number;
  title: string;
  description: string;
  icon: string;
  isLast?: boolean;
}

export default function ProcessStep({
  stepNumber,
  title,
  description,
  icon,
  isLast = false,
}: ProcessStepProps) {
  const IconComponent = iconMap[icon];

  return (
    <div className="relative flex flex-col items-center text-center md:items-start md:text-left">
      {/* Connecting line — bottom on mobile, right on desktop */}
      {!isLast && (
        <>
          {/* Mobile: vertical line below */}
          <div
            className="absolute bottom-0 left-1/2 h-8 w-px -translate-x-1/2 translate-y-full bg-gray-200 md:hidden"
            aria-hidden="true"
          />
          {/* Desktop: horizontal line to the right */}
          <div
            className="absolute right-0 top-8 hidden h-px w-8 translate-x-full bg-gray-200 md:block"
            aria-hidden="true"
          />
        </>
      )}

      {/* Step number circle */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
        {stepNumber}
      </div>

      {/* Icon */}
      {IconComponent && (
        <div className="mt-4">
          <IconComponent
            className="h-8 w-8 text-blue-600"
            aria-hidden="true"
          />
        </div>
      )}

      {/* Text */}
      <h3 className="mt-3 text-h3 text-gray-900">{title}</h3>
      <p className="mt-2 text-small text-gray-500">{description}</p>
    </div>
  );
}
