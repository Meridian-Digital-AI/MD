import { NextRequest, NextResponse } from 'next/server';
import { postToSheet } from '@/lib/sheets-webhook';

/* ── Rate limiting ────────────────────────────────────────── */

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(ip, recent);
    return true;
  }

  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? '127.0.0.1';
}

/* ── Validation ──────────────────────────────────────────── */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HTML_TAG_REGEX = /<[^>]*>/g;
const MAX_NAME = 100;
const MAX_BUSINESS = 200;

function sanitize(v: string): string {
  return v.replace(HTML_TAG_REGEX, '').trim();
}

interface BookingPayload {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  businessName?: unknown;
  slotISO?: unknown;
  slotDisplay?: unknown;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: 'Too many bookings. Please try again later.' },
      { status: 429 },
    );
  }

  let body: BookingPayload;
  try {
    body = (await request.json()) as BookingPayload;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const businessName = typeof body.businessName === 'string' ? body.businessName.trim() : '';
  const slotISO = typeof body.slotISO === 'string' ? body.slotISO.trim() : '';
  const slotDisplay = typeof body.slotDisplay === 'string' ? body.slotDisplay.trim() : '';

  if (!name || name.length > MAX_NAME) {
    return NextResponse.json({ success: false, error: 'Please provide a valid name.' }, { status: 400 });
  }
  if (!email || !EMAIL_REGEX.test(email) || email.length > 254) {
    return NextResponse.json({ success: false, error: 'Please provide a valid email.' }, { status: 400 });
  }
  if (businessName.length > MAX_BUSINESS) {
    return NextResponse.json({ success: false, error: 'Business name too long.' }, { status: 400 });
  }
  if (!slotISO || Number.isNaN(Date.parse(slotISO))) {
    return NextResponse.json({ success: false, error: 'Please pick a valid slot.' }, { status: 400 });
  }
  if (new Date(slotISO).getTime() <= Date.now()) {
    return NextResponse.json({ success: false, error: 'Slot must be in the future.' }, { status: 400 });
  }

  const record = {
    type: 'booking' as const,
    name: sanitize(name),
    email: sanitize(email),
    phone: sanitize(phone),
    businessName: sanitize(businessName),
    slotISO,
    slotDisplay: sanitize(slotDisplay),
    ip,
    bookedAt: new Date().toISOString(),
  };

  console.log('[booking]', record);

  await postToSheet(record);

  return NextResponse.json({
    success: true,
    message: 'Booking confirmed! We\u2019ll send a confirmation email shortly.',
  });
}
