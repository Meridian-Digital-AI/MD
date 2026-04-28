// Magic-link callback. Supabase redirects here with `?code=...` after the user clicks
// the email link; we exchange the code for a session, then verify the email is on
// the approved allowlist. Unapproved emails get signed back out, logged to
// signup_requests for admin review, and redirected to /pending-approval.

import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { sendEmail, escapeHtml } from '@/lib/email/resend';

const ADMIN_NOTIFY = process.env.LEAD_ADMIN_NOTIFY_EMAIL || 'wandj@meridian-digital-partners.com';

function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'meridian-default-salt';
  return crypto.createHash('sha256').update(salt + ':' + ip).digest('hex').slice(0, 32);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/dashboard';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=callback', url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL('/login?error=callback', url.origin));
  }

  // Who just logged in?
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.redirect(new URL('/login?error=callback', url.origin));
  }
  const email = user.email.toLowerCase();

  // Allowlist check via service role (bypasses RLS).
  const admin = createSupabaseAdminClient();
  const { data: approved } = await admin
    .from('approved_emails')
    .select('email, role, client_id')
    .eq('email', email)
    .maybeSingle();

  if (!approved) {
    // Not on the allowlist. Sign them out, log the attempt, notify admin.
    await supabase.auth.signOut();

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    const ipHash = ip ? hashIp(ip) : null;
    const userAgent = request.headers.get('user-agent') || null;

    // Best-effort log; don't block the redirect on it.
    await admin
      .from('signup_requests')
      .insert({ email, ip_hash: ipHash, user_agent: userAgent })
      .then(() => null, (e) => console.error('[callback] log signup request failed', e));

    // Best-effort admin notification.
    try {
      await sendEmail({
        to: ADMIN_NOTIFY,
        subject: `[Meridian] New signup request: ${email}`,
        html: `
          <h2 style="margin:0 0 12px;font-family:system-ui">New signup request</h2>
          <p style="font-family:system-ui;font-size:14px">
            <strong>${escapeHtml(email)}</strong> tried to sign in but isn't on the allowlist.
          </p>
          <p style="font-family:system-ui;font-size:14px">
            Approve or reject in the admin console:
            <a href="https://www.meridian-digital-partners.com/admin/access">/admin/access</a>
          </p>
        `,
      });
    } catch (e) {
      console.error('[callback] notify admin failed', e);
    }

    return NextResponse.redirect(new URL('/pending-approval', url.origin));
  }

  // Approved. Make sure their public.users row exists with the right role + client_id.
  // Idempotent upsert keyed on auth user id.
  await admin
    .from('users')
    .upsert(
      { id: user.id, email, role: approved.role, client_id: approved.client_id },
      { onConflict: 'id' },
    );

  return NextResponse.redirect(new URL(next, url.origin));
}
