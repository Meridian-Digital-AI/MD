'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function LoginForm() {
  const params = useSearchParams();
  const next = params.get('next') ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      setStatus('sent');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-navy-900)] px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-[var(--color-navy-900)]">Sign in to your dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          We&apos;ll email you a one-tap link. No password needed.
        </p>

        {status === 'sent' ? (
          <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">
            Check your inbox at <strong>{email}</strong>. Click the link to sign in.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-800">
              Email address
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourbusiness.com"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-[var(--color-blue-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-600)]/20"
              />
            </label>

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full rounded-lg bg-[var(--color-blue-600)] px-4 py-2.5 font-semibold text-white shadow hover:opacity-90 disabled:opacity-60"
            >
              {status === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
            </button>

            {status === 'error' && errorMsg && (
              <p className="text-sm text-red-600">{errorMsg}</p>
            )}
          </form>
        )}

        <p className="mt-6 text-xs text-slate-500">
          Don&apos;t have an account yet? Speak to your Meridian Digital account manager and
          we&apos;ll set you up.
        </p>
      </div>
    </main>
  );
}
