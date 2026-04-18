import { NextRequest, NextResponse } from 'next/server';
import { postToSheet } from '@/lib/sheets-webhook';

export const runtime = 'nodejs';

/* Lightweight session-ping endpoint. Called once per browser session
 * from the client to register that a visitor hit the site. Used for
 * the 48-hour digest "visitors" count. Not a replacement for GA4. */

const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (rateLimitMap.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
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

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: { path?: unknown; referrer?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine
  }

  const path = typeof body.path === 'string' ? body.path.slice(0, 256) : '/';
  const referrer =
    typeof body.referrer === 'string' ? body.referrer.slice(0, 512) : '';
  const userAgent = request.headers.get('user-agent')?.slice(0, 300) ?? '';

  await postToSheet({
    type: 'pageview',
    path,
    referrer,
    userAgent,
    ip,
    visitedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
