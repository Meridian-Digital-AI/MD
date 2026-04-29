// Pulls the raw signals out of Supabase and computes a health score for one
// client. Used by the admin home (over multiple clients in parallel) and the
// admin client detail page.

import type { SupabaseClient } from '@supabase/supabase-js';
import { computeHealthScore, type HealthBreakdown } from './healthScore';

export async function computeClientHealth(
  supabase: SupabaseClient,
  client: { id: string; created_at: string },
): Promise<HealthBreakdown> {
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: leads30 },
    { count: leadsPrior },
    { count: pv30 },
    { data: lastLead },
    { data: lastPageview },
    { data: connectedAds },
  ] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true })
      .eq('client_id', client.id).gte('created_at', since30),
    supabase.from('leads').select('id', { count: 'exact', head: true })
      .eq('client_id', client.id).gte('created_at', since60).lt('created_at', since30),
    supabase.from('pageviews').select('id', { count: 'exact', head: true })
      .eq('client_id', client.id).gte('ts', since30),
    supabase.from('leads').select('created_at')
      .eq('client_id', client.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('pageviews').select('ts')
      .eq('client_id', client.id).order('ts', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('ad_connections').select('id')
      .eq('client_id', client.id).eq('status', 'connected').limit(1),
  ]);

  return computeHealthScore({
    clientCreatedAt: client.created_at,
    leadsLast30d: leads30 ?? 0,
    leadsPrior30d: leadsPrior ?? 0,
    pageviewsLast30d: pv30 ?? 0,
    lastLeadAt: lastLead?.created_at ?? null,
    lastPageviewAt: lastPageview?.ts ?? null,
    hasConnectedIntegration: (connectedAds ?? []).length > 0,
  }, now);
}
