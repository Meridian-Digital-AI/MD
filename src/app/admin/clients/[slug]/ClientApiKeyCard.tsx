'use client';

import { useState } from 'react';

export default function ClientApiKeyCard({ slug, apiKey }: { slug: string; apiKey: string }) {
  const [revealed, setReveal] = useState(false);
  const [copied, setCopied] = useState<'slug' | 'key' | null>(null);

  const masked = apiKey.slice(0, 8) + '••••••••••••••••••••••••' + apiKey.slice(-4);

  function copy(value: string, which: 'slug' | 'key') {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900">Lead-capture credentials</h3>
      <p className="mt-1 text-xs text-slate-500">
        Set these as <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_MERIDIAN_SLUG</code> and{' '}
        <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_MERIDIAN_KEY</code> on the client&rsquo;s website
        (Vercel project &rarr; Settings &rarr; Environment Variables) and redeploy.
      </p>

      <div className="mt-4 space-y-2">
        <Row label="Slug" value={slug} masked={slug} revealed copied={copied === 'slug'} onCopy={() => copy(slug, 'slug')} />
        <Row
          label="API key"
          value={apiKey}
          masked={masked}
          revealed={revealed}
          copied={copied === 'key'}
          onCopy={() => copy(apiKey, 'key')}
          onToggle={() => setReveal((r) => !r)}
        />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  masked,
  revealed,
  copied,
  onCopy,
  onToggle,
}: {
  label: string;
  value: string;
  masked: string;
  revealed: boolean;
  copied: boolean;
  onCopy: () => void;
  onToggle?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
      <span className="w-16 shrink-0 text-slate-400">{label}</span>
      <span className="flex-1 truncate">{revealed ? value : masked}</span>
      {onToggle && (
        <button
          onClick={onToggle}
          className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          {revealed ? 'Hide' : 'Reveal'}
        </button>
      )}
      <button
        onClick={onCopy}
        className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}
