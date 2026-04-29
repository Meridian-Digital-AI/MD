// Google Ads API client — read-only side, used by the client dashboard to
// surface campaign performance. Same OAuth credentials as the internal Flask
// Ads Builder; the Builder writes campaigns, this file reads.
//
// Auth model: agency-managed. We hold the developer token + OAuth refresh
// token; each client account is queried via its own customer_id, scoped
// through our MCC (login_customer_id). No per-client tokens needed.

import { GoogleAdsApi } from 'google-ads-api';

// ────────────────────────────────────────────────────────────────────────
// Shared client (lazy-initialised, reused across requests)
// ────────────────────────────────────────────────────────────────────────

let _client: GoogleAdsApi | null = null;

function getClient(): GoogleAdsApi {
  if (_client) return _client;

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

  if (!clientId || !clientSecret || !developerToken) {
    throw new Error(
      'Google Ads API not configured. Missing one of: GOOGLE_ADS_CLIENT_ID, ' +
        'GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_DEVELOPER_TOKEN.',
    );
  }

  _client = new GoogleAdsApi({
    client_id: clientId,
    client_secret: clientSecret,
    developer_token: developerToken,
  });
  return _client;
}

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

function stripDashes(id: string): string {
  return id.replace(/-/g, '');
}

function friendlyChannel(value: unknown): string {
  const map: Record<string, string> = {
    SEARCH: 'Search',
    DISPLAY: 'Display',
    SHOPPING: 'Shopping',
    VIDEO: 'Video',
    PERFORMANCE_MAX: 'Performance Max',
    LOCAL: 'Local',
    DISCOVERY: 'Discovery',
    DEMAND_GEN: 'Demand Gen',
    SMART: 'Smart',
  };
  const key = String(value ?? '').toUpperCase();
  return map[key] ?? key.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

function friendlyStatus(value: unknown): string {
  const map: Record<string, string> = {
    ENABLED: 'Active',
    PAUSED: 'Paused',
    REMOVED: 'Removed',
    UNKNOWN: 'Unknown',
  };
  const key = String(value ?? '').toUpperCase();
  return map[key] ?? key;
}

// ────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────

export interface CampaignSummary {
  id: string;
  name: string;
  status: string;
  channelType: string;
  dailyBudgetGbp: number;
  impressions: number;
  clicks: number;
  costGbp: number;
  ctr: number; // fraction; 0.0345 = 3.45%
  conversions: number;
}

/**
 * Fetch campaign performance for a single Google Ads account, last 7 days.
 *
 * @param customerId 10-digit Google Ads customer ID (with or without dashes)
 * @returns one row per campaign with activity in the window (excludes REMOVED)
 */
export async function getCampaigns(customerId: string): Promise<CampaignSummary[]> {
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;

  if (!loginCustomerId || !refreshToken) {
    throw new Error(
      'Google Ads API not configured. Missing one of: ' +
        'GOOGLE_ADS_LOGIN_CUSTOMER_ID, GOOGLE_ADS_REFRESH_TOKEN.',
    );
  }

  const client = getClient();
  const customer = client.Customer({
    customer_id: stripDashes(customerId),
    login_customer_id: stripDashes(loginCustomerId),
    refresh_token: refreshToken,
  });

  // GAQL — Google Ads' SQL-like query language. LAST_7_DAYS aggregates
  // metrics across the full window per campaign.
  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign_budget.amount_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.ctr,
      metrics.conversions
    FROM campaign
    WHERE segments.date DURING LAST_7_DAYS
      AND campaign.status != 'REMOVED'
    ORDER BY campaign.name
  `);

  // The google-ads-api row type is dynamic per-query; cast to a permissive
  // shape that matches the SELECT above.
  type Row = {
    campaign?: { id?: number | string; name?: string; status?: string | number; advertising_channel_type?: string | number };
    campaign_budget?: { amount_micros?: number | string };
    metrics?: { impressions?: number | string; clicks?: number | string; cost_micros?: number | string; ctr?: number | string; conversions?: number | string };
  };
  return (rows as Row[]).map((row) => ({
    id: String(row.campaign?.id ?? ''),
    name: String(row.campaign?.name ?? ''),
    status: friendlyStatus(row.campaign?.status),
    channelType: friendlyChannel(row.campaign?.advertising_channel_type),
    dailyBudgetGbp: Number(row.campaign_budget?.amount_micros ?? 0) / 1_000_000,
    impressions: Number(row.metrics?.impressions ?? 0),
    clicks: Number(row.metrics?.clicks ?? 0),
    costGbp: Number(row.metrics?.cost_micros ?? 0) / 1_000_000,
    ctr: Number(row.metrics?.ctr ?? 0),
    conversions: Number(row.metrics?.conversions ?? 0),
  }));
}
