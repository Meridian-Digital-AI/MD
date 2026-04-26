import Image from 'next/image';

type DemoHeroProps = {
  slug: string;
  name: string;
};

const HERO_IMAGES: Record<
  string,
  {
    src: string;
    alt: string;
    objectPosition: string;
    /** colour pulled from the photo for label background */
    accentBg: string;
    /** label text colour */
    accentText: string;
    /** soft tint laid over the photo to keep colours calm and on-brand */
    overlay: string;
    /** small industry tag shown over the photo */
    label: string;
  }
> = {
  'oriental-city': {
    src: '/work/oriental-city.jpg',
    alt: 'A warm noodle bowl with chopsticks, photographed top-down on a cream surface.',
    objectPosition: 'center',
    accentBg: 'rgba(255, 247, 235, 0.92)',
    accentText: '#5C3A1E',
    overlay:
      'linear-gradient(180deg, rgba(28,16,8,0) 35%, rgba(28,16,8,0.55) 100%)',
    label: 'Restaurant',
  },
  'parkside-garage': {
    src: '/work/parkside-garage.jpg',
    alt: 'A calm, organised toolbox of polished spanners on a wooden surface.',
    objectPosition: 'center',
    accentBg: 'rgba(232, 238, 242, 0.92)',
    accentText: '#0F1B2D',
    overlay:
      'linear-gradient(180deg, rgba(11,19,31,0) 35%, rgba(11,19,31,0.6) 100%)',
    label: 'Garage',
  },
};

export default function DemoHero({ slug, name }: DemoHeroProps) {
  const config = HERO_IMAGES[slug];
  if (!config) return null;

  return (
    <div className="relative h-[280px] w-full overflow-hidden bg-gray-100">
      <Image
        src={config.src}
        alt={config.alt}
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover"
        style={{ objectPosition: config.objectPosition }}
        priority={false}
      />

      {/* tint to keep palette calm and unify the two cards */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: config.overlay }}
        aria-hidden="true"
      />

      {/* industry label — top left */}
      <span
        className="absolute top-4 left-4 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] backdrop-blur-sm"
        style={{
          background: config.accentBg,
          color: config.accentText,
        }}
      >
        {config.label}
      </span>

      {/* business name — bottom left */}
      <div className="absolute bottom-5 left-5 right-5">
        <span className="block font-sora text-2xl font-semibold text-white drop-shadow-md">
          {name}
        </span>
      </div>
    </div>
  );
}
