-- Phase 2.5 — Signup gating
-- Only emails on the approved_emails allowlist can complete login.
-- Anyone else gets bounced and logged to signup_requests for admin review.
--
-- Run this in Supabase SQL Editor.

-- ============================================================
-- 1. Tables
-- ============================================================

create table if not exists public.approved_emails (
  email text primary key,
  role text not null default 'client' check (role in ('admin', 'client')),
  client_id uuid references public.clients(id) on delete set null,
  business_name_hint text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.signup_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  ip_hash text,
  user_agent text,
  note text,
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists signup_requests_status_created_at_idx
  on public.signup_requests (status, created_at desc);

-- ============================================================
-- 2. Helper — is the email pre-approved?
-- ============================================================

create or replace function public.is_email_approved(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.approved_emails where email = lower(p_email))
$$;

-- ============================================================
-- 3. RLS
-- ============================================================

alter table public.approved_emails enable row level security;
alter table public.signup_requests enable row level security;

-- approved_emails: admins only (read/write)
drop policy if exists approved_emails_admin_all on public.approved_emails;
create policy approved_emails_admin_all on public.approved_emails
  for all using (public.is_admin()) with check (public.is_admin());

-- signup_requests: admins only
drop policy if exists signup_requests_admin_all on public.signup_requests;
create policy signup_requests_admin_all on public.signup_requests
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- 4. Seed: bootstrap your own admin email so you don't lock yourself out.
--    Idempotent — safe to re-run.
-- ============================================================

insert into public.approved_emails (email, role, business_name_hint, notes)
values
  ('jw@meridian-digital-partners.com', 'admin', 'Meridian Digital', 'bootstrap admin'),
  ('wandj@meridian-digital-partners.com', 'admin', 'Meridian Digital', 'bootstrap admin')
on conflict (email) do nothing;
