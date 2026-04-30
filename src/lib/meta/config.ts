// Meta Marketing API — env-gated config.
//
// Required env vars (server-side only):
//   META_APP_ID
//   META_APP_SECRET
//   NEXT_PUBLIC_APP_URL  (e.g. http://localhost:3003 in dev, https://meridian-digital.vercel.app in prod)
//
// The redirect URI is derived from NEXT_PUBLIC_APP_URL and must be added to
// the Meta App's Valid OAuth Redirect URIs list:
//   /api/oauth/meta/callback
//
// All routes that depend on Meta credentials should call assertConfigured()
// at the top so missing env vars fail loudly with a 503, not silently.

export const META_API_VERSION = 'v23.0';
export const META_GRAPH = `https://graph.facebook.com/${META_API_VERSION}`;

export const META_SCOPES = [
  'ads_read',
  'ads_management',
  'business_management',
  'read_insights',
].join(',');

export type MetaConfig = {
  appId: string;
  appSecret: string;
  redirectUri: string;
};

export function getMetaConfig(): MetaConfig | null {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appId || !appSecret || !baseUrl) return null;
  return {
    appId,
    appSecret,
    redirectUri: `${baseUrl.replace(/\/$/, '')}/api/oauth/meta/callback`,
  };
}

export function isMetaConfigured(): boolean {
  return getMetaConfig() !== null;
}
