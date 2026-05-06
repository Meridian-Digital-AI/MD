-- Phase 4.8 — Website lifecycle state.
--
-- Some clients arrive without a website. Others have one but want us to
-- rebuild it. The dashboard's onboarding checklist branches on this:
--
--   none         → show "We'll build you one" path; suppress install nags.
--   in_progress  → show "Site in production — Joe's on it" banner; suppress nags.
--   live         → normal flow; show install paths if tracking isn't flowing yet.
--
-- Defaults to 'live' so existing clients are unaffected.

alter table public.clients
  add column if not exists website_status text not null default 'live'
    check (website_status in ('live', 'in_progress', 'none'));

comment on column public.clients.website_status is
  'live = client has a working site; in_progress = we are building it; none = they need a site built.';

-- Allow build_site as an integration_request kind.
alter table public.integration_requests
  drop constraint if exists integration_requests_kind_check;

alter table public.integration_requests
  add constraint integration_requests_kind_check
  check (kind in ('white_glove', 'send_to_web_person', 'build_site'));
