/**
 * Posts a record to the Google Apps Script webhook backing the
 * "Meridian Digital — Leads & Bookings" sheet.
 *
 * Fire-and-forget: never throws, never blocks the user response.
 * If the webhook env vars are missing or the request fails, we log
 * and return so the primary flow (email capture / contact / booking)
 * still succeeds for the visitor.
 */

export type SheetRecordType = 'booking' | 'email-signup' | 'contact' | 'pageview';

export interface SheetRecord {
  type: SheetRecordType;
  // Arbitrary payload — the Apps Script side knows how to map these
  // onto the correct sheet tab based on `type`.
  [key: string]: unknown;
}

export async function postToSheet(record: SheetRecord): Promise<void> {
  const url = process.env.SHEETS_WEBHOOK_URL;
  const secret = process.env.SHEETS_WEBHOOK_SECRET;

  if (!url || !secret) {
    console.warn('[sheets-webhook] SHEETS_WEBHOOK_URL / SHEETS_WEBHOOK_SECRET not set — skipping');
    return;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, ...record, receivedAt: new Date().toISOString() }),
      // Apps Script web apps redirect on POST; allow it.
      redirect: 'follow',
    });

    if (!res.ok) {
      console.error('[sheets-webhook] non-OK response', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.error('[sheets-webhook] post failed', err);
  }
}
