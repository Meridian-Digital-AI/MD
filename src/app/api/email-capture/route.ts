import { NextRequest, NextResponse } from 'next/server';
import { postToSheet } from '@/lib/sheets-webhook';
import { sendEmail, escapeHtml } from '@/lib/email/resend';
import { siteConfig } from '@/lib/data/config';

/* ── Rate limiting (matches /api/contact: 10 / 15min per IP) ─── */

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (rateLimitMap.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
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

// Static discount code for the welcome offer. If you ever introduce per-user
// codes, swap this for a generator that writes the code to the sheet too.
const WELCOME_DISCOUNT_CODE = 'WELCOME10';

async function sendDiscountEmail(email: string): Promise<void> {
  const html = `
    <p>Hi there,</p>
    <p>Thanks for signing up to Meridian Digital. As promised, here's your <strong>10% off your first month</strong>:</p>
    <p style="font-family:monospace;font-size:18px;background:#f4f4f5;padding:12px 16px;border-radius:8px;display:inline-block;letter-spacing:1px;">
      ${escapeHtml(WELCOME_DISCOUNT_CODE)}
    </p>
    <p>Mention this code when you book a call or reply to this email and we'll apply it to your first invoice.</p>
    <p>If you'd like to see what we build, our case studies are here:<br>
      <a href="${siteConfig.url}/work">${siteConfig.url}/work</a>
    </p>
    <p>Speak soon,<br>The Meridian Digital Team<br>
      <a href="mailto:${escapeHtml(siteConfig.email)}">${escapeHtml(siteConfig.email)}</a> · ${escapeHtml(siteConfig.phone)}
    </p>
  `;

  await sendEmail({
    to: email,
    subject: 'Your 10% off code from Meridian Digital',
    html,
    replyTo: siteConfig.email,
  });
}

async function sendOwnerNotification(email: string, source: string, ip: string): Promise<void> {
  const html = `
    <h2 style="margin:0 0 12px 0;">New email signup</h2>
    <table style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:14px;">
      <tr><td style="padding:4px 12px 4px 0;color:#666;">Email</td><td style="padding:4px 0;"><strong>${escapeHtml(email)}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666;">Source</td><td style="padding:4px 0;">${escapeHtml(source)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666;">IP</td><td style="padding:4px 0;font-family:monospace;">${escapeHtml(ip)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666;">Captured</td><td style="padding:4px 0;">${new Date().toISOString()}</td></tr>
    </table>
    <p style="margin-top:16px;">Discount code <code>${escapeHtml(WELCOME_DISCOUNT_CODE)}</code> auto-emailed to them.</p>
  `;

  await sendEmail({
    to: siteConfig.email,
    subject: `New signup: ${email}`,
    html,
    replyTo: email,
  });
}

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
  const source = typeof body.source === 'string' ? body.source.slice(0, 64) : 'popup';

  if (!email || !EMAIL_REGEX.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: 'Please enter a valid email address.' },
      { status: 400 },
    );
  }

  // Mirror to the sheet (already wired up via service account).
  await postToSheet({
    type: 'email-signup',
    email,
    source,
    capturedAt: new Date().toISOString(),
    ip,
  });

  // Fire-and-forget the two emails so the popup response isn't blocked
  // on Resend latency. Failures log inside sendEmail.
  sendDiscountEmail(email).catch(() => {});
  sendOwnerNotification(email, source, ip).catch(() => {});

  return NextResponse.json({ success: true });
}
