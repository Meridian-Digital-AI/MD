// CSV export of the current client's leads.
// Auth: must be logged in; the request is scoped via RLS to the user's client_id,
// so the `client_id` query param is just a sanity guard.

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users')
    .select('client_id, role')
    .eq('id', user.id)
    .single();

  const url = new URL(req.url);
  const requestedClientId = url.searchParams.get('client_id');
  // Admins can export any client's leads; clients can only export their own.
  const clientId = profile?.role === 'admin' && requestedClientId ? requestedClientId : profile?.client_id;
  if (!clientId) return NextResponse.json({ error: 'no_client' }, { status: 400 });

  const { data: leads, error } = await supabase
    .from('leads')
    .select('created_at, name, email, phone, source, source_page, utm_source, utm_medium, utm_campaign, status, message')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(10000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const headers = ['created_at', 'name', 'email', 'phone', 'source', 'source_page', 'utm_source', 'utm_medium', 'utm_campaign', 'status', 'message'];
  const rows = (leads ?? []).map((l) => headers.map((h) => csvCell((l as Record<string, unknown>)[h])));
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function csvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
