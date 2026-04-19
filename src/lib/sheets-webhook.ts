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

// Map a record to an ordered row for the matching tab.
function toRow(record: SheetRecord): string[] {
  const ts = new Date().toISOString();
  switch (record.type) {
    case 'booking':
      return [ts, String(record.slot ?? ''), String(record.name ?? ''), String(record.email ?? ''), String(record.phone ?? ''), String(record.service ?? ''), String(record.message ?? ''), String(record.ip ?? '')];
    case 'email-signup':
      return [ts, String(record.email ?? ''), String(record.source ?? ''), String(record.ip ?? '')];
    case 'contact':
      return [ts, String(record.name ?? ''), String(record.email ?? ''), String(record.phone ?? ''), String(record.type ?? ''), String(record.message ?? ''), String(record.source ?? ''), String(record['sourcePage'] ?? ''), String(record.ip ?? '')];
    case 'pageview':
      return [ts, String(record.path ?? ''), String(record.referrer ?? ''), String(record.userAgent ?? ''), String(record.ip ?? '')];
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
