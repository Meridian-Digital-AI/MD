'use client';

// Onboarding checklist — appears on /dashboard until the client has at
// least one pageview and one lead. Three integration paths so non-technical
// clients aren't left with "paste this script before </body>" — they can
// hand it to us, hand it to their web person, or DIY.
//
// Live verification: we re-poll the dashboard via router.refresh() once the
// integration request is sent (or every 30s while open) so the ticks update
// when pageviews/leads start flowing.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  clientSlug: string;
  businessName: string;
  hasPageviews: boolean;
  hasLeads: boolean;
}

type Path = null | 'white_glove' | 'send_web_person' | 'diy';

export default function ClientOnboardingChecklist({
  clientSlug,
  businessName,
  hasPageviews,
  hasLeads,
}: Props) {
  const router = useRouter();
  const [path, setPath] = useState<Path>(null);
  const [submitted, setSubmitted] = useState<'white_glove' | 'send_web_person' | null>(null);

  // Live verification: while either step is unticked, re-fetch every 30s.
  // Stops once both are done (parent unmounts us anyway).
  useEffect(() => {
    if (hasPageviews && hasLeads) return;
    const t = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(t);
  }, [hasPageviews, hasLeads, router]);

  const totalSteps = 3;
  const doneSteps = 1 + (hasPageviews ? 1 : 0) + (hasLeads ? 1 : 0);
  const pct = Math.round((doneSteps / totalSteps) * 100);

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-navy-900)]">
            Set up {businessName}
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            Get your dashboard live. We&rsquo;ll handle the technical bit if you want us to.
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-700">{doneSteps} of {totalSteps} done</span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
        <div
          className="h-full bg-[var(--color-navy-900)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-5 space-y-3">
        <ChecklistRow
          done
          title="Account created"
          subtitle={`${businessName} dashboard is ready`}
        />
        <ChecklistRow
          done={hasPageviews}
          title="Connect your website"
          subtitle={
            hasPageviews
              ? 'Tracking active — pageviews are flowing'
              : 'So we can show you visitors and behaviour'
          }
        >
          {!hasPageviews && (
            <PathPicker
              path={path}
              setPath={setPath}
              clientSlug={clientSlug}
              submitted={submitted}
              setSubmitted={setSubmitted}
            />
          )}
        </ChecklistRow>
        <ChecklistRow
          done={hasLeads}
          title="Connect your lead form"
          subtitle={
            hasLeads
              ? 'Leads are flowing in'
              : 'So enquiries land in your dashboard automatically'
          }
        >
          {!hasLeads && hasPageviews && (
            <p className="mt-2 text-xs text-slate-600">
              Done at the same time as the website connection. Once your form fires
              its first submission you&rsquo;ll see it here.
            </p>
          )}
        </ChecklistRow>
      </ul>

      <div className="mt-5 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
        <strong className="text-slate-800">Meta Ads:</strong> handled by your Meridian Digital
        account manager. No setup needed on your side.
      </div>
    </div>
  );
}

function ChecklistRow({
  done,
  title,
  subtitle,
  children,
}: {
  done: boolean;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
            done
              ? 'bg-emerald-100 text-emerald-700'
              : 'border border-slate-300 bg-white text-slate-300'
          }`}
        >
          {done ? '✓' : '○'}
        </span>
        <div className="flex-1">
          <div className={`text-sm font-medium ${done ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
            {title}
          </div>
          <div className="text-xs text-slate-500">{subtitle}</div>
          {children}
        </div>
      </div>
    </li>
  );
}

function PathPicker({
  path,
  setPath,
  clientSlug,
  submitted,
  setSubmitted,
}: {
  path: Path;
  setPath: (p: Path) => void;
  clientSlug: string;
  submitted: 'white_glove' | 'send_web_person' | null;
  setSubmitted: (s: 'white_glove' | 'send_web_person' | null) => void;
}) {
  if (submitted === 'white_glove') {
    return (
      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
        ✓ Got it. Your Meridian Digital account manager will be in touch within 1 working day
        to schedule the install.
      </div>
    );
  }
  if (submitted === 'send_web_person') {
    return (
      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
        ✓ Instructions sent. They&rsquo;ll get a clear email with everything they need.
        We&rsquo;ll let you know once they&rsquo;ve done it.
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <PathButton
          icon="🤝"
          title="Have us set it up"
          subtitle="Recommended — takes us 10 mins"
          active={path === 'white_glove'}
          onClick={() => setPath('white_glove')}
        />
        <PathButton
          icon="📨"
          title="Send to my web person"
          subtitle="We email them everything"
          active={path === 'send_web_person'}
          onClick={() => setPath('send_web_person')}
        />
        <PathButton
          icon="🛠️"
          title="Show me how"
          subtitle="DIY guides per platform"
          active={path === 'diy'}
          onClick={() => setPath('diy')}
        />
      </div>

      {path === 'white_glove' && (
        <WhiteGloveForm
          clientSlug={clientSlug}
          onSubmitted={() => setSubmitted('white_glove')}
        />
      )}
      {path === 'send_web_person' && (
        <SendToWebPersonForm
          clientSlug={clientSlug}
          onSubmitted={() => setSubmitted('send_web_person')}
        />
      )}
      {path === 'diy' && (
        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3 text-xs">
          <p className="text-slate-700">Pick your platform for a step-by-step guide:</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(['wix', 'squarespace', 'wordpress', 'webflow', 'shopify', 'other'] as const).map((p) => (
              <a
                key={p}
                href={`/dashboard/setup/${p}`}
                className="rounded-md border border-slate-200 px-2 py-1.5 text-center text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              >
                {p === 'other' ? 'Other / not sure' : p[0].toUpperCase() + p.slice(1)}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PathButton({
  icon,
  title,
  subtitle,
  active,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start rounded-lg border p-3 text-left transition ${
        active
          ? 'border-[var(--color-navy-900)] bg-white shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="mt-1 text-xs font-semibold text-slate-900">{title}</span>
      <span className="text-[11px] text-slate-500">{subtitle}</span>
    </button>
  );
}

function WhiteGloveForm({
  clientSlug,
  onSubmitted,
}: {
  clientSlug: string;
  onSubmitted: () => void;
}) {
  const [platform, setPlatform] = useState('');
  const [access, setAccess] = useState<'add_user' | 'share_login' | 'screenshare'>('add_user');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch(`/api/dashboard/integration-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: clientSlug,
          kind: 'white_glove',
          platform: platform || null,
          access_method: access,
          message,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json.message || 'Could not send. Please try again.');
        setSubmitting(false);
        return;
      }
      onSubmitted();
    } catch {
      setErr('Network error.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 rounded-lg border border-slate-200 bg-white p-3 space-y-3 text-xs">
      <label className="block">
        <span className="font-medium text-slate-700">What platform is your website on?</span>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
        >
          <option value="">Select platform…</option>
          <option value="wix">Wix</option>
          <option value="squarespace">Squarespace</option>
          <option value="wordpress">WordPress</option>
          <option value="webflow">Webflow</option>
          <option value="shopify">Shopify</option>
          <option value="other">Other / not sure</option>
        </select>
      </label>
      <fieldset>
        <legend className="font-medium text-slate-700">How can we log in?</legend>
        <div className="mt-1 space-y-1">
          {[
            { v: 'add_user', label: "Add us as a user (you'll get our email)" },
            { v: 'share_login', label: "Share login (we'll send a secure link)" },
            { v: 'screenshare', label: 'Hop on a 15-min screenshare to do it together' },
          ].map((o) => (
            <label key={o.v} className="flex items-center gap-2">
              <input
                type="radio"
                name="access"
                value={o.v}
                checked={access === o.v}
                onChange={() => setAccess(o.v as 'add_user' | 'share_login' | 'screenshare')}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="font-medium text-slate-700">Anything else we should know? (optional)</span>
        <textarea
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
        />
      </label>
      {err && <div className="text-red-600">{err}</div>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-[var(--color-navy-900)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? 'Sending…' : 'Send request'}
      </button>
    </form>
  );
}

function SendToWebPersonForm({
  clientSlug,
  onSubmitted,
}: {
  clientSlug: string;
  onSubmitted: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch(`/api/dashboard/integration-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: clientSlug,
          kind: 'send_to_web_person',
          web_person_email: email,
          web_person_name: name,
          message,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json.message || 'Could not send. Please try again.');
        setSubmitting(false);
        return;
      }
      onSubmitted();
    } catch {
      setErr('Network error.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 rounded-lg border border-slate-200 bg-white p-3 space-y-3 text-xs">
      <label className="block">
        <span className="font-medium text-slate-700">Web person&rsquo;s email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@johnsweb.dev"
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
        />
      </label>
      <label className="block">
        <span className="font-medium text-slate-700">Their name (optional)</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Smith"
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
        />
      </label>
      <label className="block">
        <span className="font-medium text-slate-700">Personal note (optional)</span>
        <textarea
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Hi John, can you do this when you have a sec? Cheers."
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
        />
      </label>
      {err && <div className="text-red-600">{err}</div>}
      <button
        type="submit"
        disabled={submitting || !email}
        className="rounded-md bg-[var(--color-navy-900)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? 'Sending…' : 'Send instructions'}
      </button>
    </form>
  );
}
