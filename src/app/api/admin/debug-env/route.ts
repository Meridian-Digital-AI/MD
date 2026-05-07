// Temporary diagnostic endpoint — reports presence/length of each Google
// OAuth env var WITHOUT leaking values. Admin-gated. Remove once GA4 OAuth
// is verified working.

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const id = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
  const secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
  const redirect = process.env.GOOGLE_OAUTH_REDIRECT_URI || '';
  return NextResponse.json({
    GOOGLE_OAUTH_CLIENT_ID: { present: !!id, length: id.length, suffix: id.slice(-15) },
    GOOGLE_OAUTH_CLIENT_SECRET: { present: !!secret, length: secret.length, prefix: secret.slice(0, 7) },
    GOOGLE_OAUTH_REDIRECT_URI: { present: !!redirect, length: redirect.length, value: redirect },
    META_APP_ID_present: !!process.env.META_APP_ID,
    NEXT_PUBLIC_APP_URL_present: !!process.env.NEXT_PUBLIC_APP_URL,
  });
}
