import Link from 'next/link';
import { siteConfig } from '@/lib/data/config';
import { sectors } from '@/lib/data/sectors';

const quickLinks = [
  { label: 'What We Build', href: '/services' },
  { label: 'Our Work', href: '/work' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

const footerSectors = [
  { name: 'Restaurants', slug: 'restaurants' },
  { name: 'Garages', slug: 'garages' },
  { name: 'Salons', slug: 'salons' },
  { name: 'Cleaning', slug: 'cleaning' },
  { name: 'Dry Cleaners', slug: 'dry-cleaners' },
] as const;

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-navy-900 dot-grid-light text-white">
      {/* Main grid */}
      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1 — Brand */}
          <div>
            <Link href="/" className="inline-flex items-center text-lg" aria-label="Meridian Digital — Home">
              <span className="font-sora font-bold text-white">MERIDIAN</span>
              <span className="font-sora font-normal text-white ml-1">DIGITAL</span>
            </Link>
            <p className="mt-4 text-small text-gray-400 leading-relaxed">
              {siteConfig.tagline}
            </p>
            <p className="mt-2 text-small text-gray-400">{siteConfig.address}</p>
          </div>

          {/* Column 2 — Quick Links */}
          <div>
            <h3 className="text-overline text-gray-400 mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-small text-gray-200 transition-colors hover:text-blue-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Sectors */}
          <div>
            <h3 className="text-overline text-gray-400 mb-4">Sectors</h3>
            <ul className="space-y-3">
              {footerSectors.map((sector) => (
                <li key={sector.slug}>
                  <Link
                    href={`/sectors/${sector.slug}`}
                    className="text-small text-gray-200 transition-colors hover:text-blue-400"
                  >
                    {sector.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Contact */}
          <div>
            <h3 className="text-overline text-gray-400 mb-4">Contact</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="text-small text-gray-200 transition-colors hover:text-blue-400"
                >
                  {siteConfig.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${siteConfig.phone.replace(/\s/g, '')}`}
                  className="text-small text-gray-200 transition-colors hover:text-blue-400"
                >
                  {siteConfig.phone}
                </a>
              </li>
              <li>
                <p className="text-small text-gray-400">{siteConfig.workingHours}</p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-small text-gray-400 text-center sm:text-left">
            &copy; {currentYear} {siteConfig.name}. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-small text-gray-400 transition-colors hover:text-blue-400"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-small text-gray-400 transition-colors hover:text-blue-400"
            >
              Terms
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-6">
          <p className="text-center text-xs text-gray-500">
            Built with Next.js — the same technology we use for our clients.
          </p>
        </div>
      </div>
    </footer>
  );
}
