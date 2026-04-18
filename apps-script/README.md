# Meridian Digital — Sheets tracking & 48h digest setup

This connects the live website to a Google Sheet that auto-fills:
- **Site Visits** (one row per visitor session)
- **Email Signups** (10% popup)
- **Contact Form** submissions
- **Bookings** (discovery calls from the calendar)

It also sends `wandj@meridian-digital-partners.com` an email every **48 hours** with a summary of new activity.

---

## Step 1 — Open Apps Script

1. Open the sheet: **Meridian Digital — Leads & Bookings**
   <https://docs.google.com/spreadsheets/d/16eqV-RsR69ZNRiOplY-h9AvagtbPn5lBcpZ4GlRsCUQ/edit>
2. **Extensions → Apps Script**

## Step 2 — Paste the script

1. Delete anything in `Code.gs`.
2. Copy the entire contents of `apps-script/Code.gs` (in this repo) and paste it in.
3. **Change one line**: replace `REPLACE_ME_WITH_A_LONG_RANDOM_STRING` with a long random string (anything — 32+ chars). This is the shared secret. Keep a note of it — you'll paste it into Vercel in step 5.
4. **Save** (floppy disk icon or ⌘ S).

## Step 3 — Initialize (creates tabs + trigger)

1. In the Apps Script toolbar, select the function `initialize` from the dropdown.
2. Click **Run**.
3. Google will ask for permissions — click **Review permissions → choose your Google account → Advanced → Go to "Meridian Digital — Leads & Bookings" (unsafe) → Allow**. (It says "unsafe" because the script isn't Google-verified, which is normal for personal scripts.)
4. You should see "Execution completed" at the bottom. The sheet will now have four tabs: **Bookings, Email Signups, Contact Form, Site Visits**, and a 48-hour time trigger is installed.

## Step 4 — Deploy as a web app

1. Top-right: **Deploy → New deployment**.
2. Click the gear ⚙️ next to "Select type" → **Web app**.
3. Fill in:
   - Description: `Meridian webhook`
   - Execute as: **Me** (your Google account)
   - Who has access: **Anyone** (required so the Vercel server can POST to it — it's still secret-protected by the shared secret)
4. Click **Deploy**.
5. Copy the **Web app URL** (ends in `/exec`). Keep this tab open.

## Step 5 — Add both values to Vercel

1. Vercel → your `md` project → **Settings → Environment Variables**.
2. Add two variables (apply to all environments: Production, Preview, Development):
   - `SHEETS_WEBHOOK_URL` → the `/exec` URL from step 4
   - `SHEETS_WEBHOOK_SECRET` → the same random string you pasted into `Code.gs`
3. **Redeploy** the project (Deployments → three-dot menu on latest → Redeploy). Env vars only take effect on a fresh deployment.

## Step 6 — Test it

- Visit <https://www.meridian-digital-partners.com>. Within a few seconds a row should appear in **Site Visits**.
- Submit the 10% discount popup → row in **Email Signups**.
- Submit the contact form → row in **Contact Form**.
- Pick a slot + confirm on the booking calendar → row in **Bookings**.

## Step 7 — Test the digest email (optional)

Back in Apps Script, select `sendDigestNow` from the dropdown and **Run**. You should receive a digest email within a minute at `wandj@meridian-digital-partners.com`.

After that, the trigger fires automatically every 48 hours. If a 48-hour window has zero activity, no email is sent (to avoid noise).

---

## If you ever change `SHARED_SECRET`

You must update `SHEETS_WEBHOOK_SECRET` in Vercel to match, then redeploy. Otherwise the webhook will reject incoming rows.

## If you want to redeploy the script

`Deploy → Manage deployments → pencil icon → New version`. The URL **stays the same**, so you don't need to touch Vercel.

## Troubleshooting

- **Rows not appearing:** open the Apps Script editor → `Executions` (left sidebar). Every request shows up there with a green tick or a red error.
- **"unauthorized" response:** the `SHEETS_WEBHOOK_SECRET` in Vercel doesn't match the `SHARED_SECRET` in `Code.gs`.
- **No digest email:** check Apps Script → `Triggers`. There should be one: `send48hDigest` · Time-driven · Every 48 hours.
