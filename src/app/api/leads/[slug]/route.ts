// Public lead-capture endpoint. Client websites POST form submissions here.
//
//   POST /api/leads/<client-slug>
//   Authorization: Bearer <client.api_key>
//   Content-Type: application/json
//   {
//     name, email, phone, message,
//     source?, source_page?, referrer?,
//     utm_source?, utm_medium?, utm_campaign?, utm_term?, utm_content?
//   }
//
// CORS is wide open — anyone can post a lead, but the api_key gates which
// client_id the row gets attributed to. The api_key is per-client and
// rotatable from /admin/clients/[slug]/settings (TODO).

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { sendEmail, escapeHtml } from '@/lib/email/resend';
import crypto from 'node:crypto';

const ADMIN_NOTIFY = process.env.LEAD_ADMIN_NOTIFY_EMAIL || 'wandj@meridian-digital-partners.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

interface LeadBody {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  source?: string;
  source_page?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'meridian-default-salt';
  return crypto.createHash('sha256').update(salt + ':' + ip).digest('hex').slice(0, 32);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;

  // Auth
  const auth = req.headers.get('authorization') || '';
  const apiKey = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!apiKey || !/^[0-9a-f-]{36}$/i.test(apiKey)) {
    return NextResponse.json({ error: 'missing_or_invalid_api_key' }, { status: 401, headers: corsHeaders });
  }

  let body: LeadBody;
  try {
    body = (await req.json()) as LeadBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400, headers: corsHeaders });
  }

  // Honeypot: any field starting with "_" is treated as a bot trap. If non-empty, silently 200.
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    if (k.startsWith('_') && typeof v === 'string' && v.trim().length > 0) {
      return NextResponse.json({ ok: true }, { status: 200, headers: corsHeaders });
    }
  }

  // Minimal validation: at least one of email / phone / message
  if (!body.email && !body.phone && !body.message) {
    return NextResponse.json({ error: 'empty_submission' }, { status: 400, headers: corsHeaders });
  }

  // Length limits
  const trim = (s: string | undefined, max: number) => (s ? s.slice(0, max).trim() : null);
  const lead = {
    name: trim(body.name, 200),
    email: trim(body.email, 200),
    phone: trim(body.phone, 50),
    message: trim(body.message, 5000),
    source: trim(body.source, 50),
    source_page: trim(body.source_page, 500),
    referrer: trim(body.referrer, 500),
    utm_source: trim(body.utm_source, 100),
    utm_medium: trim(body.utm_medium, 100),
    utm_campaign: trim(body.utm_campaign, 100),
    utm_term: trim(body.utm_term, 100),
    utm_content: trim(body.utm_content, 200),
  };

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  const ipHash = ip ? hashIp(ip) : null;

  const supabase = createSupabaseAdminClient();

  // Verify slug + api_key match the same client
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('id, slug, api_key, business_name')
    .eq('slug', slug)
    .maybeSingle();

  if (clientErr || !client) {
    return NextResponse.json({ error: 'unknown_client' }, { status: 404, headers: corsHeaders });
  }
  if (client.api_key !== apiKey) {
    return NextResponse.json({ error: 'invalid_api_key' }, { status: 401, headers: corsHeaders });
  }

  // Insert
  const { data: inserted, error: insertErr } = await supabase
    .from('leads')
    .insert({
      client_id: client.id,
      ...lead,
      ip_hash: ipHash,
    })
    .select('id')
    .single();

  if (insertErr || !inserted) {
    console.error('[leads] insert failed', insertErr);
    return NextResponse.json({ error: 'insert_failed' }, { status: 500, headers: corsHeaders });
  }

  // Notification email. We await it so Vercel's serverless runtime doesn't kill
  // the request before the Resend POST finishes. Resend itself is fast (~200ms)
  // so this adds negligible latency to the form submitter.
  try {
    await notify(client.business_name, lead, inserted.id, supabase);
  } catch (e) {
    console.error('[leads] notify threw', e);
  }

  return NextResponse.json({ ok: true, id: inserted.id }, { status: 201, headers: corsHeaders });
}

type LeadInsert = {
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: string | null;
  source_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
};

async function notify(
  businessName: string,
  lead: LeadInsert,
  leadId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
) {
  const subject = `New lead for ${businessName}${lead.name ? ': ' + lead.name : ''}`;
  const html = `
    <h2 style="margin:0 0 12px;font-family:system-ui">New lead — ${escapeHtml(businessName)}</h2>
    <table style="border-collapse:collapse;font-family:system-ui;font-size:14px">
      ${row('Name', lead.name)}
      ${row('Email', lead.email)}
      ${row('Phone', lead.phone)}
      ${row('Source', lead.source)}
      ${row('Page', lead.source_page)}
      ${lead.utm_campaign ? row('Campaign', `${lead.utm_source ?? ''} / ${lead.utm_medium ?? ''} / ${lead.utm_campaign}`) : ''}
    </table>
    ${lead.message ? `<p style="margin-top:16px;font-family:system-ui;font-size:14px;white-space:pre-wrap">${escapeHtml(lead.message)}</p>` : ''}
    <p style="margin-top:24px;font-family:system-ui;font-size:12px;color:#666">
      View in your dashboard: <a href="https://www.meridian-digital-partners.com/dashboard/leads">meridian-digital-partners.com/dashboard/leads</a>
    </p>
  `;

  // Admin notification (always)
  const adminResult = await sendEmail({
    to: ADMIN_NOTIFY,
    subject: `[Meridian] ${subject}`,
    html,
    replyTo: lead.email || undefined,
  });
  if (adminResult.ok && !adminResult.skipped) {
    await supabase
      .from('lead_notifications')
      .insert({ lead_id: leadId, channel: 'admin_email', recipient: ADMIN_NOTIFY, resend_id: adminResult.id })
      .then(() => null, () => null);
  }
  // Phase 3: per-client recipient. We don't have a client_notify_email column yet; will add.
}

function row(label: string, value: string | null): string {
  if (!value) return '';
  return `<tr><td style="padding:4px 12px 4px 0;color:#666">${escapeHtml(label)}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`;
}
