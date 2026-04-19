/**
 * Appends records to "Meridian Digital — Leads & Bookings" via the
 * Google Sheets API (service-account auth).
 *
 * Fire-and-forget: never throws, never blocks the user response.
 * Missing env vars or API errors are logged and swallowed so the
 * primary flow always succeeds for the visitor.
 *
 * Required env vars:
 *   GOOGLE_SHEET_ID               – spreadsheet ID
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL  – service account client_email
 *   GOOGLE_SERVICE_ACCOUNT_KEY    – private_key from JSON (\\n OK)
 */

import { google } from 'googleapis';

export type SheetRecordType = 'booking' | 'email-signup' | 'contact' | 'pageview';

export interface SheetRecord {
  type: SheetRecordType;
  [key: string]: unknown;
}

const SHEET_TABS: Record<SheetRecordType, string> = {
  booking:       'Bookings',
  'email-signup':'Email Signups',
  contact:       'Contact Form',
  pageview:      'Site Visits',
};

// Map a record to an ordered row matching each tab's header.
function toRow(record: SheetRecord): string[] {
  const ts = new Date().toISOString();
  const s = (k: string) => String(record[k] ?? '');
  switch (record.type) {
    case 'booking':
      // Bookings: Booked At | Slot | Name | Email | Phone | Business | IP
      return [ts, s('slotDisplay') || s('slotISO') || s('slot'), s('name'), s('email'), s('phone'), s('businessName'), s('ip')];
    case 'email-signup':
      // Email Signups: Captured At | Email | Source | IP
      return [ts, s('email'), s('source'), s('ip')];
    case 'contact':
      // Contact Form: Submitted At | Name | Email | Phone | Business | Type | Message | Source | Source Page
      return [ts, s('name'), s('email'), s('phone'), s('businessName'), s('businessType'), s('message'), s('source'), s('sourcePage')];
    case 'pageview':
      // Site Visits: Visited At | Path | Referrer | User Agent | IP
      return [ts, s('path'), s('referrer'), s('userAgent'), s('ip')];
    default:
      return [ts, JSON.stringify(record)];
  }
}

export async function postToSheet(record: SheetRecord): Promise<void> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const email   = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey  = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!sheetId || !email || !rawKey) {
    console.warn('[sheets] env vars missing — skipping');
    return;
  }

  try {
    const privateKey = rawKey.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const tab    = SHEET_TABS[record.type];
    const row    = toRow(record);

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range:         `${tab}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody:   { values: [row] },
    });
  } catch (err) {
    console.error('[sheets] append failed', err);
  }
}
