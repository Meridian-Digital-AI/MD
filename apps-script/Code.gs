/**
 * Meridian Digital — Sheets webhook + 24-hour digest
 * ────────────────────────────────────────────────────
 * Paste this into Apps Script (Tools → Apps Script) on the
 * "Meridian Digital — Leads & Bookings" sheet.
 *
 * First-time setup (or after editing this file):
 *   1. Replace SHARED_SECRET below with your real shared secret.
 *   2. Run initialize() once from the editor (approve the scopes).
 *   3. Deploy → New deployment → Web app
 *        - Execute as: Me
 *        - Who has access: Anyone
 *      Copy the /exec URL.
 *   4. In Vercel project settings ensure these are set:
 *        SHEETS_WEBHOOK_URL    = <the /exec URL>
 *        SHEETS_WEBHOOK_SECRET = <same string as SHARED_SECRET below>
 *
 * What it does:
 *   - doPost(e) accepts webhook calls from the website and appends
 *     rows to the correct tab based on record.type.
 *   - sendDailyDigest() runs every 24h, emails a summary of:
 *       • the last 24h of activity (visits, signups, contacts, bookings)
 *       • 5 prospect businesses to target today (from the "Daily Targets" tab)
 *     to DIGEST_RECIPIENT. Will NOT send if there's nothing to report
 *     AND no targets pending.
 */

const SHARED_SECRET = 'REPLACE_ME_WITH_A_LONG_RANDOM_STRING';

const DIGEST_RECIPIENT = 'wandj@meridian-digital-partners.com';
const DIGEST_WINDOW_HOURS = 24;
const DAILY_TARGETS_PER_DIGEST = 5;

const TABS = {
  bookings:     { name: 'Bookings',      headers: ['Booked At','Slot','Name','Email','Phone','Business','IP'] },
  emailSignups: { name: 'Email Signups', headers: ['Captured At','Email','Source','IP'] },
  contacts:     { name: 'Contact Form',  headers: ['Submitted At','Name','Email','Phone','Business','Type','Message','Source','Source Page','IP'] },
  pageviews:    { name: 'Site Visits',   headers: ['Visited At','Path','Referrer','User Agent','IP'] },
  targets:      { name: 'Daily Targets', headers: ['Business','Sector','Location','Phone','Website','Notes','Sent At'] },
};

/* ─────────────────────────────────────────────────────────── */

function initialize() {
  const ss = SpreadsheetApp.getActive();

  // Create missing tabs with headers
  Object.values(TABS).forEach(({ name, headers }) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  });

  // Remove default "Sheet1" if it's empty and not one of ours
  const first = ss.getSheets()[0];
  const known = new Set(Object.values(TABS).map(t => t.name));
  if (!known.has(first.getName()) && first.getLastRow() === 0) {
    try { ss.deleteSheet(first); } catch (_) {}
  }

  // Install / replace daily digest trigger.
  // Removes any old send48hDigest triggers from the previous version.
  ScriptApp.getProjectTriggers().forEach(t => {
    const fn = t.getHandlerFunction();
    if (fn === 'sendDailyDigest' || fn === 'send48hDigest') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendDailyDigest')
    .timeBased()
    .atHour(8)            // 8am local time
    .everyDays(1)
    .create();

  Logger.log('Initialized: tabs ready + daily 8am digest trigger installed.');
}

/* ─────────────────────────────────────────────────────────── */

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');

    if (body.secret !== SHARED_SECRET) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActive();
    const now = body.receivedAt || new Date().toISOString();

    switch (body.type) {
      case 'booking': {
        const sh = ss.getSheetByName(TABS.bookings.name);
        sh.appendRow([
          body.bookedAt || now,
          body.slotDisplay || body.slotISO || '',
          body.name || '',
          body.email || '',
          body.phone || '',
          body.businessName || '',
          body.ip || '',
        ]);
        break;
      }
      case 'email-signup': {
        const sh = ss.getSheetByName(TABS.emailSignups.name);
        sh.appendRow([
          body.capturedAt || now,
          body.email || '',
          body.source || '',
          body.ip || '',
        ]);
        break;
      }
      case 'contact': {
        const sh = ss.getSheetByName(TABS.contacts.name);
        sh.appendRow([
          now,
          body.name || '',
          body.email || '',
          body.phone || '',
          body.businessName || '',
          body.businessType || '',
          body.message || '',
          body.source || '',
          body.sourcePage || '',
          body.ip || '',
        ]);
        break;
      }
      case 'pageview': {
        const sh = ss.getSheetByName(TABS.pageviews.name);
        sh.appendRow([
          body.visitedAt || now,
          body.path || '',
          body.referrer || '',
          body.userAgent || '',
          body.ip || '',
        ]);
        break;
      }
      default:
        return ContentService
          .createTextOutput(JSON.stringify({ ok: false, error: 'unknown type' }))
          .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ─────────────────────────────────────────────────────────── */

function sendDailyDigest() {
  const ss = SpreadsheetApp.getActive();
  const windowStart = new Date(Date.now() - DIGEST_WINDOW_HOURS * 60 * 60 * 1000);

  const bookings     = rowsAll(ss, TABS.bookings);
  const emailSignups = rowsAll(ss, TABS.emailSignups);
  const contacts     = rowsAll(ss, TABS.contacts);
  const pageviews    = rowsAll(ss, TABS.pageviews);

  const newBookings     = bookings.filter(r     => parseDate(r[0]) >= windowStart);
  const newEmailSignups = emailSignups.filter(r => parseDate(r[0]) >= windowStart);
  const newContacts     = contacts.filter(r     => parseDate(r[0]) >= windowStart);
  const newPageviews    = pageviews.filter(r    => parseDate(r[0]) >= windowStart);

  // Pick today's targets (oldest unprocessed rows in the Daily Targets tab).
  // Mark them sent so they don't appear in tomorrow's digest.
  const todaysTargets = pickAndMarkTargets(ss, DAILY_TARGETS_PER_DIGEST);

  const activityCount = newBookings.length + newEmailSignups.length + newContacts.length + newPageviews.length;
  if (activityCount === 0 && todaysTargets.length === 0) {
    Logger.log('Nothing to report and no targets pending — no email sent.');
    return;
  }

  const uniqueVisitorsByIp = new Set(newPageviews.map(r => r[4])).size;

  let body = '';
  body += 'Meridian Digital — last 24 hours\n';
  body += '(' + windowStart.toLocaleString('en-GB') + ' → ' + new Date().toLocaleString('en-GB') + ')\n\n';
  body += 'Summary\n';
  body += '  • Site visits:         ' + newPageviews.length + ' (unique IPs: ' + uniqueVisitorsByIp + ')\n';
  body += '  • Email sign-ups:      ' + newEmailSignups.length + '\n';
  body += '  • Contact submissions: ' + newContacts.length + '\n';
  body += '  • Discovery bookings:  ' + newBookings.length + '\n';
  body += '  • Totals so far:       ' + bookings.length + ' bookings · '
       + emailSignups.length + ' signups · ' + contacts.length + ' contacts · '
       + pageviews.length + ' visits\n\n';

  if (newBookings.length) {
    body += '── New bookings ──\n';
    newBookings.forEach(r => {
      body += '  ' + r[2] + ' <' + r[3] + '> — ' + r[1] + '\n';
    });
    body += '\n';
  }

  if (newContacts.length) {
    body += '── New contact form enquiries ──\n';
    newContacts.forEach(r => {
      body += '  ' + r[1] + ' <' + r[2] + '> — ' + r[5] + ' (' + r[4] + ')\n';
      if (r[6]) body += '    "' + String(r[6]).slice(0, 160) + (String(r[6]).length > 160 ? '…' : '') + '"\n';
    });
    body += '\n';
  }

  if (newEmailSignups.length) {
    body += '── New email sign-ups (10% popup, etc.) ──\n';
    newEmailSignups.forEach(r => {
      body += '  ' + r[1] + ' [source: ' + r[2] + ']\n';
    });
    body += '\n';
  }

  if (todaysTargets.length) {
    body += '── Today\'s 5 prospects to contact ──\n';
    todaysTargets.forEach((t, i) => {
      // Columns: Business, Sector, Location, Phone, Website, Notes, Sent At
      body += (i + 1) + '. ' + (t[0] || '(unnamed)') + '\n';
      if (t[1] || t[2]) body += '   Sector / location: ' + [t[1], t[2]].filter(Boolean).join(' · ') + '\n';
      if (t[3])         body += '   Phone:   ' + t[3] + '\n';
      if (t[4])         body += '   Website: ' + t[4] + '\n';
      if (t[5])         body += '   Notes:   ' + t[5] + '\n';
      body += '\n';
    });
  } else {
    body += '── Today\'s prospects ──\n';
    body += '  (No unprocessed rows in the "Daily Targets" tab. Add some prospects to get 5 per day.)\n\n';
  }

  body += 'Full data: ' + ss.getUrl() + '\n';

  const subject = '[Meridian] Daily digest — '
    + newPageviews.length + ' visits · '
    + newEmailSignups.length + ' signups · '
    + newContacts.length + ' contacts · '
    + newBookings.length + ' bookings · '
    + todaysTargets.length + ' targets';

  MailApp.sendEmail({ to: DIGEST_RECIPIENT, subject: subject, body: body });
  Logger.log('Daily digest sent to ' + DIGEST_RECIPIENT);
}

/* ─────────────────────────────────────────────────────────── */

/**
 * Read the Daily Targets tab. Pick the first `count` rows whose
 * "Sent At" column (last column) is empty. Stamp them with the
 * current ISO timestamp so they don't appear again. Return the
 * rows we picked.
 */
function pickAndMarkTargets(ss, count) {
  const tab = TABS.targets;
  const sh = ss.getSheetByName(tab.name);
  if (!sh || sh.getLastRow() < 2) return [];
  const headerCount = tab.headers.length;
  const sentAtCol = headerCount; // 1-indexed last column
  const range = sh.getRange(2, 1, sh.getLastRow() - 1, headerCount);
  const rows = range.getValues();

  const picked = [];
  const now = new Date();
  for (let i = 0; i < rows.length && picked.length < count; i++) {
    const row = rows[i];
    if (!row[0]) continue; // skip empty business rows
    if (row[sentAtCol - 1]) continue; // already sent
    picked.push(row);
    sh.getRange(i + 2, sentAtCol).setValue(now); // mark sent
  }
  return picked;
}

function rowsAll(ss, tab) {
  const sh = ss.getSheetByName(tab.name);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, tab.headers.length).getValues();
}

function parseDate(v) {
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

/* Manual trigger for a one-off digest — handy for testing. */
function sendDigestNow() {
  sendDailyDigest();
}
