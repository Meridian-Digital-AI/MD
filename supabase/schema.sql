-- Meridian Digital — Client Dashboard schema
-- Run this once in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE.

-- ============================================================
-- 1. Tables
-- ============================================================

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  slug text unique not null,
  package_tier text not null check (package_tier in ('get-started', 'grow', 'full-partner', 'website-only')),
  domain text,
  ga4_property_id text,
  meta_ad_account_id text,
  google_ads_customer_id text,
  health_score int check (health_score between 1 and 10),
  health_score_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  client_id uuid references public.clients(id) on delete set null,
  role text not null default 'client' check (role in ('admin', 'client')),
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text,
  email text,
  phone text,
  message text,
  source text,            -- 'contact-form' | 'email-popup' | 'manual' | etc.
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'won', 'lost')),
  created_at timestamptz not null default now()
);

create table if not exists public.pageviews (
  id bigserial primary key,
  client_id uuid not null references public.clients(id) on delete cascade,
  path text not null,
  referrer text,
  country text,
  user_agent text,
  ts timestamptz not null default now()
);

create table if not exists public.ad_connections (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  provider text not null check (provider in ('ga4', 'meta', 'google_ads')),
  access_token_encrypted text,
  refresh_token_encrypted text,
  account_label text,             -- e.g. "Acme Ltd Meta Ads"
  status text not null default 'pending' check (status in ('pending', 'connected', 'expired', 'revoked')),
  connected_at timestamptz,
  unique (client_id, provider)
);

-- Indexes
create index if not exists leads_client_id_created_at_idx on public.leads (client_id, created_at desc);
create index if not exists pageviews_client_id_ts_idx on public.pageviews (client_id, ts desc);

-- ============================================================
-- 2. Helper: is_admin()
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- 3. Row-Level Security policies
-- ============================================================

alter table public.clients         enable row level security;
alter table public.users           enable row level security;
alter table public.leads           enable row level security;
alter table public.pageviews       enable row level security;
alter table public.ad_connections  enable row level security;

-- CLIENTS table
drop policy if exists "clients select own"  on public.clients;
drop policy if exists "clients select admin" on public.clients;
drop policy if exists "clients write admin" on public.clients;

create policy "clients select own" on public.clients for select
  using (id = (select client_id from public.users where id = auth.uid()));

create policy "clients select admin" on public.clients for select
  using (public.is_admin());

create policy "clients write admin" on public.clients for all
  using (public.is_admin())
  with check (public.is_admin());

-- USERS table — a user can read their own row; admin can read everything
drop policy if exists "users select self"  on public.users;
drop policy if exists "users select admin" on public.users;
drop policy if exists "users write admin"  on public.users;

create policy "users select self" on public.users for select
  using (id = auth.uid());

create policy "users select admin" on public.users for select
  using (public.is_admin());

create policy "users write admin" on public.users for all
  using (public.is_admin())
  with check (public.is_admin());

-- LEADS table
drop policy if exists "leads select own"   on public.leads;
drop policy if exists "leads select admin" on public.leads;
drop policy if exists "leads write own"    on public.leads;
drop policy if exists "leads write admin"  on public.leads;

create policy "leads select own" on public.leads for select
  using (client_id = (select client_id from public.users where id = auth.uid()));

create policy "leads select admin" on public.leads for select
  using (public.is_admin());

create policy "leads write own" on public.leads for update
  using (client_id = (select client_id from public.users where id = auth.uid()));

create policy "leads write admin" on public.leads for all
  using (public.is_admin())
  with check (public.is_admin());

-- PAGEVIEWS table — read-only for clients, server-role inserts via API
drop policy if exists "pageviews select own"   on public.pageviews;
drop policy if exists "pageviews select admin" on public.pageviews;

create policy "pageviews select own" on public.pageviews for select
  using (client_id = (select client_id from public.users where id = auth.uid()));

create policy "pageviews select admin" on public.pageviews for select
  using (public.is_admin());

-- AD_CONNECTIONS table
drop policy if exists "ad_conn select own"   on public.ad_connections;
drop policy if exists "ad_conn select admin" on public.ad_connections;
drop policy if exists "ad_conn write admin"  on public.ad_connections;

create policy "ad_conn select own" on public.ad_connections for select
  using (client_id = (select client_id from public.users where id = auth.uid()));

create policy "ad_conn select admin" on public.ad_connections for select
  using (public.is_admin());

create policy "ad_conn write admin" on public.ad_connections for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 4. Trigger: auto-create users row on auth signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'client')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 5. Seed sample data (delete after first real client)
-- ============================================================

insert into public.clients (business_name, slug, package_tier, domain, health_score)
values
  ('Oriental City', 'oriental-city', 'full-partner', 'orientalcityexeter.com', 8),
  ('Parkside Garage', 'parkside-garage', 'full-partner', 'parkside-garage.example.com', 7)
on conflict (slug) do nothing;
