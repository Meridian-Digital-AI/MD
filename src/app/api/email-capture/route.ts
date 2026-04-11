import { NextRequest, NextResponse } from 'next/server';

/* ── Rate limiting ────────────────────────────────────────── */

const RATE_LIMIT_MAX = 10;
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── In-memory capture store (swap for DB / ESP in production) ── */

interface CapturedEmail {
  email: string;
  source: string;
  capturedAt: string;
  ip: string;
}

const captureStore: CapturedEmail[] = [];

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    );
  }

  let body: { email?: unknown; source?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const source =
    typeof body.source === 'string' ? body.source.slice(0, 64) : 'popup';

  if (!email || !EMAIL_REGEX.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: 'Please enter a valid email address.' },
      { status: 400 },
    );
  }

  const record: CapturedEmail = {
    email,
    source,
    capturedAt: new Date().toISOString(),
    ip,
  };

  captureStore.push(record);

  // TODO: Hook into ESP (Mailchimp, Resend, ConvertKit, etc.)
  // For now we just log; replace with real integration before launch.
  console.log('[email-capture]', record);

  return NextResponse.json({ success: true });
}
