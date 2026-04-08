interface SectionHeadingProps {
  overline?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  light?: boolean;
}

export default function SectionHeading({
  overline,
  title,
  subtitle,
  centered = true,
  light = false,
}: SectionHeadingProps) {
  return (
    <div className={centered ? 'text-center' : ''}>
      {overline && (
        <p className="text-overline text-blue-600 mb-3">{overline}</p>
      )}
      <h2
        className={`text-h2 font-sora ${light ? 'text-white' : 'text-gray-900'}`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`text-body mt-4 max-w-2xl ${centered ? 'mx-auto' : ''} ${light ? 'text-gray-400' : 'text-gray-500'}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
