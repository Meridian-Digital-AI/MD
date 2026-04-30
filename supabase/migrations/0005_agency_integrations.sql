-- Phase 4 — Agency-level OAuth connections.
--
-- Joe (the agency operator) authenticates ONCE with each platform (Meta,
-- Google Ads, Google OAuth for GA4). The resulting long-lived token unlocks
-- every ad account / property his account has access to. Clients are then
-- linked per-platform via existing columns on `clients`:
--   clients.meta_ad_account_id      → which ad account each client maps to
--   clients.google_ads_customer_id  → same for Google Ads
--   clients.ga4_property_id         → same for GA4
--
-- This is the standard agency model — single auth, many clients.

create table if not exists public.agency_integrations (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('meta', 'google_ads', 'google_oauth')),
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  scope text,
  external_user_id text,    -- e.g. FB user ID, Google user sub
  external_user_name text,  -- display name for UI ("Connected as Joe Smith")
  meta jsonb,               -- extra provider-specific blob (e.g. business id)
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider)
);

alter table public.agency_integrations enable row level security;

-- Only admins can read/write agency-level connections. Clients should never
-- see these rows — they're cross-tenant credentials owned by the agency.
drop policy if exists "agency_integrations admin all" on public.agency_integrations;
create policy "agency_integrations admin all" on public.agency_integrations
  for all using (public.is_admin()) with check (public.is_admin());

comment on table public.agency_integrations is
  'Agency-level OAuth tokens (one per provider). Joe authenticates once; '
  'every client''s ad account is reached via this single token plus the '
  'per-client account ID stored on the clients row.';
