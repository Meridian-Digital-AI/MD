# Meridian Digital — How To Use

A practical guide to running clients through the Meridian Digital platform. Written so anyone on the team — especially Joe, who manages most ads — can pick this up cold.

---

## What this thing is

A dashboard for digital-marketing clients. They log in and see:

- Their leads as they come in (from their website contact form)
- Their website traffic (pageviews, last 30 days)
- Their monthly Meta Ads numbers (we type these in — see [Monthly workflow](#monthly-workflow))
- A checklist of deliverables we've shipped this month
- A monthly PDF report (downloadable, and auto-emailed at the start of each month — once the cron is wired)

You (the team) see all of that plus an admin panel to manage clients, type in numbers, tick deliverables, and answer install requests.

---

## Sign in

- **Admin** (you / Joe / William): go to <https://meridian-digital-partners.com/login>, type your email, click the magic link. You land on `/admin`.
- **Client** (Sarah at Acme Bakery): same login flow at the same URL — but she lands on `/dashboard`, scoped to just her data.

Roles are decided in the database — no toggle in the UI. If a new admin joins, William adds their email to the `users` table and sets `role = 'admin'`.

---

## Onboarding a new client (start to finish)

### 1. Create the client (~2 mins)

`/admin` → **+ New client** (top right). Fill in:

| Field | What to put |
|---|---|
| Business name | "Acme Bakery" |
| Slug | auto-generated, leave alone |
| Package tier | Get Started / Grow / Full Partner / Website-only |
| Website domain | `acmebakery.co.uk` |
| Primary login email | Sarah's email |

Hit **Create client**. The system:
- Creates the client record
- Generates an API key (used for the tracking script + lead webhook)
- Adds Sarah's email to the signup allowlist — when she logs in, she's auto-attached

### 2. Tell Sarah to log in

Right now, you have to do this manually: text/email Sarah:
> Hi Sarah — your dashboard's ready. Sign in at meridian-digital-partners.com/login with this email address. We'll email you a one-tap link.

(There's a planned auto-invite email — see [What's still on the to-do list](#whats-still-on-the-to-do-list).)

### 3. Sarah signs in and sees the onboarding checklist

She lands on `/dashboard`. Until she's got at least one pageview AND one lead, she sees a big blue checklist:

```
✓ Account created
☐ Connect your website          [Have us set it up | Send to my web person | Show me how]
☐ Connect your lead form
```

She picks **one of three paths** (more detail below). Whichever she picks, **the dashboard auto-refreshes every 30 seconds** while the checklist is open. As soon as her first pageview lands, the website item ticks itself green. Same for leads.

There's a small note at the bottom of the checklist:

> **Meta Ads:** handled by your Meridian Digital account manager. No setup needed on your side.

That's deliberate — see [Monthly workflow](#monthly-workflow).

---

## The three install paths (what each one does)

Sarah clicks "Connect your website" → three buttons appear.

### Path 1 — "Have us set it up" 🤝

She picks platform (Wix/Squarespace/WordPress/Webflow/Shopify/Other) and access method (add us as a user / share login / 15-min screenshare).

**What happens:**
- A row is inserted into `integration_requests` (kind: `white_glove`)
- An email is sent to `wandj@meridian-digital-partners.com` (the `LEAD_ADMIN_NOTIFY_EMAIL` env var) — title `[Onboarding] Acme Bakery requested install help`
- Sarah sees: *"Got it. Your Meridian Digital account manager will be in touch within 1 working day."*

**What you do:**
1. Open the email
2. The email contains:
   - Sarah's exact tracking script (with her API key baked in)
   - Her exact lead webhook URL
   - A link to her admin client page
3. Either:
   - Reply to schedule the screenshare
   - Wait for her to add you as a user, then log in and install
   - Ask her to share login credentials
4. Install the script, publish, done. Pageviews flow within a minute. You'll see the checklist auto-tick on her side.

### Path 2 — "Send to my web person" 📨

She types her web person's email + name + an optional note.

**What happens:**
- Row in `integration_requests` (kind: `send_to_web_person`)
- Email sent to the web person from `onboarding@resend.dev` (or your verified `RESEND_FROM` once set up). Subject: *"Quick install for Acme Bakery — ~5 mins"*. Contains:
  - Sarah's tracking script
  - Sarah's lead webhook URL
  - Step-by-step list
  - Links to the per-platform self-serve guides
  - Reply-to is set to **Sarah's** email so the web person replies to her, not us
- A second email (a CC) lands in `wandj@meridian-digital-partners.com` letting you know it went out

**What you do:** usually nothing. The web person installs, replies to Sarah, you see the checklist tick on her dashboard. Only intervene if the request stalls.

### Path 3 — "Show me how" 🛠️

She picks her platform → lands on `/dashboard/setup/wix` (or squarespace/wordpress/webflow/shopify/other).

The page renders her actual tracking script + lead webhook, both with one-click "Copy" buttons, plus a step-by-step list for her platform. No screenshots yet — to be added.

**What you do:** nothing unless she gets stuck and clicks back to the dashboard for one of the other paths.

---

## Monthly workflow (the bit Joe will run a lot)

This is the rhythm of the dashboard for ad-paying clients.

### Throughout the month — automatic

- Pageviews flow in from the tracking script
- Leads flow in from the contact form / webhook
- Health scores recompute each time you open the admin
- You tick off deliverables as you ship them (see below)

### End of the month — manual, ~90 secs per client

This is **the bit that replaces the broken Meta API integration**. We type in the numbers from Joe's Ads Manager.

1. Joe screenshots Ads Manager: spend / impressions / clicks for last month
2. You go to `/admin/clients/<slug>/monthly?month=YYYY-MM` (or click "Monthly view" from the client page, then pick the right month from the row of pills)
3. Find the **Meta Ads — manual entry** card
4. Type in the three numbers (and optional internal-only notes)
5. Hit **Save**

That's it. Those numbers now appear:
- On the admin monthly view StatCards
- On Sarah's `/dashboard` ad-spend card
- On the downloadable PDF (admin clicks "Download PDF" top right)
- On the cron-emailed monthly PDF (when wired up)

**Numbers entered manually win over the live Meta API** — so when (if) we ever do get Tech Provider verified and live API working, manual entries you've already typed in stay correct.

### Joe's specific role

Joe is closer to the campaigns than William, so he'll typically be:

1. **The source of the monthly numbers.** End of each month, screenshot Ads Manager and either send the screenshot to William or type the numbers in himself (he's an admin too).
2. **The ad-creative deliverer.** As he ships creative refreshes, blog posts, audits etc, tick them off in the **Deliverables** panel for the right month under each client. The client sees the same checklist on their dashboard (read-only) so they know what they're paying for.
3. **The first responder for white-glove install requests.** When `[Onboarding] X requested install help` hits the admin inbox, Joe grabs it.

---

## Admin tour

| Page | What it's for |
|---|---|
| `/admin` | All clients list with health scores. Worst-scoring clients pinned at top in the "Needs attention" panel. |
| `/admin/clients/[slug]` | Single client — health breakdown, recent leads, package tier, ad-account status, API key. |
| `/admin/clients/[slug]/monthly?month=YYYY-MM` | The bread-and-butter monthly view: lead/pageview counts, **Meta manual entry card**, **Deliverables panel**. |
| `/admin/clients/[slug]/edit` | Change tier / domain / business name. |
| `/admin/clients/new` | Onboard a new client. |
| `/admin/settings` | Agency-wide settings — Meta connection, theme. |

### Deliverables panel — how to use

For each client, each month, there's a checklist of what we've shipped. The first time you open a fresh month, you'll see "Apply default template" — clicking that seeds the standard list for the client's tier (e.g. Grow gets 6 deliverables: 1 strategy call, 2 creative pieces, 1 blog, 1 audit, 1 report).

After that, just tick items as you ship them. You can also:
- **+ Add** to append a custom deliverable
- Click into one to edit notes / type / title
- Delete with the bin icon

The same panel appears (read-only) on the client's `/dashboard` — they see exactly the same titles and tick states. This is the "what are we paying for" answer.

### Health scores

Computed live each page render from raw signals. The breakdown card on `/admin/clients/[slug]` shows components: leads (last 30d), pageviews, recency of activity, integration completeness, lead trend (vs prior 30d). Each gives points; total is /10. Score ≤ 4 (and not a brand-new client) → flagged on the admin home as "needs attention".

The trend arrow (↑↓→·) on the home page is derived from the lead-trend component — up if leads grew vs prior 30 days, etc.

---

## What's actually built (file map)

This section is the technical anchor — when something needs changing, this is where to look.

### Database (`supabase/migrations/`)

```
0002_phase2_leads.sql         leads, pageviews, lead_source
0003_signup_gating.sql        users.role + signup_allowlist
0004_ad_connection_external_id.sql
0005_agency_integrations.sql  Meta agency-wide connection (currently dormant)
0006_client_deliverables.sql  Per-client monthly deliverables
0007_client_meta_monthly.sql  ★ Manual Meta numbers (this session)
0008_client_onboarding.sql    ★ Onboarding state + integration_requests (this session)
```

### Admin pages (`src/app/admin/`)

```
page.tsx                              Home — all clients + at-risk panel
clients/new/                          Onboard form
clients/[slug]/page.tsx               Single-client detail
clients/[slug]/edit/                  Edit form
clients/[slug]/monthly/page.tsx       Monthly rollup — leads + Meta card + deliverables
clients/[slug]/monthly/ManualMetaEntryCard.tsx  ★ Manual Meta entry (this session)
clients/[slug]/monthly/DeliverablesPanel.tsx
clients/[slug]/monthly/MonthSelector.tsx
settings/                             Agency-wide settings
```

### Client dashboard (`src/app/dashboard/`)

```
page.tsx                              ★ Now with onboarding checklist gating
layout.tsx                            Nav + auth
setup/[platform]/page.tsx             ★ Self-serve install guides (this session)
setup/[platform]/CopyBlock.tsx        ★ Copy-button code blocks (this session)
leads/, pageviews/, ads/, analytics/  Tier-gated deeper views
```

### Components (`src/components/dashboard/`)

```
ClientDeliverablesPanel.tsx           Read-only deliverables on client side
ClientOnboardingChecklist.tsx         ★ Three-path picker + live verification (this session)
StatCard.tsx
DashboardNav.tsx
```

### API (`src/app/api/`)

```
admin/clients/[slug]/meta-monthly/route.ts  ★ GET/POST manual Meta entry (this session)
admin/clients/[slug]/monthly/pdf/route.ts   PDF generator (now reads manual entries)
admin/clients/[slug]/deliverables/          Deliverable CRUD
admin/clients/[slug]/meta-ad-account/       Live-API ad account assignment (dormant)
admin/meta/                                  Agency-wide Meta connect / paste-token (dormant)
dashboard/integration-request/route.ts      ★ White-glove + send-to-web-person (this session)
leads/[slug]/route.ts                       Webhook for lead form submissions
pageview/                                    Tracking script ingestion
```

★ = added in this session.

---

## Environment variables (don't lose these)

In `.env.local` and on Vercel:

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin key |
| `RESEND_API_KEY` | Resend API key (for emails) |
| `RESEND_FROM` | Default `Meridian Digital <onboarding@resend.dev>`. Set to your verified domain once you've verified meridian-digital-partners.com in Resend. |
| `LEAD_ADMIN_NOTIFY_EMAIL` | Where lead notifications + onboarding requests go. Default `wandj@meridian-digital-partners.com`. |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (used to build links in emails). Default `https://meridian-digital-partners.com`. |
| `META_*` | Meta OAuth config — currently dormant (live API blocked behind verification). |
| `GOOGLE_*` | Google OAuth config — also dormant pending Joe's GA4 client ID/secret. |

---

## What's still on the to-do list

Built so far gets you fully operational. These remain:

| Item | Why it matters | Effort |
|---|---|---|
| **Auto-invite email on client creation** | Right now you have to manually message new clients to log in. Trivial fix. | ~10 min |
| **Cron-emailed monthly PDF (1st of month)** | The end-of-month report should auto-email to clients. Currently you'd have to manually download and forward. | ~30 min |
| **Self-serve guide screenshots** | Pages exist, prose is in, but no screenshots yet. | ~2 hrs |
| **Tech Provider verification with Meta** | Unblocks live Meta API integration so we don't manually type numbers forever. Worth doing once you've got 5+ ad clients. | 1–2 weeks (mostly waiting on Meta) |
| **Stripe subscription billing** | Replace manual invoicing once you have ≥3 paying clients. | ~2 hrs |
| **Admin queue UI for `integration_requests`** | Right now requests are visible only via email + the database. A dedicated admin page would help if request volume grows. | ~30 min |

---

## Common gotchas

- **"Where's the BM ID?"** — In the URL. business.facebook.com/settings/?business_id=`920744034336709` — your BM ID is `920744034336709`.
- **"Meta connect button doesn't work."** — That's the OAuth path. It's gated behind Tech Provider verification. Use the manual Meta entry card on the monthly view instead.
- **"A client says they pasted the script but the dashboard still says 'connect'."** — Have them visit their own site once after publishing. The script only fires on real visits. Wait 60s.
- **"Resend says emails skipped."** — `RESEND_API_KEY` env var is missing. Set it in Vercel and redeploy.
- **"Migration file won't open on my Mac."** — The path includes a space ("business ideas"). Use the file picker, not the terminal.

---

## Last word for Joe

The piece you'll touch most is the **Meta manual entry card** on each client's monthly view. Bookmark `meridian-digital-partners.com/admin` and drill in from there.

If you spot something off, the platform errs on the side of being editable: any field you see can be changed, and there's no destructive deletion that you can do accidentally. The worst thing you can do is type a wrong number and hit save — and even then, you just type the right one and save again.

Good luck.
