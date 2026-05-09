'use client';

import { useState } from 'react';

export default function MetaShareHelper({ businessManagerId }: { businessManagerId: string | null }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  async function copyId() {
    if (!businessManagerId) return;
    try {
      await navigator.clipboard.writeText(businessManagerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — user can still select+copy manually */
    }
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Send this to the client (Meta ad-account access)
          </h3>
          <p className="mt-0.5 text-xs text-slate-600">
            Five-step partnership request the client completes inside their own Business Manager. Takes them ~3 minutes.
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium text-blue-700">{open ? 'Hide' : 'Show'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {!businessManagerId ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Set <code className="font-mono">META_BUSINESS_MANAGER_ID</code> in env vars (your agency BM ID — find it at{' '}
              <a href="https://business.facebook.com/settings/info" target="_blank" rel="noopener" className="underline">business.facebook.com → Business Settings → Business Info</a>).
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
              <span className="text-xs uppercase tracking-wide text-slate-500">Your BM ID</span>
              <code className="flex-1 font-mono text-sm text-slate-900">{businessManagerId}</code>
              <button
                type="button"
                onClick={copyId}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
          )}

          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>
              In <strong>your</strong> Meta Business Manager, go to{' '}
              <a href="https://business.facebook.com/settings/ad-accounts" target="_blank" rel="noopener" className="text-blue-700 underline">
                Business Settings → Ad Accounts
              </a>
              , pick the ad account, then click <strong>Add Partner</strong>.
            </li>
            <li>
              Paste Meridian&apos;s BM ID:{' '}
              <code className="font-mono text-xs">{businessManagerId ?? '<set env var>'}</code>.
            </li>
            <li>
              Tick <strong>Manage Ad Account</strong> (full control) or <strong>Advertise</strong> (read + run ads).
            </li>
            <li>Click <strong>Save</strong>. Meridian receives the partnership instantly.</li>
            <li>
              Reply to confirm — Meridian then assigns the ad account to the System User and the dropdown on this client&apos;s detail page populates automatically.
            </li>
          </ol>

          <p className="text-xs text-slate-500">
            No password sharing. No app review. The client keeps full ownership of their ad account and can revoke access at any time from the same screen.
          </p>
        </div>
      )}
    </div>
  );
}
