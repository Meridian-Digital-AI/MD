// Client-side endpoint for the onboarding checklist's two help-me paths:
//
//   POST /api/dashboard/integration-request
//        body: { slug, kind: 'white_glove', platform?, access_method, message? }
//        body: { slug, kind: 'send_to_web_person', web_person_email, web_person_name?, message? }
//
// Auth: client must be logged in and attached to the requested slug.
// Effect: inserts into integration_requests + fires email(s) via Resend.

import { NextResponse } from 'next/server';
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from '@/lib/supabase/server';
import { sendEmail, escapeHtml } from '@/lib/email/resend';

const ADMIN_NOTIFY =
  process.env.LEAD_ADMIN_NOTIFY_EMAIL || 'wandj@meridian-digital-partners.com';

const PUBLIC_BASE =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://meridian-digital-partners.com';

const VALID_PLATFORMS = ['wix', 'squarespace', 'wordpress', 'webflow', 'shopify', 'other'];
const VALID_ACCESS = ['add_user', 'share_login', 'screenshare'];

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: {
    slug?: unknown;
    kind?: unknown;
    platform?: unknown;
    access_method?: unknown;
    web_person_email?: unknown;
    web_person_name?: unknown;
    message?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const slug = typeof body.slug === 'string' ? body.slug : null;
  const kind = typeof body.kind === 'string' ? body.kind : null;
  if (
    !slug ||
    (kind !== 'white_glove' && kind !== 'send_to_web_person' && kind !== 'build_site')
  ) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  // Resolve the user's profile + ensure they're attached to this client.
  const { data: profile } = await supabase
    .from('users')
    .select('id, email, client_id')
    .eq('id', user.id)
    .single();
  if (!profile) return NextResponse.json({ error: 'profile_not_found' }, { status: 403 });

  const admin = createSupabaseAdminClient();
  const { data: client } = await admin
    .from('clients')
    .select('id, slug, business_name, domain, api_key')
    .eq('slug', slug)
    .maybeSingle();
  if (!client) return NextResponse.json({ error: 'client_not_found' }, { status: 404 });
  if (profile.client_id !== client.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const message =
    typeof body.message === 'string' ? body.message.trim().slice(0, 2000) || null : null;

  if (kind === 'white_glove') {
    const platform =
      typeof body.platform === 'string' && VALID_PLATFORMS.includes(body.platform)
        ? body.platform
        : null;
    const accessMethod =
      typeof body.access_method === 'string' && VALID_ACCESS.includes(body.access_method)
        ? body.access_method
        : null;
    if (!accessMethod) {
      return NextResponse.json({ error: 'invalid_access_method' }, { status: 400 });
    }

    const { error } = await admin.from('integration_requests').insert({
      client_id: client.id,
      requested_by: profile.id,
      kind,
      platform,
      access_method: accessMethod,
      message,
    });
    if (error) {
      console.error('[integration-request/insert white_glove]', error);
      return NextResponse.json({ error: 'save_failed', message: error.message }, { status: 500 });
    }

    // Email admin so they can action.
    await sendEmail({
      to: ADMIN_NOTIFY,
      subject: `[Onboarding] ${client.business_name} requested install help`,
      html: `
        <h2>White-glove install request</h2>
        <p><strong>Client:</strong> ${escapeHtml(client.business_name as string)}
          (<a href="${PUBLIC_BASE}/admin/clients/${escapeHtml(client.slug as string)}">${escapeHtml(client.slug as string)}</a>)</p>
        <p><strong>Domain:</strong> ${escapeHtml((client.domain as string | null) ?? 'not set')}</p>
        <p><strong>Platform:</strong> ${escapeHtml(platform ?? 'unspecified')}</p>
        <p><strong>Access method:</strong> ${escapeHtml(accessMethod)}</p>
        <p><strong>Requested by:</strong> ${escapeHtml(profile.email as string)}</p>
        ${message ? `<p><strong>Message:</strong><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p>` : ''}
        <hr>
        <p style="color:#64748b;font-size:12px">
          Tracking script: <code>&lt;script src="${PUBLIC_BASE}/track.js" data-key="${escapeHtml(client.api_key as string)}"&gt;&lt;/script&gt;</code><br>
          Lead webhook: <code>${PUBLIC_BASE}/api/leads/${escapeHtml(client.slug as string)}</code>
        </p>
      `,
      replyTo: profile.email as string,
    });

    return NextResponse.json({ ok: true });
  }

  if (kind === 'build_site') {
    // Optional preferences: which platform style they want, what they need
    // (basic 1-pager / multi-page / e-comm), and the message.
    const platform =
      typeof body.platform === 'string' && VALID_PLATFORMS.includes(body.platform)
        ? body.platform
        : null;

    const { error } = await admin.from('integration_requests').insert({
      client_id: client.id,
      requested_by: profile.id,
      kind,
      platform,
      message,
    });
    if (error) {
      console.error('[integration-request/insert build_site]', error);
      return NextResponse.json({ error: 'save_failed', message: error.message }, { status: 500 });
    }

    // Flip the client's website_status so the dashboard shows the
    // "site in production" banner instead of the install-tracking nag.
    const { error: updErr } = await admin
      .from('clients')
      .update({ website_status: 'in_progress' })
      .eq('id', client.id);
    if (updErr) {
      // Non-fatal — request is logged; admin can flip the flag manually.
      console.error('[integration-request/build_site update website_status]', updErr);
    }

    await sendEmail({
      to: ADMIN_NOTIFY,
      subject: `[Onboarding] ${client.business_name} needs a website built`,
      html: `
        <h2>New site build request</h2>
        <p><strong>Client:</strong> ${escapeHtml(client.business_name as string)}
          (<a href="${PUBLIC_BASE}/admin/clients/${escapeHtml(client.slug as string)}">${escapeHtml(client.slug as string)}</a>)</p>
        <p><strong>Domain (existing or planned):</strong> ${escapeHtml((client.domain as string | null) ?? 'not set')}</p>
        <p><strong>Preferred platform / style:</strong> ${escapeHtml(platform ?? 'not specified')}</p>
        <p><strong>Requested by:</strong> ${escapeHtml(profile.email as string)}</p>
        ${message ? `<p><strong>Their notes:</strong><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p>` : ''}
        <hr>
        <p style="color:#64748b;font-size:12px">
          The client's <code>website_status</code> has been set to <strong>in_progress</strong> —
          their dashboard will now show "site in production" instead of nagging them to install tracking.
          When the build is done and tracking is in place, flip it back to <strong>live</strong>
          from the admin client page.
        </p>
      `,
      replyTo: profile.email as string,
    });

    return NextResponse.json({ ok: true });
  }

  // kind === 'send_to_web_person'
  const webEmail =
    typeof body.web_person_email === 'string' ? body.web_person_email.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(webEmail)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }
  const webName =
    typeof body.web_person_name === 'string'
      ? body.web_person_name.trim().slice(0, 200) || null
      : null;

  const { error } = await admin.from('integration_requests').insert({
    client_id: client.id,
    requested_by: profile.id,
    kind,
    web_person_email: webEmail,
    web_person_name: webName,
    message,
  });
  if (error) {
    console.error('[integration-request/insert send_to_web_person]', error);
    return NextResponse.json({ error: 'save_failed', message: error.message }, { status: 500 });
  }

  // Email the web person (CC admin + the client).
  const greeting = webName ? `Hi ${escapeHtml(webName)},` : 'Hi,';
  await sendEmail({
    to: webEmail,
    subject: `Quick install for ${client.business_name} — ~5 mins`,
    html: `
      <p>${greeting}</p>
      <p>${escapeHtml(profile.email as string)} at <strong>${escapeHtml(client.business_name as string)}</strong>
        is setting up a new analytics + lead-capture dashboard with us at Meridian Digital. We need a small one-time
        install on their website — should take about 5 minutes.</p>
      <h3>What you need to do</h3>
      <ol>
        <li>
          Add this script just before the closing <code>&lt;/body&gt;</code> tag on every page of
          <strong>${escapeHtml((client.domain as string | null) ?? client.business_name as string)}</strong>:
          <pre style="background:#f1f5f9;padding:12px;border-radius:6px;overflow:auto"><code>&lt;script src="${PUBLIC_BASE}/track.js" data-key="${escapeHtml(client.api_key as string)}"&gt;&lt;/script&gt;</code></pre>
        </li>
        <li>
          On the site&rsquo;s contact / enquiry form, set the form-submit destination (or webhook) to:
          <pre style="background:#f1f5f9;padding:12px;border-radius:6px;overflow:auto"><code>${PUBLIC_BASE}/api/leads/${escapeHtml(client.slug as string)}</code></pre>
          Form fields the endpoint accepts: <code>name</code>, <code>email</code>, <code>phone</code>, <code>message</code>, <code>source</code>.
        </li>
        <li>Reply to this email when done — we&rsquo;ll verify pageviews and a test lead come through and confirm.</li>
      </ol>
      ${message ? `<p style="border-left:3px solid #cbd5e1;padding-left:12px;color:#334155"><em>From ${escapeHtml(profile.email as string)}:</em><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p>` : ''}
      <p>Step-by-step guides for major platforms:
        <a href="${PUBLIC_BASE}/dashboard/setup/wix">Wix</a> ·
        <a href="${PUBLIC_BASE}/dashboard/setup/squarespace">Squarespace</a> ·
        <a href="${PUBLIC_BASE}/dashboard/setup/wordpress">WordPress</a> ·
        <a href="${PUBLIC_BASE}/dashboard/setup/webflow">Webflow</a> ·
        <a href="${PUBLIC_BASE}/dashboard/setup/shopify">Shopify</a>
      </p>
      <p>Any questions, just reply to this email — copies the client and our team.</p>
      <p>Thanks,<br>Meridian Digital</p>
    `,
    replyTo: profile.email as string,
  });

  // Also CC the admin so they can shadow.
  await sendEmail({
    to: ADMIN_NOTIFY,
    subject: `[Onboarding] ${client.business_name} sent install instructions to ${webEmail}`,
    html: `
      <p><strong>${escapeHtml(client.business_name as string)}</strong> just emailed install instructions to their web person.</p>
      <p><strong>Web person:</strong> ${escapeHtml(webName ?? '—')} (${escapeHtml(webEmail)})</p>
      <p><strong>Requested by:</strong> ${escapeHtml(profile.email as string)}</p>
      ${message ? `<p><strong>Their message:</strong><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p>` : ''}
      <p><a href="${PUBLIC_BASE}/admin/clients/${escapeHtml(client.slug as string)}">Open client</a></p>
    `,
  });

  return NextResponse.json({ ok: true });
}
