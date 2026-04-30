// GET /api/oauth/meta/start
//
// Admin-only. Builds the Meta OAuth URL and redirects the user there.
// State is a random nonce stored in a short-lived signed cookie that the
// callback verifies — guards against CSRF.

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMetaConfig, META_SCOPES } from '@/lib/meta/config';
import { randomBytes } from 'node:crypto';

export async function GET(request: Request) {
  const baseUrl = new URL(request.url).origin;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', baseUrl));
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const cfg = getMetaConfig();
  if (!cfg) {
    return NextResponse.json(
      { error: 'meta_not_configured', message: 'Set META_APP_ID, META_APP_SECRET, NEXT_PUBLIC_APP_URL in env.' },
      { status: 503 },
    );
  }

  const state = randomBytes(16).toString('hex');
  const authUrl = new URL('https://www.facebook.com/v23.0/dialog/oauth');
  authUrl.searchParams.set('client_id', cfg.appId);
  authUrl.searchParams.set('redirect_uri', cfg.redirectUri);
  authUrl.searchParams.set('scope', META_SCOPES);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('response_type', 'code');

  const res = NextResponse.redirect(authUrl);
  // 10-minute cookie holding the state — callback verifies it matches.
  res.cookies.set('meridian_meta_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return res;
}
