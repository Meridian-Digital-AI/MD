import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="hero-gradient dot-grid min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <p className="text-overline text-blue-400 mb-4">404</p>
        <h1 className="text-display font-sora text-white mb-4">Page Not Found</h1>
        <p className="text-body text-gray-400 mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been moved or
          doesn&apos;t exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn-primary">
            Back to Home
          </Link>
          <Link href="/contact" className="btn-ghost">
            Get in Touch
          </Link>
        </div>
      </div>
    </section>
  );
}
