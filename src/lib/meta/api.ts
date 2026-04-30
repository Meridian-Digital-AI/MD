// Thin wrapper around the Meta Graph / Marketing API.
//
// We only use the agency-level token here (read from agency_integrations).
// Every call appends ?access_token=... — Meta accepts it on either query
// string or Authorization header; query string is simpler.

import { META_GRAPH } from './config';

export type MetaUser = { id: string; name: string };

export type MetaAdAccount = {
  id: string;            // includes "act_" prefix
  account_id: string;    // bare numeric id
  name: string;
  currency: string;
  account_status: number; // 1 = active, 2 = disabled, etc.
};

export type MetaInsights = {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  date_start: string;
  date_stop: string;
};

async function metaGet<T>(path: string, accessToken: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${META_GRAPH}${path}`);
  url.searchParams.set('access_token', accessToken);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { cache: 'no-store' });
  const json = await res.json();
  if (!res.ok || json.error) {
    const msg = json?.error?.message || `Meta API ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}

export async function fetchMetaUser(accessToken: string): Promise<MetaUser> {
  return metaGet<MetaUser>('/me', accessToken, { fields: 'id,name' });
}

export async function fetchMetaAdAccounts(accessToken: string): Promise<MetaAdAccount[]> {
  const json = await metaGet<{ data: MetaAdAccount[] }>('/me/adaccounts', accessToken, {
    fields: 'id,account_id,name,currency,account_status',
    limit: '100',
  });
  return json.data ?? [];
}

export async function fetchMetaInsights(
  accessToken: string,
  adAccountId: string,
  datePreset: 'last_30d' | 'last_7d' | 'today' = 'last_30d',
): Promise<MetaInsights | null> {
  // adAccountId may or may not include the "act_" prefix; normalise.
  const id = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  const json = await metaGet<{ data: Array<Record<string, string>> }>(`/${id}/insights`, accessToken, {
    fields: 'spend,impressions,clicks,actions,date_start,date_stop',
    date_preset: datePreset,
    level: 'account',
  });
  const row = json.data?.[0];
  if (!row) return null;
  // `actions` is an array of {action_type, value}. Sum the conversion-like ones.
  let conversions = 0;
  const actions = (row as unknown as { actions?: Array<{ action_type: string; value: string }> }).actions;
  if (Array.isArray(actions)) {
    for (const a of actions) {
      if (a.action_type === 'lead' || a.action_type === 'purchase' || a.action_type === 'complete_registration') {
        conversions += Number(a.value) || 0;
      }
    }
  }
  return {
    spend: Number(row.spend) || 0,
    impressions: Number(row.impressions) || 0,
    clicks: Number(row.clicks) || 0,
    conversions,
    date_start: row.date_start,
    date_stop: row.date_stop,
  };
}
