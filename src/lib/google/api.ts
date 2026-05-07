// Google API helpers — token exchange, refresh, and GA4 Data API queries.
//
// All calls are server-side. Per-client property targeting comes from
// clients.ga4_property_id; the access token is the agency-level one stored
// in agency_integrations.

import {
  GA4_DATA_API,
  GOOGLE_TOKEN_ENDPOINT,
  GOOGLE_USERINFO_ENDPOINT,
  assertGoogleConfigured,
} from './config';
import {
  getAgencyGoogleConnection,
  updateAgencyGoogleAccessToken,
} from './connection';

// ---------- Token exchange ----------

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;          // seconds
  scope?: string;
  token_type: string;          // "Bearer"
  id_token?: string;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const cfg = assertGoogleConfigured();
  const params = new URLSearchParams({
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
    grant_type: 'authorization_code',
  });
  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`exchangeCodeForTokens failed (${res.status}): ${text}`);
  }
  return (await res.json()) as TokenResponse;
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const cfg = assertGoogleConfigured();
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`refreshAccessToken failed (${res.status}): ${text}`);
  }
  return (await res.json()) as TokenResponse;
}

export interface GoogleUserInfo {
  sub: string;        // Google user ID
  email: string;
  name?: string;
  picture?: string;
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fetchGoogleUserInfo failed (${res.status}): ${text}`);
  }
  return (await res.json()) as GoogleUserInfo;
}

// ---------- Valid-token resolver ----------

// Returns a non-expired access token for the agency Google connection.
// Refreshes via refresh_token if the stored one is within 60s of expiry.
// Returns null if the agency hasn't connected yet.
export async function getValidAgencyAccessToken(): Promise<string | null> {
  const conn = await getAgencyGoogleConnection();
  if (!conn) return null;

  const now = Date.now();
  const expiresAt = conn.token_expires_at
    ? new Date(conn.token_expires_at).getTime()
    : 0;

  // 60s buffer — avoid races where the token expires mid-flight.
  if (expiresAt - now > 60_000 && conn.access_token) {
    return conn.access_token;
  }

  if (!conn.refresh_token) {
    console.warn('[google/api] token expired but no refresh_token on record');
    return null;
  }

  const fresh = await refreshAccessToken(conn.refresh_token);
  const newExpiresAt = new Date(now + fresh.expires_in * 1000).toISOString();
  await updateAgencyGoogleAccessToken({
    access_token: fresh.access_token,
    token_expires_at: newExpiresAt,
  });
  return fresh.access_token;
}

// ---------- GA4 Data API ----------

export interface GA4Headline {
  sessions: number;
  totalUsers: number;
  conversions: number;
  // 0..1 — proportion of sessions that contained a conversion event.
  conversionRate: number | null;
}

export interface GA4SourceRow {
  source: string;
  sessions: number;
  conversions: number;
}

interface RunReportResponse {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
  rowCount?: number;
}

async function runReport(
  accessToken: string,
  propertyId: string,
  body: Record<string, unknown>,
): Promise<RunReportResponse> {
  const res = await fetch(`${GA4_DATA_API}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 runReport failed (${res.status}): ${text}`);
  }
  return (await res.json()) as RunReportResponse;
}

function num(v: string | undefined): number {
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function fetchGa4Headline(
  accessToken: string,
  propertyId: string,
  daysBack = 30,
): Promise<GA4Headline> {
  const data = await runReport(accessToken, propertyId, {
    dateRanges: [{ startDate: `${daysBack}daysAgo`, endDate: 'today' }],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'conversions' },
    ],
  });

  const row = data.rows?.[0];
  const sessions = num(row?.metricValues?.[0]?.value);
  const totalUsers = num(row?.metricValues?.[1]?.value);
  const conversions = num(row?.metricValues?.[2]?.value);
  const conversionRate = sessions > 0 ? conversions / sessions : null;

  return { sessions, totalUsers, conversions, conversionRate };
}

export async function fetchGa4TopSources(
  accessToken: string,
  propertyId: string,
  daysBack = 30,
  limit = 5,
): Promise<GA4SourceRow[]> {
  const data = await runReport(accessToken, propertyId, {
    dateRanges: [{ startDate: `${daysBack}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'sessionSource' }],
    metrics: [{ name: 'sessions' }, { name: 'conversions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit,
  });

  return (data.rows ?? []).map((r) => ({
    source: r.dimensionValues?.[0]?.value || '(direct)',
    sessions: num(r.metricValues?.[0]?.value),
    conversions: num(r.metricValues?.[1]?.value),
  }));
}
