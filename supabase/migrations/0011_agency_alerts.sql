-- Agency-level health alerts. Written by background crons (e.g. Meta token
-- health check) and read by /admin/settings to surface banners.

create table if not exists public.agency_alerts (
  id uuid primary key default gen_random_uuid(),
  severity text not null check (severity in ('info', 'warning', 'critical')),
  provider text not null,
  message text not null,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists agency_alerts_unacked_idx
  on public.agency_alerts (created_at desc)
  where acknowledged_at is null;

alter table public.agency_alerts enable row level security;

-- Only admins can read.
create policy "agency_alerts admin read" on public.agency_alerts
  for select using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

-- Only admins can update (acknowledge).
create policy "agency_alerts admin update" on public.agency_alerts
  for update using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );
