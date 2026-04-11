'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { X, Gift, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'md-email-popup';
const DELAY_MS = 4000;

export default function EmailCapturePopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Only show to first-time visitors
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dismissed' || stored === 'subscribed') {
        return;
      }
    } catch {
      // localStorage blocked — don't show popup
      return;
    }

    const timer = window.setTimeout(() => {
      setOpen(true);
    }, DELAY_MS);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(false);
    try {
      if (status !== 'success') {
        localStorage.setItem(STORAGE_KEY, 'dismissed');
      }
    } catch {
      // Ignore storage errors
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'popup-discount' }),
      });

      if (!res.ok) {
        throw new Error('Something went wrong');
      }

      setStatus('success');
      try {
        localStorage.setItem(STORAGE_KEY, 'subscribed');
      } catch {
        // Ignore storage errors
      }

      // Auto-dismiss after success
      window.setTimeout(() => setOpen(false), 2500);
    } catch {
      setStatus('error');
      setErrorMsg('We couldn\u2019t save that. Please try again.');
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-6 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-popup-title"
      onClick={close}
    >
      <div
        className="relative w-full max-w-md animate-slide-up overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-navy-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-navy-700 dark:hover:text-white"
          aria-label="Close popup"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header banner */}
        <div className="hero-gradient px-8 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/20 ring-1 ring-blue-500/30">
            <Gift className="h-7 w-7 text-blue-400" />
          </div>
          <p className="mt-4 text-overline text-blue-400">Welcome offer</p>
          <h2
            id="email-popup-title"
            className="mt-2 text-2xl font-sora font-bold text-white"
          >
            Get 10% off your first month
          </h2>
          <p className="mt-2 text-small text-gray-400">
            Drop your email and we&rsquo;ll send you a discount code plus a
            free copy of our &ldquo;Local Business Automation&rdquo; guide.
          </p>
        </div>

        {/* Form */}
        <div className="px-8 py-6">
          {status === 'success' ? (
            <div className="flex flex-col items-center py-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              <p className="mt-3 text-h3 text-gray-900 dark:text-white">
                You&rsquo;re in!
              </p>
              <p className="mt-2 text-small text-gray-500">
                Check your inbox for your discount code.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <label
                htmlFor="popup-email"
                className="text-small font-semibold text-gray-700 dark:text-gray-200"
              >
                Email address
              </label>
              <input
                id="popup-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourbusiness.co.uk"
                disabled={status === 'loading'}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-body text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
              />
              {errorMsg ? (
                <p className="mt-2 text-small text-rose-500">{errorMsg}</p>
              ) : null}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === 'loading' ? 'Sending\u2026' : 'Claim my discount'}
              </button>
              <p className="mt-3 text-center text-xs text-gray-400">
                No spam. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
