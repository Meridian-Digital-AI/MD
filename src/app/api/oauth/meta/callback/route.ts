// GET /api/oauth/meta/callback?code=...&state=...
//
// Exchanges the auth code for a short-lived user token, then exchanges THAT
// for a long-lived (~60-day) token. Stores both the token and the FB user
// info on the agency_integrations row.

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMetaConfig, META_GRAPH } from '@/lib/meta/config';
import { fetchMetaUser } from '@/lib/meta/api';
import { upsertAgencyMetaConnection } from '@/lib/meta/connection';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  const baseUrl = url.origin;
  const settingsUrl = new URL('/admin/settings', baseUrl);

  if (errorParam) {
    settingsUrl.searchParams.set('meta_error', errorParam);
    return NextResponse.redirect(settingsUrl);
  }
  if (!code || !state) {
    settingsUrl.searchParams.set('meta_error', 'missing_code');
    return NextResponse.redirect(settingsUrl);
  }

  // Admin gate.
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', baseUrl));
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // CSRF: verify state matches the cookie set by /start.
  const cookieState = request.headers.get('cookie')?.split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('meridian_meta_oauth_state='))
    ?.split('=')[1];
  if (!cookieState || cookieState !== state) {
    settingsUrl.searchParams.set('meta_error', 'state_mismatch');
    return NextResponse.redirect(settingsUrl);
  }

  const cfg = getMetaConfig();
  if (!cfg) {
    settingsUrl.searchParams.set('meta_error', 'not_configured');
    return NextResponse.redirect(settingsUrl);
  }

  try {
    // Step 1: code -> short-lived token.
    const shortRes = await fetch(
      `${META_GRAPH}/oauth/access_token?` +
        new URLSearchParams({
          client_id: cfg.appId,
          client_secret: cfg.appSecret,
          redirect_uri: cfg.redirectUri,
          code,
        }),
    );
    const shortJson = await shortRes.json();
    if (!shortRes.ok || !shortJson.access_token) {
      throw new Error(shortJson?.error?.message || 'short_token_exchange_failed');
    }
    const shortToken = shortJson.access_token as string;

    // Step 2: short-lived -> long-lived (~60d).
    const longRes = await fetch(
      `${META_GRAPH}/oauth/access_token?` +
        new URLSearchParams({
          grant_type: 'fb_exchange_token',
          client_id: cfg.appId,
          client_secret: cfg.appSecret,
          fb_exchange_token: shortToken,
        }),
    );
    const longJson = await longRes.json();
    if (!longRes.ok || !longJson.access_token) {
      throw new Error(longJson?.error?.message || 'long_token_exchange_failed');
    }
    const longToken = longJson.access_token as string;
    const expiresIn = Number(longJson.expires_in) || 60 * 24 * 60 * 60;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Step 3: who is this token for? (display name on the settings page)
    const me = await fetchMetaUser(longToken);

    // Step 4: persist.
    await upsertAgencyMetaConnection({
      access_token: longToken,
      token_expires_at: expiresAt,
      external_user_id: me.id,
      external_user_name: me.name,
    });

    settingsUrl.searchParams.set('meta_connected', '1');
    const res = NextResponse.redirect(settingsUrl);
    // Clear the OAuth-state cookie.
    res.cookies.set('meridian_meta_oauth_state', '', { path: '/', maxAge: 0 });
    return res;
  } catch (err) {
    console.error('[meta/callback]', err);
    settingsUrl.searchParams.set('meta_error', (err as Error).message || 'oauth_failed');
    return NextResponse.redirect(settingsUrl);
  }
}
