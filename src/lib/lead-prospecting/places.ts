// Google Places API (New) wrapper for prospect discovery.
//
// Required env: GOOGLE_PLACES_API_KEY
// Get one at: https://console.cloud.google.com/apis/credentials → enable
// "Places API (New)". Generous free tier (~$200/month credit covers
// thousands of Text Search calls).

const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';

const FIELD_MASK = [
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.websiteUri',
  'places.businessStatus',
  'places.types',
].join(',');

export type PlaceResult = {
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  status: string | null;
  types: string[];
};

export async function searchPlaces(
  textQuery: string,
  maxResults = 10,
): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY not set.');

  const res = await fetch(PLACES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery,
      maxResultCount: Math.min(maxResults, 20), // API caps single page at 20
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Places API ${res.status}: ${json?.error?.message || 'unknown'}`);
  }

  const places = (json.places ?? []) as Array<{
    displayName?: { text?: string };
    formattedAddress?: string;
    nationalPhoneNumber?: string;
    websiteUri?: string;
    businessStatus?: string;
    types?: string[];
  }>;

  return places.map((p) => ({
    name: p.displayName?.text?.trim() ?? '',
    address: p.formattedAddress?.trim() ?? '',
    phone: p.nationalPhoneNumber?.trim() ?? null,
    website: p.websiteUri?.trim() ?? null,
    status: p.businessStatus ?? null,
    types: p.types ?? [],
  })).filter((p) => p.name);
}
