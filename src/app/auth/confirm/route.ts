// Token-hash confirmation route used by admin-generated invite links.
//
// Why this exists separately from /auth/callback:
//   /auth/callback handles the PKCE code-exchange flow used by client-side
//   signInWithOtp from the /login page (uses ?code=... + a code_verifier
//   stashed in the user's browser cookies).
//
//   /auth/confirm handles the token-hash flow used by admin.auth.admin
//   .generateLink — there's no PKCE pair because the link was generated
//   server-side, so we use verifyOtp({ token_hash, type }) instead.
//
// Once verifyOtp succeeds, the SSR client writes the auth cookies on our
// own domain via the cookie helper, the user has a real session, and we
// redirect them to ?next=... (defaults to /dashboard).
//
// Allowlist + public.users upsert mirror /auth/callback so an unapproved
// email is signed back out and routed to /pending-approval.

import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from '@/lib/supabase/server';
import { sendEmail, escapeHtml } from '@/lib/email/resend';
import type { EmailOtpType } from '@supabase/supabase-js';

const ADMIN_NOTIFY =
  process.env.LEAD_ADMIN_NOTIFY_EMAIL || 'wandj@meridian-digital-partners.com';

const VALID_TYPES: EmailOtpType[] = [
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'signup',
  'email',
];

function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'meridian-default-salt';
  return crypto.createHash('sha256').update(salt + ':' + ip).digest('hex').slice(0, 32);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const next = url.searchParams.get('next') ?? '/dashboard';

  if (!token_hash || !type || !VALID_TYPES.includes(type)) {
    return NextResponse.redirect(new URL('/login?error=confirm_missing', url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (error) {
    console.error('[auth/confirm] verifyOtp failed', error);
    return NextResponse.redirect(
      new URL(`/login?error=confirm_${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  // Who just verified?
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.redirect(new URL('/login?error=confirm_no_user', url.origin));
  }
  const email = user.email.toLowerCase();

  // Allowlist check (mirrors /auth/callback exactly so behaviour is identical
  // whether the user came in via PKCE or token_hash).
  const admin = createSupabaseAdminClient();
  const { data: approved } = await admin
    .from('approved_emails')
    .select('email, role, client_id')
    .eq('email', email)
    .maybeSingle();

  if (!approved) {
    await supabase.auth.signOut();

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    const ipHash = ip ? hashIp(ip) : null;
    const userAgent = request.headers.get('user-agent') || null;

    await admin
      .from('signup_requests')
      .insert({ email, ip_hash: ipHash, user_agent: userAgent })
      .then(() => null, (e) => console.error('[auth/confirm] log signup request failed', e));

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
            Approve or reject:
            <a href="https://www.meridian-digital-partners.com/admin/access">/admin/access</a>
          </p>
        `,
      });
    } catch (e) {
      console.error('[auth/confirm] notify admin failed', e);
    }

    return NextResponse.redirect(new URL('/pending-approval', url.origin));
  }

  // Approved — make sure the public.users row exists with the right role + client_id.
  await admin
    .from('users')
    .upsert(
      { id: user.id, email, role: approved.role, client_id: approved.client_id },
      { onConflict: 'id' },
    );

  return NextResponse.redirect(new URL(next, url.origin));
}
