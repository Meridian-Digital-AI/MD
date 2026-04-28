# Dashboard Setup — Manual Steps

The code for the client dashboard is in. To make it run, you need to do these one-time steps yourself (I can't do them for you — they require your accounts and credentials).

**Total time: ~15 minutes.**

## Step 1 — Create a Supabase project (free)

1. Go to https://supabase.com → **Start your project** → sign in with GitHub.
2. **New project**:
   - Name: `meridian-digital`
   - Database password: generate a strong one and save it in your password manager
   - Region: **Europe (London)** for best speed for UK users
   - Pricing: **Free**
3. Wait ~2 minutes for it to provision.

## Step 2 — Run the database schema

1. In your Supabase project, sidebar → **SQL Editor** → **New query**.
2. Open `meridian-digital/supabase/schema.sql` from this repo, copy all of it, paste into the editor, click **Run**.
3. You should see "Success. No rows returned." If it errors, screenshot it and send it over.

## Step 3 — Copy the credentials into env vars

In Supabase, sidebar → **Project Settings** → **API**. You'll see three values you need:

| Supabase shows | Copy into `.env.local` |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` `secret` key | `SUPABASE_SERVICE_ROLE_KEY` |

⚠️ **The service role key bypasses all security.** Never paste it into browser code, public files, or chat. Only goes in `.env.local` (which is gitignored) and Vercel's env settings.

Then add the same three to **Vercel** so the live site can talk to Supabase too:
1. https://vercel.com/wallen07-gifs-projects/md/settings/environment-variables
2. Add each one for **Production, Preview, Development**.

## Step 4 — Configure auth redirect URLs in Supabase

So magic links land back on your domain:

1. Supabase sidebar → **Authentication** → **URL Configuration**.
2. **Site URL**: `https://www.meridian-digital-partners.com`
3. **Redirect URLs** (add both):
   - `https://www.meridian-digital-partners.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for local dev)
4. Save.

## Step 5 — Create your admin account

You're the first user. Sign yourself up first, then promote yourself to admin.

1. Visit https://www.meridian-digital-partners.com/login (or `localhost:3000/login` running locally).
2. Enter your email → click **Email me a sign-in link**.
3. Check your inbox → click the link → you should land on `/dashboard` with a "Account not linked yet" message. That's expected.
4. **Promote yourself to admin.** In Supabase sidebar → **SQL Editor** → run:
   ```sql
   update public.users
   set role = 'admin'
   where email = 'jw@meridian-digital-partners.com';
   ```
   (Use the email you just signed up with.)
5. Refresh the dashboard. You should now be redirected to `/admin` and see the seeded test clients (Oriental City and Parkside Garage).

## Step 6 — Add a real client (when you have one)

Two options:

**A) From Supabase Studio (easiest):**
1. Sidebar → **Table Editor** → **clients** → **Insert row**.
2. Fill in `business_name`, `slug`, `package_tier`, `domain`. Save.
3. Get the new `id` (uuid).
4. Then in **Authentication → Users**, invite the client by email — they'll get a magic link.
5. After they sign in once, run in SQL editor to link them:
   ```sql
   update public.users
   set client_id = '<uuid-from-step-3>'
   where email = 'client@example.com';
   ```

**B) Build an admin "New client" form:** later phase.

## Step 7 — Verify everything works

- ✅ Hit `/login` while logged out → see login page
- ✅ Hit `/dashboard` while logged out → redirects to `/login`
- ✅ Hit `/admin` as a regular user → redirects to `/dashboard`
- ✅ Hit `/admin` as admin → see all clients with health badges
- ✅ Two clients can't see each other's leads (test by creating a second auth user, linking to a different `client_id`, and trying to query)

## What's not built yet (and why)

These need OAuth apps that have to be registered in each provider's developer console — that requires *your* sign-in to those services, so I can't automate it.

| Phase | Feature | What you'll need to do |
|---|---|---|
| 3 | GA4 connect | Create OAuth client in Google Cloud Console, paste credentials into env vars |
| 4 | Meta Ads connect | Register app at https://developers.facebook.com, get App ID + secret |
| 4 | Google Ads connect | Apply for Google Ads developer token (24–48h review) |
| 5 | Pause/resume campaigns | Built on top of Phase 4 connections |
| 6 | Health-score algorithm | Computed from data captured in Phases 2–4 |

When you're ready for Phase 3, ping me — I'll do the OAuth wiring once you've registered the OAuth client.

## Cost summary

- **Supabase free tier**: 500MB database, 50,000 monthly active users, 2GB bandwidth. Comfortably covers ~50 clients.
- **Vercel Hobby**: free, same as today.
- **Resend** (email magic links): free up to 3,000/month.

You will hit ~£0/month until you have ~50 clients on the dashboard.
