// GET /api/cron/seed-daily-targets
//
// Weekly cron that tops up the "Daily Targets" sheet tab. Searches Google
// Places for ~10 prospects per agency sector in Exeter, dedupes against
// existing rows, appends the new ones. The Apps Script daily digest then
// surfaces 5 of them per morning.
//
// Trigger: Mondays 7am UTC (configured in vercel.json).
// Manual: GET this endpoint with `Authorization: Bearer ${CRON_SECRET}`
//          to seed on demand. Also accepts ?dryRun=1 to fetch without
//          writing — useful for verifying the API key works without
//          polluting the sheet.

import { NextRequest, NextResponse } from 'next/server';
import { searchPlaces, type PlaceResult } from '@/lib/lead-prospecting/places';
import {
  readExistingTargetKeys,
  appendTargetRows,
  dedupKey,
  type TargetRow,
} from '@/lib/lead-prospecting/daily-targets';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Each entry seeds one search query. Tune queries / counts here as Meridian's
// niche evolves. Default city is Exeter; widen to "Devon" or specific
// neighbourhoods later if Exeter dries up.
const SEARCH_PLAN: Array<{ sector: string; query: string; max: number }> = [
  { sector: 'Restaurant',  query: 'restaurant Exeter UK',         max: 10 },
  { sector: 'Takeaway',    query: 'takeaway Exeter UK',           max: 10 },
  { sector: 'Garage',      query: 'MOT centre Exeter UK',         max: 10 },
  { sector: 'Salon',       query: 'hair salon Exeter UK',         max: 10 },
  { sector: 'Cleaning',    query: 'cleaning company Exeter UK',   max: 10 },
  { sector: 'Dry cleaner', query: 'dry cleaner Exeter UK',        max: 5 },
];

export async function GET(request: NextRequest) {
  // Auth: Vercel cron sends Authorization: Bearer ${CRON_SECRET}.
  // For ad-hoc manual runs, the same bearer works.
  const auth = request.headers.get('authorization');
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === '1';

  // Pull all existing dedup keys once — cheap, ~1 read.
  let existingKeys: Set<string>;
  try {
    existingKeys = await readExistingTargetKeys();
  } catch (err) {
    console.error('[seed-targets] sheet read failed', err);
    return NextResponse.json(
      { error: 'sheet_read_failed', message: (err as Error).message },
      { status: 500 },
    );
  }

  const perSector: Record<string, { found: number; new: number; dupes: number; skipped: number }> = {};
  const newRows: TargetRow[] = [];

  for (const { sector, query, max } of SEARCH_PLAN) {
    let places: PlaceResult[] = [];
    try {
      places = await searchPlaces(query, max);
    } catch (err) {
      console.error('[seed-targets] places search failed', { sector, err });
      perSector[sector] = { found: 0, new: 0, dupes: 0, skipped: max };
      continue;
    }

    let added = 0;
    let dupes = 0;
    let skipped = 0;
    for (const p of places) {
      // Skip closed businesses.
      if (p.status && p.status !== 'OPERATIONAL') {
        skipped++;
        continue;
      }
      const key = dedupKey(p.name, p.address);
      if (existingKeys.has(key)) {
        dupes++;
        continue;
      }
      existingKeys.add(key); // dedupe within this run too

      // Build a useful "Notes" field that the digest reader will see.
      const notes = buildNotes(p);

      newRows.push({
        business: p.name,
        sector,
        location: p.address,
        phone: p.phone,
        website: p.website,
        notes,
      });
      added++;
    }
    perSector[sector] = { found: places.length, new: added, dupes, skipped };
  }

  if (!dryRun && newRows.length > 0) {
    try {
      await appendTargetRows(newRows);
    } catch (err) {
      console.error('[seed-targets] sheet write failed', err);
      return NextResponse.json(
        { error: 'sheet_write_failed', message: (err as Error).message, attempted: newRows.length },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    totalNew: newRows.length,
    perSector,
    sample: newRows.slice(0, 3),
  });
}

/**
 * Compose a one-line "Notes" field. Highlights signals that make the
 * prospect a stronger fit — e.g. no website at all, or website looks like
 * a Facebook page (often the cheapest sells).
 */
function buildNotes(p: PlaceResult): string {
  const parts: string[] = [];
  if (!p.website) parts.push('NO WEBSITE — strong fit');
  else if (/facebook\.com|instagram\.com/i.test(p.website)) parts.push('Social-only — strong fit');
  else if (p.website.startsWith('http://')) parts.push('No SSL — likely outdated');
  return parts.join(' · ') || 'Has a website — review it before contacting';
}
