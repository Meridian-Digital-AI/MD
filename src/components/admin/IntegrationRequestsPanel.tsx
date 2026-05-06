'use client';

// Admin inbox for open integration requests submitted from the client
// onboarding checklist. Three kinds:
//
//   white_glove        — please install tracking for me
//   send_to_web_person — we already emailed instructions to their dev
//   build_site         — please build me a website
//
// Pick a row up by clicking "Mark in progress", finish it with "Mark done",
// or "Cancel" if it's a duplicate / no-longer-needed.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export type IntegrationRequestRow = {
  id: string;
  kind: 'white_glove' | 'send_to_web_person' | 'build_site';
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  platform: string | null;
  access_method: string | null;
  web_person_email: string | null;
  web_person_name: string | null;
  message: string | null;
  created_at: string;
  client_slug: string;
  client_business_name: string;
  requester_email: string | null;
};

const KIND_LABELS: Record<IntegrationRequestRow['kind'], { label: string; tone: string; icon: string }> = {
  white_glove:        { label: 'Install for me',  tone: 'bg-blue-100 text-blue-800',     icon: '🤝' },
  send_to_web_person: { label: 'Sent to web dev', tone: 'bg-purple-100 text-purple-800', icon: '📨' },
  build_site:         { label: 'Build a site',    tone: 'bg-amber-100 text-amber-800',   icon: '🛠' },
};

export default function IntegrationRequestsPanel({
  rows,
}: {
  rows: IntegrationRequestRow[];
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Onboarding inbox</h3>
        <p className="mt-1 text-xs text-slate-500">All clear — no open install or build requests.</p>
      </div>
    );
  }

  const open = rows.filter((r) => r.status === 'open');
  const inProgress = rows.filter((r) => r.status === 'in_progress');

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Onboarding inbox{' '}
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
            {rows.length}
          </span>
        </h3>
        <p className="text-[11px] text-slate-500">
          Requests from clients&rsquo; onboarding checklists
        </p>
      </div>

      {open.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Open ({open.length})</p>
          <ul className="mt-2 divide-y divide-slate-100">
            {open.map((r) => (
              <RequestRow key={r.id} row={r} />
            ))}
          </ul>
        </div>
      )}

      {inProgress.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">In progress ({inProgress.length})</p>
          <ul className="mt-2 divide-y divide-slate-100">
            {inProgress.map((r) => (
              <RequestRow key={r.id} row={r} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RequestRow({ row }: { row: IntegrationRequestRow }) {
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const meta = KIND_LABELS[row.kind];

  function update(status: 'in_progress' | 'done' | 'cancelled') {
    setErr(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/integration-requests/${row.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErr(json.message || 'Save failed');
          return;
        }
        router.refresh();
      } catch {
        setErr('Network error');
      }
    });
  }

  const subtitle = subtitleFor(row);
  const ageMins = Math.max(0, Math.round((Date.now() - new Date(row.created_at).getTime()) / 60_000));
  const ageLabel =
    ageMins < 60
      ? `${ageMins}m ago`
      : ageMins < 24 * 60
      ? `${Math.round(ageMins / 60)}h ago`
      : `${Math.round(ageMins / (60 * 24))}d ago`;

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base">{meta.icon}</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.tone}`}>
            {meta.label}
          </span>
          <Link
            href={`/admin/clients/${row.client_slug}`}
            className="text-sm font-semibold text-slate-900 hover:underline"
          >
            {row.client_business_name}
          </Link>
          <span className="text-[11px] text-slate-400">{ageLabel}</span>
        </div>
        <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
        {row.message && (
          <p className="mt-1 rounded-md bg-slate-50 px-2 py-1.5 text-[11px] italic text-slate-600">
            &ldquo;{row.message}&rdquo;
          </p>
        )}
        {err && <p className="mt-1 text-[11px] text-red-600">{err}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap gap-1.5">
        {row.status === 'open' && (
          <button
            type="button"
            onClick={() => update('in_progress')}
            disabled={isPending}
            className="rounded-md bg-[var(--color-navy-900)] px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            Mark in progress
          </button>
        )}
        <button
          type="button"
          onClick={() => update('done')}
          disabled={isPending}
          className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
        >
          Mark done
        </button>
        <button
          type="button"
          onClick={() => update('cancelled')}
          disabled={isPending}
          className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </li>
  );
}

function subtitleFor(r: IntegrationRequestRow): string {
  const requester = r.requester_email ? ` · from ${r.requester_email}` : '';
  if (r.kind === 'white_glove') {
    const platform = r.platform ? ` (${r.platform})` : '';
    const access = r.access_method ? ` · ${ACCESS_LABELS[r.access_method] ?? r.access_method}` : '';
    return `Wants us to install tracking${platform}${access}${requester}`;
  }
  if (r.kind === 'send_to_web_person') {
    const who = r.web_person_name
      ? `${r.web_person_name} <${r.web_person_email ?? ''}>`
      : (r.web_person_email ?? 'their web person');
    return `Instructions emailed to ${who}${requester}`;
  }
  // build_site
  const platform = r.platform ? ` · prefers ${r.platform}` : '';
  return `Wants us to build them a website${platform}${requester}`;
}

const ACCESS_LABELS: Record<string, string> = {
  add_user: 'add us as a user',
  share_login: 'share login',
  screenshare: 'screenshare',
};
