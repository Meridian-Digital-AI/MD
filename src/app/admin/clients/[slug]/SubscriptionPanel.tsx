'use client';

import { useState } from 'react';

// Subscription panel on the admin client detail page.
//
// Shows the client's current subscription state. If they're not yet
// subscribed, lets the admin enter the prospect's email + click "Generate
// payment link" to mint a Stripe Checkout URL. Admin then copies the URL
// and pastes it into an email/WhatsApp to the prospect.
//
// Once the prospect pays, the Stripe webhook flips
// subscription_status='active' and the panel re-renders to show the active
// state on next page load.

interface Props {
  clientId: string;
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export function SubscriptionPanel({
  clientId,
  subscriptionStatus,
  stripeCustomerId,
  stripeSubscriptionId,
}: Props) {
  const [email, setEmail] = useState('');
  const [generating, setGenerating] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCheckoutUrl(null);
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/checkout-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, customer_email: email }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? 'Failed to create checkout link.');
      }
      setCheckoutUrl(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error.');
    } finally {
      setGenerating(false);
    }
  }

  async function copy() {
    if (!checkoutUrl) return;
    await navigator.clipboard.writeText(checkoutUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Active / trialing / past_due — render a status block, no link generation
  if (
    subscriptionStatus === 'active' ||
    subscriptionStatus === 'trialing' ||
    subscriptionStatus === 'past_due'
  ) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Subscription</h3>
          <StatusPill status={subscriptionStatus} />
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Stripe customer</dt>
            <dd className="font-mono text-xs text-slate-700">
              {stripeCustomerId ?? '—'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Subscription ID</dt>
            <dd className="font-mono text-xs text-slate-700">
              {stripeSubscriptionId ?? '—'}
            </dd>
          </div>
        </dl>
        {stripeCustomerId && (
          <a
            href={`https://dashboard.stripe.com/customers/${stripeCustomerId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm text-[var(--color-blue-600)] hover:underline"
          >
            Manage in Stripe →
          </a>
        )}
      </div>
    );
  }

  // Canceled — show the past status, no further action
  if (subscriptionStatus === 'canceled') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Subscription</h3>
          <StatusPill status={subscriptionStatus} />
        </div>
        <p className="mt-4 text-sm text-slate-500">
          This subscription has been canceled. Generate a new payment link if
          you want to re-onboard them.
        </p>
        {/* Re-use the generation flow below by re-rendering below this block */}
        <hr className="my-6 border-slate-200" />
        {renderGenerationForm()}
      </div>
    );
  }

  // Default — unpaid / incomplete / paused — show the generation form
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Subscription</h3>
        <StatusPill status={subscriptionStatus} />
      </div>
      <p className="mt-2 text-sm text-slate-500">
        Generate a Stripe Checkout link and send it to the client. They&apos;ll
        be marked as Active automatically once they pay.
      </p>
      <hr className="my-6 border-slate-200" />
      {renderGenerationForm()}
    </div>
  );

  // Inline so it can be reused by the canceled-state UI above.
  function renderGenerationForm() {
    return (
      <>
        <form onSubmit={handleGenerate} className="space-y-3">
          <div>
            <label
              htmlFor="customer_email"
              className="block text-xs font-medium text-slate-700"
            >
              Client&apos;s email
            </label>
            <input
              type="email"
              id="customer_email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="alan@otterycomputers.co.uk"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--color-blue-600)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue-600)]"
            />
          </div>
          <button
            type="submit"
            disabled={generating || !email}
            className="rounded-lg bg-[var(--color-blue-600)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {generating ? 'Generating…' : 'Generate payment link'}
          </button>
        </form>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        {checkoutUrl && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-medium text-emerald-900">
              Payment link ready (expires in 24 hours):
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                readOnly
                value={checkoutUrl}
                className="flex-1 rounded-md border border-emerald-300 bg-white px-2 py-1 font-mono text-xs text-slate-700"
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                onClick={copy}
                type="button"
                className="rounded-md bg-emerald-700 px-3 py-1 text-xs font-semibold text-white"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="mt-2 text-xs text-emerald-800">
              Paste into an email or WhatsApp to {email}.
            </p>
          </div>
        )}
      </>
    );
  }
}

function StatusPill({ status }: { status: string }) {
  const tones: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700',
    trialing: 'bg-emerald-50 text-emerald-700',
    past_due: 'bg-amber-50 text-amber-700',
    paused: 'bg-amber-50 text-amber-700',
    incomplete: 'bg-amber-50 text-amber-700',
    canceled: 'bg-slate-100 text-slate-600',
    unpaid: 'bg-slate-100 text-slate-600',
  };
  const tone = tones[status] ?? 'bg-slate-100 text-slate-600';
  const label = status.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase());
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      {label}
    </span>
  );
}
