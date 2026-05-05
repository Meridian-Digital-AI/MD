-- Phase 4.6 — Manual Meta numbers per client per month.
--
-- Replaces the (currently blocked) live Meta API integration. Until we
-- complete Meta's Tech Provider verification, the cleanest way to get
-- ad-spend / impressions / clicks into the dashboard, PDF and emailed
-- monthly report is to type them in once a month from Joe / the client's
-- Ads Manager screenshot.
--
-- One row per (client, year_month). If a row exists, every surface uses
-- it as the source of truth. If absent, the corresponding cards just
-- show "—" / "Not entered". When we eventually re-enable the API path,
-- this table becomes a manual override that wins over fetched data.

create table if not exists public.client_meta_monthly (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  year_month text not null,                 -- 'YYYY-MM'
  spend numeric(12, 2),                     -- £ — null means "not entered"
  impressions integer,
  clicks integer,
  notes text,                                -- internal-only, not shown to client
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  unique (client_id, year_month)
);

create index if not exists client_meta_monthly_client_month_idx
  on public.client_meta_monthly (client_id, year_month);

alter table public.client_meta_monthly
  drop constraint if exists client_meta_monthly_year_month_format;
alter table public.client_meta_monthly
  add constraint client_meta_monthly_year_month_format
  check (year_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');

-- Sanity bounds: no negative spend / counts.
alter table public.client_meta_monthly
  drop constraint if exists client_meta_monthly_non_negative;
alter table public.client_meta_monthly
  add constraint client_meta_monthly_non_negative
  check (
    (spend is null or spend >= 0)
    and (impressions is null or impressions >= 0)
    and (clicks is null or clicks >= 0)
  );

alter table public.client_meta_monthly enable row level security;

drop policy if exists "client_meta_monthly admin all" on public.client_meta_monthly;
create policy "client_meta_monthly admin all" on public.client_meta_monthly
  for all using (public.is_admin()) with check (public.is_admin());

-- Clients can read their own (we surface spend/impressions/clicks on
-- their dashboard; notes are admin-only and we never select that column
-- in the client-side query).
drop policy if exists "client_meta_monthly client read own" on public.client_meta_monthly;
create policy "client_meta_monthly client read own" on public.client_meta_monthly
  for select using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.client_id = client_meta_monthly.client_id
    )
  );

comment on table public.client_meta_monthly is
  'Per-client per-month Meta Ads totals entered manually by admin. '
  'Source of truth while live Meta API integration is gated by Tech Provider verification.';
