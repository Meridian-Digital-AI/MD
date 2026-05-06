// Admin endpoint to create a new client.
// POST /api/admin/clients
// Body: { business_name, slug, package_tier, domain?, primary_email? }
// Inserts into public.clients (api_key auto-generates via gen_random_uuid()).
// If primary_email is provided, also adds it to approved_emails so the client
// can sign in and is auto-attached to this client_id.

import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { sendEmail, escapeHtml } from '@/lib/email/resend';

const PUBLIC_BASE =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://meridian-digital-partners.com';

type Tier = 'get-started' | 'grow' | 'full-partner' | 'website-only';
const TIERS: Tier[] = ['get-started', 'grow', 'full-partner', 'website-only'];

interface Body {
  business_name?: string;
  slug?: string;
  package_tier?: string;
  domain?: string | null;
  primary_email?: string | null;
}

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  // Auth: must be admin.
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // Validate.
  const business_name = (body.business_name ?? '').trim();
  const slug = (body.slug ?? '').trim().toLowerCase();
  const package_tier = (body.package_tier ?? '').trim();
  const domain = body.domain?.trim() || null;
  const primary_email = body.primary_email?.trim().toLowerCase() || null;

  if (!business_name || business_name.length > 200) {
    return NextResponse.json({ error: 'business_name_invalid' }, { status: 400 });
  }
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: 'slug_invalid', message: 'Slug must be lowercase letters, numbers and hyphens (2-50 chars).' },
      { status: 400 },
    );
  }
  if (!TIERS.includes(package_tier as Tier)) {
    return NextResponse.json({ error: 'package_tier_invalid' }, { status: 400 });
  }
  if (primary_email && !EMAIL_RE.test(primary_email)) {
    return NextResponse.json({ error: 'primary_email_invalid' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Check slug uniqueness up-front for a clean error.
  const { data: existing } = await admin
    .from('clients')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: 'slug_taken', message: `Slug "${slug}" is already in use.` },
      { status: 409 },
    );
  }

  // Insert client.
  const { data: created, error: insertErr } = await admin
    .from('clients')
    .insert({ business_name, slug, package_tier, domain })
    .select('id, slug')
    .single();
  if (insertErr || !created) {
    console.error('[admin/clients] insert failed', insertErr);
    return NextResponse.json({ error: 'insert_failed', message: insertErr?.message }, { status: 500 });
  }

  // Optional: add primary_email to approved_emails so the client can sign in,
  // then send them an invite email with a one-click magic link.
  let inviteSent = false;
  let inviteWarning: string | null = null;
  if (primary_email) {
    const { error: emailErr } = await admin
      .from('approved_emails')
      .upsert(
        {
          email: primary_email,
          role: 'client',
          client_id: created.id,
          business_name_hint: business_name,
          created_by: user.id,
        },
        { onConflict: 'email' },
      );
    if (emailErr) {
      // Client is created, but email allowlist failed. Surface but don't block.
      console.error('[admin/clients] approved_emails upsert failed', emailErr);
      return NextResponse.json(
        { ok: true, slug: created.slug, warning: 'client_created_but_email_allowlist_failed', message: emailErr.message },
        { status: 201 },
      );
    }

    // Auto-invite — Supabase generates an invite link, but instead of using
    // its raw action_link (which routes through Supabase's verify endpoint
    // and doesn't play nicely with our SSR session cookies), we pull out the
    // hashed_token and build our own URL pointing at /auth/confirm. That
    // route uses our SSR client + verifyOtp, which sets cookies cleanly on
    // our domain — same flow that works for the standard /login PKCE path.
    //
    // We try `invite` first (which both creates the auth user AND generates
    // a one-time link). If the user already exists in auth.users (e.g. they
    // were previously invited and the row got cleaned up from public.clients
    // but not from auth.users), invite-type rejects them — fall back to
    // `magiclink`, which works for existing users.
    //
    // Best-effort: any failure here is logged but doesn't block client creation.
    try {
      let hashedToken: string | undefined;
      let linkType: 'invite' | 'magiclink' = 'invite';

      const inviteResult = await admin.auth.admin.generateLink({
        type: 'invite',
        email: primary_email,
      });

      if (inviteResult.error) {
        const msg = (inviteResult.error.message || '').toLowerCase();
        const userExists =
          msg.includes('already') ||
          msg.includes('registered') ||
          msg.includes('exists');
        if (!userExists) {
          console.error('[admin/clients] generateLink invite failed', inviteResult.error);
          inviteWarning = `invite_link_failed: ${inviteResult.error.message}`;
        } else {
          // Existing auth user — fall back to a magic-link.
          linkType = 'magiclink';
          const magicResult = await admin.auth.admin.generateLink({
            type: 'magiclink',
            email: primary_email,
          });
          if (magicResult.error) {
            console.error('[admin/clients] generateLink magiclink failed', magicResult.error);
            inviteWarning = `magiclink_failed: ${magicResult.error.message}`;
          } else {
            hashedToken = magicResult.data?.properties?.hashed_token;
          }
        }
      } else {
        hashedToken = inviteResult.data?.properties?.hashed_token;
      }

      if (!hashedToken && !inviteWarning) {
        inviteWarning = 'invite_link_failed: missing hashed_token';
      }

      if (hashedToken) {
        const actionLink = `${PUBLIC_BASE}/auth/confirm?token_hash=${encodeURIComponent(hashedToken)}&type=${linkType}&next=${encodeURIComponent('/dashboard')}`;
        {
          const result = await sendEmail({
            to: primary_email,
            subject: `Welcome to Meridian Digital — your ${business_name} dashboard is ready`,
            html: `
              <h2 style="font-family:Helvetica,Arial,sans-serif;color:#0f172a">Welcome to Meridian Digital</h2>
              <p>We&rsquo;ve set up a dashboard for <strong>${escapeHtml(business_name)}</strong> where you can:</p>
              <ul>
                <li>See live website visitors and where they came from</li>
                <li>Track every lead the moment they arrive</li>
                <li>Watch your monthly Meta Ads performance</li>
                <li>Keep tabs on what we&rsquo;re delivering each month</li>
              </ul>
              <p>Click the button below to sign in. No password — the link logs you in automatically and works on any device.</p>
              <p style="margin:24px 0">
                <a href="${actionLink}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:12px 22px;border-radius:8px;font-weight:600;text-decoration:none">
                  Open my dashboard
                </a>
              </p>
              <p style="color:#64748b;font-size:13px">If the button doesn&rsquo;t work, copy and paste this link:<br>
                <a href="${actionLink}">${actionLink}</a>
              </p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
              <p style="color:#64748b;font-size:12px">
                Once you&rsquo;re in, you&rsquo;ll see a short setup checklist with three options for getting tracking installed —
                most clients pick &ldquo;have us do it&rdquo;. We&rsquo;ll be in touch within 1 working day either way.
              </p>
              <p style="color:#64748b;font-size:12px">Any questions, just reply to this email.</p>
            `,
          });
          if (result.skipped) {
            inviteWarning = 'invite_email_skipped_no_resend_key';
          } else if (!result.ok) {
            inviteWarning = `invite_email_failed: ${result.error ?? 'unknown'}`;
          } else {
            inviteSent = true;
          }
        }
      }
    } catch (err) {
      console.error('[admin/clients] invite flow threw', err);
      inviteWarning = `invite_threw: ${(err as Error).message}`;
    }
  }

  return NextResponse.json(
    { ok: true, slug: created.slug, inviteSent, ...(inviteWarning ? { warning: inviteWarning } : {}) },
    { status: 201 },
  );
}
