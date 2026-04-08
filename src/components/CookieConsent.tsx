'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'meridian-cookie-consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="cookie-consent fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-6 py-4 shadow-lg dark:border-navy-700 dark:bg-navy-900"
      role="region"
      aria-label="Cookie consent"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-small text-gray-700 dark:text-gray-400 text-center sm:text-left">
          We use cookies to improve your experience. See our{' '}
          <Link
            href="/privacy"
            className="underline transition-colors hover:text-blue-600"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={decline}
            className="btn-secondary text-sm px-4 py-2"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={accept}
            className="btn-primary text-sm px-4 py-2"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
