// Self-serve install guide — one page per platform, dynamically routed.
//
//   /dashboard/setup/wix
//   /dashboard/setup/squarespace
//   /dashboard/setup/wordpress
//   /dashboard/setup/webflow
//   /dashboard/setup/shopify
//   /dashboard/setup/other
//
// Each page renders the client's actual tracking script + lead webhook
// pre-filled with their API key — they hit "Copy" and paste into the
// platform's custom-code area.
//
// Screenshots are TODO — we ship the prose first, drop in screenshots later.

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentClient } from '@/lib/dashboard/getCurrentClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import CopyBlock from './CopyBlock';

type Platform = 'wix' | 'squarespace' | 'wordpress' | 'webflow' | 'shopify' | 'other';

const VALID: readonly Platform[] = ['wix', 'squarespace', 'wordpress', 'webflow', 'shopify', 'other'];

const TITLES: Record<Platform, string> = {
  wix: 'Add tracking on Wix',
  squarespace: 'Add tracking on Squarespace',
  wordpress: 'Add tracking on WordPress',
  webflow: 'Add tracking on Webflow',
  shopify: 'Add tracking on Shopify',
  other: 'Add tracking on a custom site',
};

// Per-platform step lists. Keep prose tight — non-technical users skim.
const STEPS: Record<Platform, Array<{ title: string; body: string }>> = {
  wix: [
    { title: 'Open your Wix site editor', body: 'Log in at wix.com → My Sites → Edit Site for your business site.' },
    { title: 'Open Settings → Custom Code', body: 'In the top-left, click Settings (gear icon), then Custom Code in the left sidebar.' },
    { title: 'Click "Add Custom Code"', body: 'Top-right of the Custom Code page.' },
    { title: 'Paste the script', body: 'Paste the snippet below into the box.' },
    { title: 'Choose where to add it', body: 'Set "Add Code to Pages" → "All pages, load once". Set "Place Code in" → "Body — end".' },
    { title: 'Apply and publish', body: 'Click Apply. Then in the editor, click Publish (top-right). Tracking goes live in ~1 minute.' },
  ],
  squarespace: [
    { title: 'Open your site dashboard', body: 'Log in at squarespace.com and select the site.' },
    { title: 'Settings → Advanced → Code Injection', body: 'In the left menu: Settings → Developer Tools → Code Injection.' },
    { title: 'Paste into "Footer"', body: 'Paste the script into the Footer text area (NOT Header).' },
    { title: 'Save', body: 'Click Save in the top-left. Live within a minute.' },
  ],
  wordpress: [
    { title: 'Pick a method', body: 'Easiest is the free plugin "Insert Headers and Footers" (or WPCode). Install and activate it from Plugins → Add New.' },
    { title: 'Open the plugin', body: 'In the left menu: Settings → Insert Headers and Footers (or Code Snippets).' },
    { title: 'Paste in the "Footer" box', body: 'Paste the script into the footer / before-body-end text area.' },
    { title: 'Save', body: 'Click Save. Live immediately.' },
  ],
  webflow: [
    { title: 'Open your project', body: 'Log in at webflow.com → open the project.' },
    { title: 'Project Settings → Custom Code', body: 'Top-left logo → Project Settings → Custom Code tab.' },
    { title: 'Paste into "Before </body> tag"', body: 'Paste the script into the box labelled "Before </body> tag".' },
    { title: 'Save and publish', body: 'Click Save. Then publish your site. Live within seconds.' },
  ],
  shopify: [
    { title: 'Open your theme', body: 'Shopify admin → Online Store → Themes → click "Edit code" on your live theme.' },
    { title: 'Open theme.liquid', body: 'In the file list under Layout, click theme.liquid.' },
    { title: 'Paste before </body>', body: 'Find the line that says </body> near the bottom. Paste the script on the line just above it.' },
    { title: 'Save', body: 'Click Save (top-right). Live immediately.' },
  ],
  other: [
    { title: 'Find your site\'s template / footer', body: 'Most sites have a template, footer file, or HTML where the closing </body> tag lives. If you\'re unsure who built your site, ask whoever made it — or use the "Send to my web person" option in the dashboard.' },
    { title: 'Paste the script before </body>', body: 'The snippet goes immediately before the closing </body> tag, on every page.' },
    { title: 'Republish / redeploy', body: 'Save and republish your site. Tracking goes live within a minute.' },
  ],
};

export default async function SetupGuidePage({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform } = await params;
  if (!VALID.includes(platform as Platform)) notFound();
  const p = platform as Platform;

  const ctx = await getCurrentClient();
  const supabase = await createSupabaseServerClient();
  const { data: client } = await supabase
    .from('clients')
    .select('api_key')
    .eq('id', ctx.client.id)
    .single();
  const apiKey = client?.api_key as string | undefined;
  if (!apiKey) notFound();

  const base =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://meridian-digital-partners.com';
  const trackingScript = `<script src="${base}/track.js" data-key="${apiKey}"></script>`;
  const leadWebhook = `${base}/api/leads/${ctx.client.slug}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to dashboard
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--color-navy-900)]">{TITLES[p]}</h2>
        <p className="mt-1 text-slate-600">
          Two things to install: a tracking script (so we can show you visitor counts) and a lead webhook
          (so contact form submissions land in your dashboard).
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">1. Tracking script</h3>
        <p className="mt-1 text-xs text-slate-500">Paste this single line into your site&rsquo;s custom-code area.</p>
        <CopyBlock value={trackingScript} className="mt-3" />

        <ol className="mt-5 space-y-3 text-sm">
          {STEPS[p].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                {i + 1}
              </span>
              <div>
                <div className="font-medium text-slate-900">{step.title}</div>
                <div className="text-slate-600">{step.body}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">2. Lead webhook</h3>
        <p className="mt-1 text-xs text-slate-500">
          The URL where your contact form should send submissions. Paste this as the form&rsquo;s
          &ldquo;submit URL&rdquo; or webhook destination.
        </p>
        <CopyBlock value={leadWebhook} className="mt-3" />
        <p className="mt-3 text-xs text-slate-600">
          The endpoint accepts standard form fields: <code>name</code>, <code>email</code>,
          <code>phone</code>, <code>message</code>, <code>source</code>. Anything extra is logged but ignored.
        </p>
      </section>

      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <h3 className="text-sm font-semibold text-emerald-900">How to know it worked</h3>
        <p className="mt-1 text-sm text-emerald-900">
          Visit your live site once after publishing. Then come back to your <Link className="underline" href="/dashboard">dashboard</Link>.
          Within ~60 seconds, the &ldquo;Connect your website&rdquo; checklist item turns green and shows
          <em> &ldquo;Tracking active — pageviews are flowing&rdquo;</em>.
        </p>
        <p className="mt-2 text-sm text-emerald-900">
          For the lead webhook: submit your contact form once with your own email. Within seconds,
          the lead appears in your dashboard&rsquo;s leads list.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">Stuck?</h3>
        <p className="mt-1 text-sm text-slate-600">
          Go back to your <Link className="underline" href="/dashboard">dashboard</Link> and pick one of the
          other two options — &ldquo;Have us set it up&rdquo; or &ldquo;Send instructions to my web person&rdquo;.
          Both unblock you in minutes.
        </p>
      </section>
    </div>
  );
}
