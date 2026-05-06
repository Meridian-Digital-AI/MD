// Server helper: load the current logged-in client (or admin's selected client)
// and enforce tier gating in one place.

import { redirect, notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { tierAllowsSection, type DashboardSection, type PackageTier } from './packageFeatures';

export interface DashboardContext {
  user: { id: string; email: string };
  role: 'admin' | 'client';
  client: {
    id: string;
    business_name: string;
    slug: string;
    package_tier: PackageTier;
    domain: string | null;
    website_status: 'live' | 'in_progress' | 'none';
  };
}

export async function getCurrentClient(opts?: { requireSection?: DashboardSection }): Promise<DashboardContext> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, role, client_id')
    .eq('id', user.id)
    .single();
  if (!profile) redirect('/login');
  if (profile.role === 'admin') redirect('/admin');
  if (!profile.client_id) redirect('/dashboard');

  const { data: client } = await supabase
    .from('clients')
    .select('id, business_name, slug, package_tier, domain, website_status')
    .eq('id', profile.client_id)
    .single();
  if (!client) redirect('/dashboard');

  const tier = client.package_tier as PackageTier;
  if (opts?.requireSection && !tierAllowsSection(tier, opts.requireSection)) {
    notFound();
  }

  // website_status defaults to 'live' in the DB; treat anything unrecognised as 'live'
  // so existing clients (and pre-migration rows) behave normally.
  const ws = (client.website_status ?? 'live') as 'live' | 'in_progress' | 'none';

  return {
    user: { id: user.id, email: profile.email },
    role: profile.role as 'admin' | 'client',
    client: { ...client, package_tier: tier, website_status: ws },
  };
}
