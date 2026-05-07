// Read/write the agency-level Google OAuth connection row.
//
// One row in agency_integrations with provider='google_oauth'. We use upsert
// so re-connecting just rolls the access_token + refresh_token forward.
//
// Token refresh is handled in api.ts (getValidAgencyAccessToken) — this file
// is just CRUD on the row.

import { createSupabaseAdminClient } from '@/lib/supabase/server';

export type AgencyGoogleConnection = {
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  scope: string | null;
  external_user_id: string | null;
  external_user_name: string | null;
  connected_at: string;
};

export async function getAgencyGoogleConnection(): Promise<AgencyGoogleConnection | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('agency_integrations')
    .select(
      'access_token, refresh_token, token_expires_at, scope, external_user_id, external_user_name, connected_at',
    )
    .eq('provider', 'google_oauth')
    .maybeSingle();
  if (error) {
    console.error('[google/connection] read failed', error);
    return null;
  }
  return (data as AgencyGoogleConnection) ?? null;
}

export async function upsertAgencyGoogleConnection(input: {
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  scope: string | null;
  external_user_id: string;
  external_user_name: string;
}): Promise<void> {
  const admin = createSupabaseAdminClient();
  // We deliberately don't overwrite refresh_token if the new one is null —
  // Google only returns refresh_token on the FIRST consent (or when the user
  // re-consents with prompt=consent). If a re-auth flow only gives us a new
  // access_token, the old refresh_token is still valid and we want to keep
  // it. So we read first and merge.
  if (input.refresh_token === null) {
    const existing = await getAgencyGoogleConnection();
    if (existing?.refresh_token) {
      input.refresh_token = existing.refresh_token;
    }
  }

  const { error } = await admin.from('agency_integrations').upsert(
    {
      provider: 'google_oauth',
      access_token: input.access_token,
      refresh_token: input.refresh_token,
      token_expires_at: input.token_expires_at,
      scope: input.scope,
      external_user_id: input.external_user_id,
      external_user_name: input.external_user_name,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'provider' },
  );
  if (error) throw new Error(`upsert agency_integrations failed: ${error.message}`);
}

export async function updateAgencyGoogleAccessToken(input: {
  access_token: string;
  token_expires_at: string;
}): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('agency_integrations')
    .update({
      access_token: input.access_token,
      token_expires_at: input.token_expires_at,
      updated_at: new Date().toISOString(),
    })
    .eq('provider', 'google_oauth');
  if (error) throw new Error(`update agency_integrations failed: ${error.message}`);
}

export async function deleteAgencyGoogleConnection(): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('agency_integrations')
    .delete()
    .eq('provider', 'google_oauth');
  if (error) throw new Error(`delete agency_integrations failed: ${error.message}`);
}
