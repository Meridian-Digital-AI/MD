'use client';

// Code block with a one-click "Copy" button — used in the install guides.

import { useState } from 'react';

export default function CopyBlock({
  value,
  className = '',
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback: select-all not implemented; user can manually copy.
    }
  }

  return (
    <div className={`flex items-stretch overflow-hidden rounded-lg border border-slate-200 ${className}`}>
      <pre className="flex-1 overflow-x-auto bg-slate-50 px-3 py-2.5 text-xs text-slate-800">
        <code>{value}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className="border-l border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        {copied ? 'Copied ✓' : 'Copy'}
      </button>
    </div>
  );
}
