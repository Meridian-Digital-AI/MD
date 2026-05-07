// Google OAuth callback — exchanges the auth code for tokens, fetches the
// connected user's identity, and upserts the row in agency_integrations.
// On success redirects to /admin/settings?google_connected=1.

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { exchangeCodeForTokens, fetchGoogleUserInfo } from '@/lib/google/api';
import { upsertAgencyGoogleConnection } from '@/lib/google/connection';

function backTo(origin: string, qs: Record<string, string>): NextResponse {
  const url = new URL('/admin/settings', origin);
  for (const [k, v] of Object.entries(qs)) url.searchParams.set(k, v);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  if (errorParam) {
    return backTo(url.origin, { google_error: errorParam });
  }
  if (!code) {
    return backTo(url.origin, { google_error: 'missing_code' });
  }

  // CSRF check
  const cookieHeader = request.headers.get('cookie') || '';
  const stateCookie = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('google_oauth_state='))
    ?.split('=')[1];
  if (!state || !stateCookie || state !== stateCookie) {
    return backTo(url.origin, { google_error: 'state_mismatch' });
  }

  // Auth — only an admin should be able to land tokens. We re-check here
  // even though /start already gated, because the callback URL is
  // technically reachable directly.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return backTo(url.origin, { google_error: 'unauthorized' });
  }
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    return backTo(url.origin, { google_error: 'forbidden' });
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch (err) {
    console.error('[oauth/google/callback] exchange failed', err);
    return backTo(url.origin, { google_error: 'exchange_failed' });
  }

  let me;
  try {
    me = await fetchGoogleUserInfo(tokens.access_token);
  } catch (err) {
    console.error('[oauth/google/callback] userinfo failed', err);
    return backTo(url.origin, { google_error: 'userinfo_failed' });
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  try {
    await upsertAgencyGoogleConnection({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      token_expires_at: expiresAt,
      scope: tokens.scope ?? null,
      external_user_id: me.sub,
      external_user_name: me.name || me.email,
    });
  } catch (err) {
    console.error('[oauth/google/callback] upsert failed', err);
    return backTo(url.origin, { google_error: 'persist_failed' });
  }

  // Clear the state cookie.
  const response = backTo(url.origin, { google_connected: '1' });
  response.cookies.set('google_oauth_state', '', { path: '/', maxAge: 0 });
  return response;
}
