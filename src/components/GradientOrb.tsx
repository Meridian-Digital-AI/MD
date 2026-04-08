interface GradientOrbProps {
  className?: string;
  color?: 'blue' | 'amber' | 'emerald' | 'rose';
  size?: number;
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-500',
  amber: 'bg-amber-400',
  emerald: 'bg-emerald-400',
  rose: 'bg-rose-400',
};

export default function GradientOrb({
  className = '',
  color = 'blue',
  size = 400,
}: GradientOrbProps) {
  return (
    <div
      className={`gradient-orb absolute pointer-events-none rounded-full blur-3xl opacity-5 ${colorMap[color] ?? colorMap.blue} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
