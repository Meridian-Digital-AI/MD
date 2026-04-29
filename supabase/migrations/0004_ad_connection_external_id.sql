-- Add a place to store the platform's canonical account ID on each
-- ad_connections row. We need this to query the platform APIs against the
-- right sub-account when running the agency-managed model (clients linked
-- to our Google Ads MCC, our Meta Business Manager, etc.).
--
-- Examples of what goes in this column:
--   google_ads   →  10-digit customer ID, no dashes (e.g. "7687321878")
--   meta         →  ad-account ID with prefix      (e.g. "act_1234567890")
--   ga4          →  9-digit property ID            (e.g. "498712345")
--
-- Kept text rather than int because the formats vary across providers and
-- some include prefixes. Validation happens in app code.

alter table public.ad_connections
  add column if not exists external_account_id text;

comment on column public.ad_connections.external_account_id is
  'Platform-specific canonical account ID used to query the provider API.';
