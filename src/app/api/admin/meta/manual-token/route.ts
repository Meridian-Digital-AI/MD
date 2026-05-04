// POST /api/admin/meta/manual-token — admin only.
// Accepts a manually-pasted Meta access token (typically a System User
// token from Joe's Business Manager) and stores it as the agency-level
// connection. Validates the token by calling /me before saving.
//
// This is the fallback path when the OAuth Connect flow is blocked
// (Advanced Access permissions gate, app review pending, etc.). System
// User tokens generated from a verified Business Manager bypass that
// gate because Joe's BM is already verified — our app just consumes
// the token.

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchMetaUser, fetchMetaAdAccounts } from '@/lib/meta/api';
import { upsertAgencyMetaConnection } from '@/lib/meta/connection';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let body: { token?: unknown; expiresInDays?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!token || token.length < 20) {
    return NextResponse.json(
      { error: 'invalid_token', message: 'Paste the full access token from Business Manager.' },
      { status: 400 },
    );
  }

  // Optional: caller can tell us how long the token lasts (System User
  // tokens default to "never expires", but Meta also offers 60-day variants).
  const expiresInDays =
    typeof body.expiresInDays === 'number' && body.expiresInDays > 0 && body.expiresInDays < 3650
      ? body.expiresInDays
      : null;

  // Validate the token by hitting /me. If this fails, the token is bad
  // and we return the Graph API error verbatim so the user can fix it.
  let me;
  try {
    me = await fetchMetaUser(token);
  } catch (err) {
    return NextResponse.json(
      {
        error: 'token_validation_failed',
        message: (err as Error).message || 'Meta rejected this token. Re-generate it in Business Manager.',
      },
      { status: 400 },
    );
  }

  // Bonus check: count how many ad accounts this token can see.
  // Helps confirm the System User has the right asset assignments.
  let adAccountCount = 0;
  try {
    const accounts = await fetchMetaAdAccounts(token);
    adAccountCount = accounts.length;
  } catch {
    // Non-fatal — the token is valid for /me but might not have ads_read
    // scope yet. We still save it; the picker page will surface the issue.
  }

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  await upsertAgencyMetaConnection({
    access_token: token,
    token_expires_at: expiresAt,
    external_user_id: me.id,
    external_user_name: me.name,
  });

  return NextResponse.json({
    ok: true,
    connectedAs: me.name,
    externalUserId: me.id,
    adAccountCount,
  });
}
