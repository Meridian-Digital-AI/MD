-- Discovery-call booking storage + admin slot blocking.
--
-- We previously stored bookings only in Google Sheets, which the website
-- can't query in real time. That made double-booking detection impossible.
-- This adds two tables:
--   bookings        — every confirmed booking (mirrored from /api/booking)
--   blocked_slots   — admin-blocked windows (out-of-office, doctor appt, etc.)
-- Both are queried by /api/booking/availability so the public calendar can
-- grey out unavailable slots, and POST /api/booking can reject conflicts.

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_iso timestamptz not null unique,
  name text not null,
  email text not null,
  phone text,
  business_name text,
  ip text,
  booked_at timestamptz not null default now()
);

create index if not exists bookings_slot_idx on public.bookings (slot_iso);

create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  slot_iso timestamptz not null unique,
  reason text,
  blocked_by uuid references public.users(id),
  blocked_at timestamptz not null default now()
);

create index if not exists blocked_slots_slot_idx on public.blocked_slots (slot_iso);

-- Public read of unavailable slots is OK — we expose `slot_iso` only via
-- the API, not raw rows. RLS stays restrictive: only the service role
-- (used by the API routes) can read/write. Admins use the admin-gated
-- API; the public availability endpoint also runs through the service
-- role, returning only ISO timestamps.

alter table public.bookings enable row level security;
alter table public.blocked_slots enable row level security;

-- No RLS policies created → only the service role can access these tables.
-- This is intentional: all reads/writes go through API routes that apply
-- their own auth checks (admin gate on writes, public on read of
-- aggregated availability).
