'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TIER_LABELS, type PackageTier } from '@/lib/dashboard/packageFeatures';

const TIERS: PackageTier[] = ['get-started', 'grow', 'full-partner', 'website-only'];

export default function EditClientForm({
  slug,
  initialBusinessName,
  initialTier,
  initialDomain,
}: {
  slug: string;
  initialBusinessName: string;
  initialTier: string;
  initialDomain: string;
}) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [tier, setTier] = useState<PackageTier>(initialTier as PackageTier);
  const [domain, setDomain] = useState(initialDomain);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    businessName !== initialBusinessName ||
    tier !== initialTier ||
    (domain || '') !== (initialDomain || '');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/clients/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          package_tier: tier,
          domain: domain || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || json.error || 'Something went wrong.');
        setSubmitting(false);
        return;
      }
      router.push(`/admin/clients/${slug}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message || 'Network error.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
      <Field label="Slug (read-only)">
        <input
          type="text"
          readOnly
          value={slug}
          className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-500"
        />
      </Field>

      <Field label="Business name" required>
        <input
          type="text"
          required
          maxLength={200}
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
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
          disabled={submitting || !dirty || !businessName}
          className="rounded-lg bg-[var(--color-navy-900)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
        {!dirty && <span className="text-xs text-slate-400">No changes to save.</span>}
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
