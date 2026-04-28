'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import DarkModeToggle from '@/components/DarkModeToggle';

const navLinks = [
  { label: 'What We Build', href: '/services' },
  { label: 'Our Work', href: '/work' },
  { label: 'Sectors', href: '/sectors' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  /* ------------------------------------------------------------------ */
  /*  Scroll detection                                                   */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Close mobile menu on route change                                  */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /* ------------------------------------------------------------------ */
  /*  Lock body scroll when overlay is open                              */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  /* ------------------------------------------------------------------ */
  /*  Focus trap + Escape key                                            */
  /* ------------------------------------------------------------------ */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!mobileOpen) return;

      if (e.key === 'Escape') {
        setMobileOpen(false);
        hamburgerRef.current?.focus();
        return;
      }

      if (e.key === 'Tab' && mobileNavRef.current) {
        const focusable = mobileNavRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [mobileOpen],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /* Focus first link when overlay opens */
  useEffect(() => {
    if (mobileOpen && mobileNavRef.current) {
      const firstLink =
        mobileNavRef.current.querySelector<HTMLElement>('a[href]');
      firstLink?.focus();
    }
  }, [mobileOpen]);

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */
  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <>
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 dark:bg-navy-900/80 backdrop-blur-md shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-0 min-h-[44px] text-lg"
          aria-label="Meridian Digital — Home"
        >
          <span className="font-sora font-bold text-gray-900 dark:text-white">
            MERIDIAN
          </span>
          <span className="font-sora font-normal text-gray-900 dark:text-white ml-1">
            DIGITAL
          </span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`relative min-h-[44px] inline-flex items-center text-sm font-medium transition-colors
                  ${
                    isActive(link.href)
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'
                  }
                  group
                `}
              >
                {link.label}
                {/* Animated underline dot/line */}
                <span
                  className={`absolute -bottom-1 left-1/2 h-[3px] rounded-full bg-blue-600 dark:bg-blue-400 transition-all duration-300 -translate-x-1/2
                    ${
                      isActive(link.href)
                        ? 'w-full'
                        : 'w-0 group-hover:w-full'
                    }
                  `}
                />
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop right side */}
        <div className="hidden lg:flex items-center gap-3">
          <DarkModeToggle />
          <Link
            href="/login"
            className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
          >
            Sign in
          </Link>
          <Link href="/contact#book" className="btn-primary text-sm">
            Book a Call
          </Link>
        </div>

        {/* Mobile: dark mode toggle + hamburger */}
        <div className="flex lg:hidden items-center gap-2">
          <DarkModeToggle />
          <button
            ref={hamburgerRef}
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="relative inline-flex items-center justify-center w-11 h-11 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-navy-800"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            <span
              className={`absolute transition-all duration-300 ${
                mobileOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
              }`}
            >
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            </span>
            <span
              className={`absolute transition-all duration-300 ${
                mobileOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
              }`}
            >
              <X className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            </span>
          </button>
        </div>
      </nav>
    </header>

    {/* Mobile overlay — rendered OUTSIDE <header> because the header's
        backdrop-filter (when scrolled) creates a containing block that would
        otherwise trap a position:fixed child inside the header's bounds. */}
    <div
        id="mobile-nav"
        ref={mobileNavRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={`fixed inset-0 top-0 z-[60] flex flex-col bg-white dark:bg-navy-900 transition-all duration-300 lg:hidden ${
          mobileOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Mobile overlay header — mirrors main nav */}
        <div className="flex items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-0 min-h-[44px] text-lg"
            aria-label="Meridian Digital — Home"
            onClick={() => setMobileOpen(false)}
          >
            <span className="font-sora font-bold text-gray-900 dark:text-white">
              MERIDIAN
            </span>
            <span className="font-sora font-normal text-gray-900 dark:text-white ml-1">
              DIGITAL
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="inline-flex items-center justify-center w-11 h-11 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-navy-800"
            aria-label="Close menu"
          >
            <X className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          </button>
        </div>

        {/* Mobile links */}
        <ul className="flex flex-col items-center justify-center flex-1 gap-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`text-2xl font-sora font-medium min-h-[44px] inline-flex items-center transition-colors ${
                  isActive(link.href)
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="text-xl font-sora font-medium min-h-[44px] inline-flex items-center text-gray-700 dark:text-gray-200"
            >
              Sign in
            </Link>
          </li>
          <li className="mt-4">
            <Link
              href="/contact#book"
              onClick={() => setMobileOpen(false)}
              className="btn-primary text-base px-8"
            >
              Book a Call
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}
