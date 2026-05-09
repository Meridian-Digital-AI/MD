// Read/append rows on the "Daily Targets" tab of the Meridian Digital
// Leads & Bookings sheet. Used by the prospect-seeding cron.
//
// Tab schema (must match the Apps Script TABS.targets headers):
//   Business | Sector | Location | Phone | Website | Notes | Sent At

import { google, sheets_v4 } from 'googleapis';

const TAB_NAME = 'Daily Targets';

export type TargetRow = {
  business: string;
  sector: string;
  location: string;
  phone: string | null;
  website: string | null;
  notes: string;
};

function getSheetsClient(): sheets_v4.Sheets | null {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!sheetId || !email || !rawKey) return null;
  const auth = new google.auth.JWT({
    email,
    key: rawKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

/**
 * Read all existing target rows. Returns a Set of dedup keys
 * `${business}|${location}` (lowercased) so the seeding job can skip
 * duplicates.
 */
export async function readExistingTargetKeys(): Promise<Set<string>> {
  const sheets = getSheetsClient();
  if (!sheets) return new Set();
  const sheetId = process.env.GOOGLE_SHEET_ID!;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${TAB_NAME}!A2:G`,
  });
  const rows = res.data.values ?? [];
  const keys = new Set<string>();
  for (const r of rows) {
    const business = (r[0] ?? '').toString().trim().toLowerCase();
    const location = (r[2] ?? '').toString().trim().toLowerCase();
    if (business) keys.add(`${business}|${location}`);
  }
  return keys;
}

/**
 * Append target rows. The sheet's "Sent At" column is left blank — the
 * Apps Script daily digest fills it when picking targets to surface.
 */
export async function appendTargetRows(rows: TargetRow[]): Promise<void> {
  if (rows.length === 0) return;
  const sheets = getSheetsClient();
  if (!sheets) throw new Error('Sheets env vars not set.');
  const sheetId = process.env.GOOGLE_SHEET_ID!;

  const values = rows.map((r) => [
    r.business,
    r.sector,
    r.location,
    r.phone ?? '',
    r.website ?? '',
    r.notes,
    '', // Sent At — left blank
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${TAB_NAME}!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values },
  });
}

export function dedupKey(business: string, location: string): string {
  return `${business.trim().toLowerCase()}|${location.trim().toLowerCase()}`;
}
