import { NextRequest, NextResponse } from 'next/server';
import {
  createContact,
  getDemoLink,
  type BusinessType,
  type ContactSource,
} from '@/lib/data/contacts';
import { siteConfig } from '@/lib/data/config';
import { postToSheet } from '@/lib/sheets-webhook';

/* ── Constants ───────────────────────────────────────────────── */

const VALID_BUSINESS_TYPES: readonly BusinessType[] = [
  'Restaurant / Takeaway',
  'Garage / MOT Centre',
  'Salon / Beauty',
  'Cleaning / Exterior',
  'Dry Cleaning / Laundry',
  'Other',
] as const;

const VALID_SOURCES: readonly ContactSource[] = [
  'website-contact-form',
  'website-sector-page',
  'website-booking',
] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UK_PHONE_REGEX = /^(?:\+44|0)\d{9,10}$/;
const HTML_TAG_REGEX = /<[^>]*>/g;

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/* ── Rate-limit store ────────────────────────────────────────── */

const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];

  // Purge entries older than the window
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(ip, recent);
    return true;
  }

  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

/* ── Helpers ─────────────────────────────────────────────────── */

function sanitize(value: string): string {
  return value.replace(HTML_TAG_REGEX, '').trim();
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? '127.0.0.1';
}

interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  message: string;
  source: string;
  sourcePage?: string;
}

type ValidationResult =
  | {
      valid: true;
      data: {
        name: string;
        email: string;
        phone: string;
        businessName: string;
        businessType: BusinessType;
        message: string;
        source: ContactSource;
        sourcePage?: string;
      };
    }
  | {
      valid: false;
      error: string;
    }

function validate(body: ContactPayload): ValidationResult {
  const { name, email, phone, businessName, businessType, message, source, sourcePage } = body;

  // Name
  if (!name || typeof name !== 'string' || !name.trim()) {
    return { valid: false, error: 'Name is required.' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'Name must be 100 characters or fewer.' };
  }

  // Email
  if (!email || typeof email !== 'string' || !email.trim()) {
    return { valid: false, error: 'Email is required.' };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: 'Please provide a valid email address.' };
  }

  // Phone
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return { valid: false, error: 'Phone number is required.' };
  }
  const normalizedPhone = phone.replace(/\s/g, '');
  if (!UK_PHONE_REGEX.test(normalizedPhone)) {
    return { valid: false, error: 'Please provide a valid UK phone number.' };
  }

  // Business name
  if (!businessName || typeof businessName !== 'string' || !businessName.trim()) {
    return { valid: false, error: 'Business name is required.' };
  }
  if (businessName.length > 200) {
    return { valid: false, error: 'Business name must be 200 characters or fewer.' };
  }

  // Business type
  if (!VALID_BUSINESS_TYPES.includes(businessType as BusinessType)) {
    return { valid: false, error: 'Please select a valid business type.' };
  }

  // Message
  if (!message || typeof message !== 'string' || !message.trim()) {
    return { valid: false, error: 'Message is required.' };
  }
  if (message.length > 2000) {
    return { valid: false, error: 'Message must be 2,000 characters or fewer.' };
  }

  // Source
  if (!VALID_SOURCES.includes(source as ContactSource)) {
    return { valid: false, error: 'Invalid contact source.' };
  }

  return {
    valid: true,
    data: {
      name: sanitize(name),
      email: sanitize(email),
      phone: sanitize(phone),
      businessName: sanitize(businessName),
      businessType: businessType as BusinessType,
      message: sanitize(message),
      source: source as ContactSource,
      ...(sourcePage && typeof sourcePage === 'string'
        ? { sourcePage: sanitize(sourcePage) }
        : {}),
    },
  };
}

/* ── Email placeholders (replace with Resend when API key is available) */

function sendAutoresponder(
  email: string,
  name: string,
  businessType: BusinessType,
): void {
  const demoLink = getDemoLink(businessType);
  const fullDemoUrl = `${siteConfig.url}${demoLink}`;

  console.log('─── AUTORESPONDER EMAIL (placeholder) ───');
  console.log(`To: ${email}`);
  console.log('Subject: Thanks for contacting Meridian Digital');
  console.log(`
Hi ${name},

Thanks for getting in touch with Meridian Digital! We've received your message and will get back to you within 2 hours during working hours (${siteConfig.workingHours}).

In the meantime, you might like to see what we've built for businesses like yours:
${fullDemoUrl}

Speak soon,
The Meridian Digital Team
${siteConfig.email} | ${siteConfig.phone}
  `.trim());
  console.log('──────────────────────────────────────────');
}

function sendOwnerNotification(
  data: {
    name: string;
    email: string;
    phone: string;
    businessName: string;
    businessType: BusinessType;
    message: string;
    source: ContactSource;
    sourcePage?: string;
  },
): void {
  const timestamp = new Date().toISOString();

  console.log('─── OWNER NOTIFICATION EMAIL (placeholder) ───');
  console.log(`To: ${siteConfig.email}`);
  console.log(`Subject: New enquiry from ${data.name} — ${data.businessType}`);
  console.log(`
New contact form submission:

Name:          ${data.name}
Email:         ${data.email}
Phone:         ${data.phone}
Business:      ${data.businessName}
Type:          ${data.businessType}
Source:        ${data.source}
Source Page:   ${data.sourcePage ?? '(not set)'}
Submitted:     ${timestamp}

Message:
${data.message}
  `.trim());
  console.log('──────────────────────────────────────────────');
}

/* ── POST handler ────────────────────────────────────────────── */

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many submissions. Please try again later.',
        },
        { status: 429 },
      );
    }

    // Parse body
    let body: ContactPayload;
    try {
      body = (await request.json()) as ContactPayload;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body.' },
        { status: 400 },
      );
    }

    // Validate
    const result = validate(body);
    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    // Create contact record
    const contact = createContact(result.data);

    // Send emails (placeholder — logs to console)
    sendAutoresponder(result.data.email, result.data.name, result.data.businessType);
    sendOwnerNotification(result.data);

    // Mirror to the Google Sheet / trigger 48h digest pipeline.
    await postToSheet({
      type: 'contact',
      contactId: contact.id,
      name: result.data.name,
      email: result.data.email,
      phone: result.data.phone,
      businessName: result.data.businessName,
      businessType: result.data.businessType,
      message: result.data.message,
      source: result.data.source,
      sourcePage: result.data.sourcePage ?? '',
      ip,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          'Thank you for getting in touch! We\'ll get back to you within 2 hours during working hours.',
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    console.error('Contact form error:', message);

    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again later.' },
      { status: 500 },
    );
  }
}
