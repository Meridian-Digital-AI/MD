// Read/write the agency-level Meta connection row.
//
// Single row per provider. We use upsert so re-connecting just rolls the
// token forward.

import { createSupabaseAdminClient } from '@/lib/supabase/server';

export type AgencyMetaConnection = {
  access_token: string;
  token_expires_at: string | null;
  external_user_id: string | null;
  external_user_name: string | null;
  connected_at: string;
};

export async function getAgencyMetaConnection(): Promise<AgencyMetaConnection | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('agency_integrations')
    .select('access_token, token_expires_at, external_user_id, external_user_name, connected_at')
    .eq('provider', 'meta')
    .maybeSingle();
  if (error) {
    console.error('[meta/connection] read failed', error);
    return null;
  }
  return (data as AgencyMetaConnection) ?? null;
}

export async function upsertAgencyMetaConnection(input: {
  access_token: string;
  token_expires_at: string | null;
  external_user_id: string;
  external_user_name: string;
}): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('agency_integrations').upsert(
    {
      provider: 'meta',
      access_token: input.access_token,
      token_expires_at: input.token_expires_at,
      external_user_id: input.external_user_id,
      external_user_name: input.external_user_name,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'provider' },
  );
  if (error) throw new Error(`upsert agency_integrations failed: ${error.message}`);
}

export async function deleteAgencyMetaConnection(): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('agency_integrations').delete().eq('provider', 'meta');
  if (error) throw new Error(`delete agency_integrations failed: ${error.message}`);
}
