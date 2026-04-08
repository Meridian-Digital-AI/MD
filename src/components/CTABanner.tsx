import Link from 'next/link';

interface CTABannerProps {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonHref: string;
}

export default function CTABanner({
  title,
  subtitle,
  buttonText,
  buttonHref,
}: CTABannerProps) {
  return (
    <section className="w-full bg-blue-600 py-16 px-6 lg:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-h2 font-sora text-white">{title}</h2>
        <p className="text-body mt-4 text-blue-400/80">{subtitle}</p>
        <Link href={buttonHref} className="btn-inverted mt-8 inline-flex">
          {buttonText}
        </Link>
      </div>
    </section>
  );
}
