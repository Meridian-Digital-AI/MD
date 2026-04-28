# Client Dashboard — Architecture & Phasing

A logged-in area at `/dashboard` (clients) and `/admin` (us). Same site as the marketing pages; no subdomain.

## Goals

1. Each client sees ONLY their own data. Two clients can never see each other.
2. Admin (us) sees everything: list of all clients, ability to drill into any client's dashboard.
3. What a client sees depends on which package tier they bought.
4. Admin sees a 1–10 health score per client (clients don't see this).
5. Foundation for: analytics, ads management, lead inbox, website pageviews.

## Stack

| Concern | Choice | Why |
|---|---|---|
| Auth | **Supabase Auth** (magic-link email login) | Free, no passwords to leak, built-in to Supabase |
| Database | **Supabase Postgres** | Same dashboard, free 500MB, automatic backups |
| Data isolation | **Row-Level Security (RLS) policies** | Postgres-enforced — even a coding bug can't leak data across clients |
| Hosting | Same Vercel project (existing site) | No new infra to manage |
| Routing | `/login`, `/dashboard/*`, `/admin/*` | Same domain. Simpler than a subdomain. |

## Data model

```
clients
  id (uuid, pk)
  business_name (e.g. "Oriental City")
  slug (e.g. "oriental-city")
  package_tier ('get-started' | 'grow' | 'full-partner' | 'website-only')
  domain (e.g. "orientalcityexeter.com")
  ga4_property_id (optional, for GA4 link)
  meta_ad_account_id (optional)
  google_ads_customer_id (optional)
  health_score (int, 1-10, admin-only, nullable)
  created_at

users
  id (uuid, pk, == auth.users.id)
  email
  client_id (fk → clients, NULL for admins)
  role ('admin' | 'client')
  created_at

leads
  id, client_id (fk), name, email, phone, message, source, status, created_at

ad_connections
  id, client_id (fk), provider ('ga4' | 'meta' | 'google_ads'),
  access_token_encrypted, refresh_token_encrypted, status, connected_at

pageviews   # from existing PageviewTracker
  id, client_id (fk), path, referrer, country, ts
```

**Row-Level Security** policies (the magic that keeps clients separated):

- Client users: `WHERE client_id = (SELECT client_id FROM users WHERE id = auth.uid())`
- Admin users: bypass (`auth.jwt() ->> 'role' = 'admin'`)

## Tier → feature gating

| Section | Get Started | Grow | Full Partner |
|---|---|---|---|
| Overview | ✅ | ✅ | ✅ |
| Leads inbox | ✅ | ✅ | ✅ |
| Website pageviews | basic | full | full |
| Analytics (GA4) | — | basic | full |
| Ads — view | — | view-only | view + manage |
| Ads — manage (pause/budget) | — | — | ✅ |
| Settings | ✅ | ✅ | ✅ |

Encoded as a single `packageFeatures.ts` config so it's one place to change.

## Phasing

### Phase 1 — Foundation (THIS COMMIT)
- Supabase deps installed, env vars wired
- SQL schema + RLS policies (provided as `supabase/schema.sql`, run once in Supabase)
- `/login` magic-link flow
- Auth middleware, role-gated routes
- `/dashboard` shell with Overview/Analytics/Ads/Leads/Settings tabs (mock data)
- `/admin` shell with client list + health-score badges (mock data)
- Tier-based tab visibility working

### Phase 2 — Real lead capture
- Contact form on marketing site writes to `leads` table (currently writes to Google Sheet)
- Lead inbox page becomes real for new contacts
- Existing Sheet rows can be backfilled later

### Phase 3 — Analytics integration (GA4)
- OAuth flow: client clicks "Connect Google Analytics" → grants access → we store refresh token
- Pull pageviews/sessions/conversions from GA4 Data API
- Display charts in Analytics tab

### Phase 4 — Ads integration (read-only)
- Meta Ads + Google Ads OAuth apps registered (manual — see SETUP_DASHBOARD.md)
- Read campaign data, spend, CTR, conversions
- Display in Ads tab

### Phase 5 — Ads management (write actions)
- Pause / resume / change budget on campaigns
- Approval flow: action queued → admin (us) approves → executes
- Audit log

### Phase 6 — Health score
- Admin-only 1–10 score computed from:
  - Pageview trend (last 30d vs previous 30d)
  - Lead conversion trend
  - Ad performance (if applicable)
  - Site uptime / Core Web Vitals
- Updates nightly via cron

## Manual steps required (non-code)

These can't be automated — flagged in `SETUP_DASHBOARD.md`:
1. Create Supabase project, copy URL + anon key + service role key into env vars
2. Run `supabase/schema.sql` in Supabase SQL editor
3. (Phase 3) Create Google Cloud project, enable GA4 Data API, create OAuth client
4. (Phase 4) Create Meta for Developers app
5. (Phase 4) Create Google Ads developer token
