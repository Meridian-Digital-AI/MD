-- Phase 2 — Lead capture
-- Run in Supabase SQL Editor after the base schema is in place.
-- Safe to re-run.

-- ============================================================
-- 1. Per-client API key (used by the lead-capture endpoint)
-- ============================================================

alter table public.clients
  add column if not exists api_key uuid not null default gen_random_uuid();

alter table public.clients
  add constraint clients_api_key_unique unique (api_key);

-- Backfill any existing rows that somehow ended up null (shouldn't happen, defensive)
update public.clients set api_key = gen_random_uuid() where api_key is null;

-- ============================================================
-- 2. Richer lead metadata
-- ============================================================

alter table public.leads
  add column if not exists source_page text,
  add column if not exists referrer text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term text,
  add column if not exists utm_content text,
  add column if not exists notes text,
  add column if not exists ip_hash text;          -- SHA256 of IP for basic dedupe, never raw IP

-- ============================================================
-- 3. Notification log (so we don't double-send)
-- ============================================================

create table if not exists public.lead_notifications (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel text not null check (channel in ('client_email', 'admin_email')),
  recipient text not null,
  resend_id text,
  sent_at timestamptz not null default now(),
  unique (lead_id, channel)
);

alter table public.lead_notifications enable row level security;

drop policy if exists "lead_notif select admin" on public.lead_notifications;
create policy "lead_notif select admin" on public.lead_notifications for select
  using (public.is_admin());

-- Clients see their own notifications (via the lead they own)
drop policy if exists "lead_notif select own" on public.lead_notifications;
create policy "lead_notif select own" on public.lead_notifications for select
  using (
    exists (
      select 1 from public.leads l
      join public.users u on u.id = auth.uid()
      where l.id = lead_id and l.client_id = u.client_id
    )
  );

-- ============================================================
-- 4. RPC: insert_lead_with_api_key
-- The lead-capture API calls this with the client's api_key. SECURITY DEFINER
-- means the function bypasses RLS *only for this call* — so the public
-- endpoint can write a lead without exposing the service-role key in code paths
-- that don't need it.
-- ============================================================

create or replace function public.insert_lead_with_api_key(
  p_api_key uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_message text,
  p_source text,
  p_source_page text,
  p_referrer text,
  p_utm_source text,
  p_utm_medium text,
  p_utm_campaign text,
  p_utm_term text,
  p_utm_content text,
  p_ip_hash text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_lead_id uuid;
begin
  select id into v_client_id from public.clients where api_key = p_api_key;
  if v_client_id is null then
    raise exception 'invalid_api_key' using errcode = '42501';
  end if;

  insert into public.leads (
    client_id, name, email, phone, message, source,
    source_page, referrer, utm_source, utm_medium, utm_campaign, utm_term, utm_content, ip_hash
  )
  values (
    v_client_id, p_name, p_email, p_phone, p_message, coalesce(p_source, 'contact-form'),
    p_source_page, p_referrer, p_utm_source, p_utm_medium, p_utm_campaign, p_utm_term, p_utm_content, p_ip_hash
  )
  returning id into v_lead_id;

  return v_lead_id;
end;
$$;

revoke all on function public.insert_lead_with_api_key(uuid, text, text, text, text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.insert_lead_with_api_key(uuid, text, text, text, text, text, text, text, text, text, text, text, text, text) to anon, authenticated;
