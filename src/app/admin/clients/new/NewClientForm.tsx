'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TIER_LABELS, type PackageTier } from '@/lib/dashboard/packageFeatures';

const TIERS: PackageTier[] = ['get-started', 'grow', 'full-partner', 'website-only'];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .slice(0, 50);
}

export default function NewClientForm() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [tier, setTier] = useState<PackageTier>('get-started');
  const [domain, setDomain] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onBusinessNameChange(v: string) {
    setBusinessName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          slug,
          package_tier: tier,
          domain: domain || null,
          primary_email: primaryEmail || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || json.error || 'Something went wrong.');
        setSubmitting(false);
        return;
      }
      // Redirect to the new client's admin detail page where they can copy the API key.
      router.push(`/admin/clients/${json.slug}`);
    } catch (err) {
      setError((err as Error).message || 'Network error.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
      <Field label="Business name" required hint="Shown across the dashboard.">
        <input
          type="text"
          required
          maxLength={200}
          value={businessName}
          onChange={(e) => onBusinessNameChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g. Acme Bakery"
        />
      </Field>

      <Field
        label="Slug"
        required
        hint="Lowercase, hyphens only. Used in URLs and as the lead-capture endpoint identifier."
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">/api/leads/</span>
          <input
            type="text"
            required
            pattern="^[a-z0-9](?:[a-z0-9\-]{0,48}[a-z0-9])?$"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase());
            }}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="acme-bakery"
          />
        </div>
      </Field>

      <Field label="Package tier" required>
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value as PackageTier)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {TIERS.map((t) => (
            <option key={t} value={t}>
              {TIER_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Website domain" hint="Optional. Just metadata for now.">
        <input
          type="text"
          maxLength={200}
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="acmebakery.co.uk"
        />
      </Field>

      <Field
        label="Primary login email"
        hint="Optional. If provided, this email is added to the signup allowlist and auto-attached to this client when they first sign in."
      >
        <input
          type="email"
          value={primaryEmail}
          onChange={(e) => setPrimaryEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="owner@acmebakery.co.uk"
        />
      </Field>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || !businessName || !slug}
          className="rounded-lg bg-[var(--color-navy-900)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create client'}
        </button>
        <span className="text-xs text-slate-400">
          API key generates automatically — visible on the client&rsquo;s admin page.
        </span>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {required && <span className="text-xs text-red-500">required</span>}
      </div>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </label>
  );
}
