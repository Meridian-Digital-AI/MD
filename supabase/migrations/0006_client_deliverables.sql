-- Phase 4.5 — Client deliverables tracker.
--
-- Each client retainer includes a set of monthly deliverables (calls,
-- creative refreshes, blog posts, reports, etc.) which we want to track
-- explicitly so we can:
--   1. See at a glance what's been done this month vs. what's outstanding
--   2. Bill clients with confidence ("here's everything we shipped")
--   3. Eventually expose a read-only view to the client itself
--
-- Rows are scoped per client per calendar month. Admin-only writes for
-- now; we keep the door open to client-side reads later by storing
-- client_id directly (not via a join through users).

create table if not exists public.client_deliverables (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  year_month text not null,                 -- 'YYYY-MM', e.g. '2026-05'
  title text not null,
  type text not null default 'other'        -- 'call' | 'creative' | 'blog' | 'audit' | 'report' | 'other'
    check (type in ('call', 'creative', 'blog', 'audit', 'report', 'other')),
  notes text,
  order_index int not null default 0,
  completed_at timestamptz,
  completed_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_deliverables_client_month_idx
  on public.client_deliverables (client_id, year_month);

create index if not exists client_deliverables_open_idx
  on public.client_deliverables (client_id, completed_at)
  where completed_at is null;

-- Format check on year_month — keeps queries simple.
alter table public.client_deliverables
  drop constraint if exists client_deliverables_year_month_format;
alter table public.client_deliverables
  add constraint client_deliverables_year_month_format
  check (year_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');

alter table public.client_deliverables enable row level security;

-- Admins: full control.
drop policy if exists "client_deliverables admin all" on public.client_deliverables;
create policy "client_deliverables admin all" on public.client_deliverables
  for all using (public.is_admin()) with check (public.is_admin());

-- Clients: read-only access to their own (forward-compatible — not used
-- by the admin UI but ready for the client-facing dashboard).
drop policy if exists "client_deliverables client read own" on public.client_deliverables;
create policy "client_deliverables client read own" on public.client_deliverables
  for select using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.client_id = client_deliverables.client_id
    )
  );

comment on table public.client_deliverables is
  'Per-client per-month checklist of retainer deliverables. Admin tracks '
  'what has been shipped each month; eventually surfaced to clients.';
