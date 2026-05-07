// Admin-only — starts the Google OAuth dance for the agency-level
// connection. Redirects the admin to Google's consent screen with the
// scopes we need (analytics.readonly + userinfo). On success Google
// bounces them to /api/oauth/google/callback.

import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  GOOGLE_AUTH_ENDPOINT,
  GOOGLE_SCOPES,
  getGoogleConfig,
} from '@/lib/google/config';

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const cfg = getGoogleConfig();
  if (!cfg) {
    return NextResponse.json(
      {
        error: 'google_not_configured',
        message: 'Set GOOGLE_OAUTH_CLIENT_ID / _SECRET / _REDIRECT_URI in env.',
      },
      { status: 503 },
    );
  }

  // CSRF protection — generate a state token, set as an httpOnly cookie, and
  // verify on callback.
  const state = crypto.randomBytes(24).toString('hex');

  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    // offline + prompt=consent → guarantees we get a refresh_token even if
    // the user has previously authorised the app.
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });

  const url = new URL(request.url);
  const response = NextResponse.redirect(`${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`);
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10 min
  });
  return response;
}
