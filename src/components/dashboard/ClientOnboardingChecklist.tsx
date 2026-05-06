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
  websiteStatus: 'live' | 'in_progress' | 'none';
  // The kind of the latest still-pending integration request for this client,
  // if any. Used to keep the "✓ Got it" confirmation state visible across
  // page refreshes — submitted-state was previously local-only so it
  // disappeared on reload.
  pendingRequestKind:
    | 'white_glove'
    | 'send_to_web_person'
    | 'build_site'
    | null;
}

type Path = null | 'white_glove' | 'send_web_person' | 'diy' | 'build_site';
type Submitted = 'white_glove' | 'send_web_person' | 'build_site' | null;

// Map DB-side kind values onto the local Submitted type. The component uses
// `send_web_person` (no `to_`) internally, while the DB / API uses
// `send_to_web_person` — keep that translation in one place.
function pendingToSubmitted(
  k: 'white_glove' | 'send_to_web_person' | 'build_site' | null,
): Submitted {
  if (k === 'send_to_web_person') return 'send_web_person';
  if (k === 'white_glove' || k === 'build_site') return k;
  return null;
}

export default function ClientOnboardingChecklist({
  clientSlug,
  businessName,
  hasPageviews,
  hasLeads,
  websiteStatus,
  pendingRequestKind,
}: Props) {
  const router = useRouter();
  const [path, setPath] = useState<Path>(null);
  const [submitted, setSubmitted] = useState<Submitted>(
    pendingToSubmitted(pendingRequestKind),
  );

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
          title={websiteStatus === 'none' ? 'Get your website live' : 'Connect your website'}
          subtitle={
            hasPageviews
              ? 'Tracking active — pageviews are flowing'
              : websiteStatus === 'in_progress'
              ? "We're building your site — tracking will be installed automatically"
              : websiteStatus === 'none'
              ? "No website yet? We'll build one for you with tracking already baked in."
              : 'So we can show you visitors and behaviour'
          }
        >
          {!hasPageviews && websiteStatus === 'in_progress' && (
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
              ⏳ Site in production. Your Meridian Digital account manager is on it —
              you&rsquo;ll hear from them within 1 working day to scope and start the build.
              Tracking + lead capture will be installed automatically as part of delivery.
            </div>
          )}
          {!hasPageviews && websiteStatus !== 'in_progress' && (
            <PathPicker
              path={path}
              setPath={setPath}
              clientSlug={clientSlug}
              submitted={submitted}
              setSubmitted={setSubmitted}
              websiteStatus={websiteStatus}
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
  websiteStatus,
}: {
  path: Path;
  setPath: (p: Path) => void;
  clientSlug: string;
  submitted: 'white_glove' | 'send_web_person' | 'build_site' | null;
  setSubmitted: (s: 'white_glove' | 'send_web_person' | 'build_site' | null) => void;
  websiteStatus: 'live' | 'in_progress' | 'none';
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
  if (submitted === 'build_site') {
    return (
      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
        ✓ Got it. We&rsquo;ll be in touch within 1 working day to scope your site and kick off
        the build. Tracking + lead capture will be baked in from day one — nothing for you to install later.
      </div>
    );
  }

  // When the client has no website yet, lead with the "build me one" path.
  // The other paths still show below, smaller, in case they actually do have
  // a site we don't know about yet.
  const showBuildSiteFirst = websiteStatus === 'none';

  return (
    <div className="mt-3 space-y-2">
      {showBuildSiteFirst && (
        <PathButton
          icon="🛠"
          title="I don't have a website yet — build me one"
          subtitle="We'll build a fast marketing site with tracking + lead capture baked in"
          active={path === 'build_site'}
          onClick={() => setPath('build_site')}
          fullWidth
        />
      )}

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
          icon="🧰"
          title="Show me how"
          subtitle="DIY guides per platform"
          active={path === 'diy'}
          onClick={() => setPath('diy')}
        />
      </div>

      {!showBuildSiteFirst && (
        <button
          type="button"
          onClick={() => setPath('build_site')}
          className="w-full rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 hover:border-slate-400 hover:bg-slate-50"
        >
          Don&rsquo;t have a website yet?{' '}
          <span className="font-semibold text-[var(--color-navy-900)]">We&rsquo;ll build you one →</span>
        </button>
      )}

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
      {path === 'build_site' && (
        <BuildSiteForm
          clientSlug={clientSlug}
          onSubmitted={() => setSubmitted('build_site')}
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
  fullWidth = false,
}: {
  icon: string;
  title: string;
  subtitle: string;
  active: boolean;
  onClick: () => void;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${fullWidth ? 'w-full flex-row items-center gap-3' : 'flex-col items-start'} flex rounded-lg border p-3 text-left transition ${
        active
          ? 'border-[var(--color-navy-900)] bg-white shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className={fullWidth ? 'flex flex-col' : 'contents'}>
        <span className={`${fullWidth ? '' : 'mt-1'} text-xs font-semibold text-slate-900`}>{title}</span>
        <span className="text-[11px] text-slate-500">{subtitle}</span>
      </span>
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

function BuildSiteForm({
  clientSlug,
  onSubmitted,
}: {
  clientSlug: string;
  onSubmitted: () => void;
}) {
  const [platform, setPlatform] = useState('');
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
          kind: 'build_site',
          platform: platform || null,
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
      <div className="rounded-md bg-slate-50 p-2.5 text-[11px] text-slate-600">
        We&rsquo;ll build you a fast marketing site (typically 1&ndash;5 working days). Hosting is on us — you only pay for your domain
        (~£10/yr from Namecheap or GoDaddy). Tracking + lead capture are baked in from day one.
      </div>
      <label className="block">
        <span className="font-medium text-slate-700">Any preference on platform / style? (optional)</span>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
        >
          <option value="">No preference — you decide</option>
          <option value="other">Custom marketing site (we host, fastest)</option>
          <option value="wix">Wix (so I can edit it later)</option>
          <option value="squarespace">Squarespace (so I can edit it later)</option>
          <option value="webflow">Webflow (so I can edit it later)</option>
          <option value="wordpress">WordPress (so I can edit it later)</option>
          <option value="shopify">Shopify (I&rsquo;ll be selling online)</option>
        </select>
      </label>
      <label className="block">
        <span className="font-medium text-slate-700">Tell us what you want (optional)</span>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. plumber in Edinburgh, want a simple 1-pager with quote-request form. I have a logo and 5 photos."
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
        />
      </label>
      {err && <div className="text-red-600">{err}</div>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-[var(--color-navy-900)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? 'Sending…' : 'Kick off site build'}
      </button>
    </form>
  );
}
