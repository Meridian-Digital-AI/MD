import { NextRequest, NextResponse } from 'next/server';
import { postToSheet } from '@/lib/sheets-webhook';
import { sendEmail, escapeHtml } from '@/lib/email/resend';
import { draftLeadReply } from '@/lib/email/lead-drafter';
import { siteConfig } from '@/lib/data/config';

/* ── Rate limiting (matches /api/contact) ─────────────────── */

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
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

  // Fire-and-forget the three follow-up emails.
  sendCustomerConfirmation(record).catch(() => {});
  sendOwnerBookingNotification(record).catch(() => {});
  draftLeadReply({
    name: record.name,
    email: record.email,
    phone: record.phone,
    businessName: record.businessName,
    message: `Booked a discovery call: ${record.slotDisplay}`,
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    message: 'Booking confirmed! We\u2019ll send a confirmation email shortly.',
  });
}

/* \u2500\u2500 Email senders \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

async function sendCustomerConfirmation(record: {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  slotISO: string;
  slotDisplay: string;
}): Promise<void> {
  const calendarLink = buildCalendarLink(record);
  const html = `
    <p>Hi ${escapeHtml(record.name)},</p>
    <p>Your discovery call with Meridian Digital is confirmed for:</p>
    <p style="font-size:16px;background:#f4f4f5;padding:12px 16px;border-radius:8px;display:inline-block;">
      <strong>${escapeHtml(record.slotDisplay)}</strong>
    </p>
    <p>The call is 30 minutes. We'll send you a video link before the meeting.</p>
    <p><a href="${calendarLink}">Add to calendar (Google)</a></p>
    <p>Need to reschedule or have questions? Just reply to this email.</p>
    <p>Speak soon,<br>The Meridian Digital Team<br>
      <a href="mailto:${escapeHtml(siteConfig.email)}">${escapeHtml(siteConfig.email)}</a> \u00b7 ${escapeHtml(siteConfig.phone)}
    </p>
  `;

  await sendEmail({
    to: record.email,
    subject: `Booking confirmed \u2014 ${record.slotDisplay}`,
    html,
    replyTo: siteConfig.email,
  });
}

async function sendOwnerBookingNotification(record: {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  slotISO: string;
  slotDisplay: string;
}): Promise<void> {
  const rows: Array<[string, string]> = [
    ['Name', record.name],
    ['Email', record.email],
    ['Phone', record.phone || '(not given)'],
    ['Business', record.businessName || '(not given)'],
    ['Slot', record.slotDisplay],
  ];
  const html = `
    <h2 style="margin:0 0 12px 0;">New discovery call booked</h2>
    <table style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:14px;">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(k)}</td><td style="padding:4px 0;"><strong>${escapeHtml(v)}</strong></td></tr>`,
        )
        .join('')}
    </table>
    <p style="margin-top:16px;"><a href="${buildCalendarLink(record)}">Add to your calendar</a></p>
  `;

  await sendEmail({
    to: siteConfig.email,
    subject: `New booking: ${record.name} \u2014 ${record.slotDisplay}`,
    html,
    replyTo: record.email,
  });
}

function buildCalendarLink(record: { name: string; businessName: string; slotISO: string }): string {
  // Google Calendar add-event URL. 30-minute slot.
  const start = new Date(record.slotISO);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Meridian Digital discovery call \u2014 ${record.name}${record.businessName ? ` (${record.businessName})` : ''}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: 'Discovery call with Meridian Digital. Video link will be sent separately.',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
