-- Phase 4.7 — Onboarding state + integration request queue.
--
-- Two tables:
--
-- 1. client_onboarding_state — one row per client. Tracks which checklist
--    items have been "dismissed" by the client (e.g. they've explicitly
--    skipped a step). Most checklist items are auto-derived from data
--    (has any pageviews? has any leads?), but a few are explicit.
--
-- 2. integration_requests — append-only log of "please install for me" /
--    "send instructions to my web person" requests submitted from the
--    onboarding checklist. Admin reviews these and acts on them.

create table if not exists public.client_onboarding_state (
  client_id uuid primary key references public.clients(id) on delete cascade,
  dismissed_steps text[] not null default '{}',  -- e.g. {'analytics_optional'}
  setup_completed_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.client_onboarding_state enable row level security;

drop policy if exists "onboarding admin all" on public.client_onboarding_state;
create policy "onboarding admin all" on public.client_onboarding_state
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "onboarding client read own" on public.client_onboarding_state;
create policy "onboarding client read own" on public.client_onboarding_state
  for select using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.client_id = client_onboarding_state.client_id)
  );

drop policy if exists "onboarding client update own" on public.client_onboarding_state;
create policy "onboarding client update own" on public.client_onboarding_state
  for update using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.client_id = client_onboarding_state.client_id)
  ) with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.client_id = client_onboarding_state.client_id)
  );

drop policy if exists "onboarding client insert own" on public.client_onboarding_state;
create policy "onboarding client insert own" on public.client_onboarding_state
  for insert with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.client_id = client_onboarding_state.client_id)
  );


create table if not exists public.integration_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  requested_by uuid references public.users(id),
  kind text not null
    check (kind in ('white_glove', 'send_to_web_person')),
  platform text,                                      -- 'wix' | 'squarespace' | 'wordpress' | 'webflow' | 'shopify' | 'other' | null
  -- White-glove fields
  access_method text,                                  -- 'add_user' | 'share_login' | 'screenshare'
  -- Send-to-web-person fields
  web_person_email text,
  web_person_name text,
  message text,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'done', 'cancelled')),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists integration_requests_open_idx
  on public.integration_requests (status, created_at desc)
  where status in ('open', 'in_progress');

alter table public.integration_requests enable row level security;

drop policy if exists "integration_requests admin all" on public.integration_requests;
create policy "integration_requests admin all" on public.integration_requests
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "integration_requests client insert own" on public.integration_requests;
create policy "integration_requests client insert own" on public.integration_requests
  for insert with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.client_id = integration_requests.client_id)
  );

drop policy if exists "integration_requests client read own" on public.integration_requests;
create policy "integration_requests client read own" on public.integration_requests
  for select using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.client_id = integration_requests.client_id)
  );

comment on table public.client_onboarding_state is
  'One row per client tracking onboarding progress; mostly derived but stores explicit dismissals.';
comment on table public.integration_requests is
  'Queue of install/help requests submitted from the dashboard onboarding checklist.';
