// Google OAuth + Analytics Data API — env-gated config.
//
// Required env vars (server-side only):
//   GOOGLE_OAUTH_CLIENT_ID
//   GOOGLE_OAUTH_CLIENT_SECRET
//   GOOGLE_OAUTH_REDIRECT_URI   (e.g. https://www.meridian-digital-partners.com/api/oauth/google/callback)
//
// The redirect URI must match exactly what's listed in the Google Cloud
// OAuth client's "Authorized redirect URIs" — a trailing slash mismatch
// is enough to break the callback.
//
// All routes that depend on Google credentials should call assertConfigured()
// (or check isGoogleConfigured()) at the top so missing env vars fail loudly
// with a 503 rather than crashing mid-request.

// We use the readonly Analytics scope plus the standard offline scopes.
// `access_type=offline` + `prompt=consent` is what makes Google return a
// refresh_token alongside the access_token — without that, we'd have to
// bounce the user through OAuth every hour when the access token expires.
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'openid',
  'email',
  'profile',
].join(' ');

export const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
export const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';
export const GA4_DATA_API = 'https://analyticsdata.googleapis.com/v1beta';

export type GoogleConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export function getGoogleConfig(): GoogleConfig | null {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

export function isGoogleConfigured(): boolean {
  return getGoogleConfig() !== null;
}

export function assertGoogleConfigured(): GoogleConfig {
  const cfg = getGoogleConfig();
  if (!cfg) {
    throw new Error(
      'google_not_configured: missing GOOGLE_OAUTH_CLIENT_ID / _SECRET / _REDIRECT_URI',
    );
  }
  return cfg;
}
