/**
 * AI-drafted lead-reply assistant.
 *
 * After someone submits the contact form (or signs up via the popup),
 * we fire a Claude call in the background that:
 *   1. Tries to scrape the lead's likely website (the email domain).
 *   2. Drafts a personalised follow-up reply.
 *   3. Emails the draft to the owner inbox so we can review/edit/forward.
 *
 * Hallucinations are a real risk — the email subject line + body both
 * tell the reader to verify any factual claims before sending. We never
 * send AI output directly to the lead.
 */

import Anthropic from '@anthropic-ai/sdk';
import { sendEmail, escapeHtml } from './resend';
import { siteConfig } from '@/lib/data/config';

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk',
  'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'live.com',
  'icloud.com', 'me.com', 'aol.com', 'btinternet.com',
  'sky.com', 'virginmedia.com', 'tiscali.co.uk', 'protonmail.com',
]);

const SCRAPE_TIMEOUT_MS = 5000;
const MAX_SCRAPE_BYTES = 200_000;

export type LeadContext = {
  name?: string;
  email: string;
  phone?: string;
  businessName?: string;
  businessType?: string;
  message?: string;
  sourcePage?: string;
};

/**
 * Public entry point. Drafts a personalised reply and emails it to
 * the owner inbox. Never throws — errors are logged and swallowed
 * because this runs fire-and-forget after the user-facing response
 * has already returned.
 */
export async function draftLeadReply(lead: LeadContext): Promise<void> {
  console.log('[lead-drafter] start', { email: lead.email, hasKey: !!process.env.ANTHROPIC_API_KEY });
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[lead-drafter] ANTHROPIC_API_KEY missing — skipping');
    return;
  }

  try {
    const websiteHint = await scrapeBusinessWebsite(lead.email);
    console.log('[lead-drafter] scrape done', websiteHint ? `got ${websiteHint.url}` : 'no scrape');
    const draft = await generateDraft(lead, websiteHint);
    console.log('[lead-drafter] claude done', `${draft.length} chars`);
    await emailDraft(lead, draft, websiteHint);
    console.log('[lead-drafter] sent draft email for', lead.email);
  } catch (err) {
    console.error('[lead-drafter] failed', { email: lead.email, error: (err as Error)?.message, stack: (err as Error)?.stack });
  }
}

/* ── Website scrape ─────────────────────────────────────────── */

type WebsiteHint = {
  url: string;
  title: string;
  description: string;
  excerpt: string;
} | null;

async function scrapeBusinessWebsite(emailAddress: string): Promise<WebsiteHint> {
  const domain = emailAddress.split('@')[1]?.toLowerCase().trim();
  if (!domain || FREE_EMAIL_DOMAINS.has(domain)) return null;

  const url = `https://${domain}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'MeridianDigitalLeadResearchBot/1.0' },
    });
    clearTimeout(timeout);
    if (!res.ok) return { url, title: '', description: '', excerpt: '' };

    const reader = res.body?.getReader();
    if (!reader) return { url, title: '', description: '', excerpt: '' };
    const decoder = new TextDecoder();
    let html = '';
    let bytes = 0;
    while (bytes < MAX_SCRAPE_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel().catch(() => {});

    const title = match(html, /<title[^>]*>([^<]*)<\/title>/i);
    const description =
      match(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
      match(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    const excerpt = stripHtml(html).slice(0, 1500);

    return { url, title, description, excerpt };
  } catch {
    return null;
  }
}

function match(haystack: string, re: RegExp): string {
  const m = haystack.match(re);
  return m ? m[1].trim() : '';
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ── Claude call ────────────────────────────────────────────── */

const SYSTEM_PROMPT = `You are an email-drafting assistant for Meridian Digital, a small Exeter-based digital agency that builds Next.js websites and business automation for local businesses (restaurants, garages, salons, cleaners, dry cleaners).

Your job: read what a lead has told us, plus any context we found from their website, and draft a warm, specific, useful reply that the agency owner (Will or Joe) can review, lightly edit, and send.

Rules:
- The reply is FROM Will or Joe at Meridian Digital, TO the lead. Write it in the voice of a small UK agency owner — friendly, plain English, under 200 words.
- Acknowledge what they actually said. Reference one specific detail from their message or their website.
- Suggest one concrete next step (a 15-min call, or a question that moves the conversation forward).
- Do NOT make up facts about the lead's business. If the website scrape is empty or we have no info beyond their name, keep the reply general but still specific to what they wrote.
- Do NOT promise specific deliverables or prices. The owner will negotiate that on the call.
- Sign off with "Will" (the owner reviewing this draft).
- Output JUST the email body — no subject line, no preamble like "Here's a draft:", no markdown formatting.`;

async function generateDraft(lead: LeadContext, website: WebsiteHint): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const websiteBlock = website
    ? `Website (scraped from their email domain: ${website.url}):
- Title: ${website.title || '(none)'}
- Meta description: ${website.description || '(none)'}
- Visible text excerpt (first 1500 chars):
${website.excerpt || '(empty)'}`
    : '(No business website to scan — they used a free email or the domain didn\'t respond.)';

  const userBlock = `Lead details:
- Name: ${lead.name || '(unknown)'}
- Email: ${lead.email}
- Phone: ${lead.phone || '(not given)'}
- Business name: ${lead.businessName || '(not given)'}
- Business type: ${lead.businessType || '(not given)'}
- Source page on our site: ${lead.sourcePage || '(unknown)'}

What they wrote to us:
${lead.message ? `"${lead.message}"` : '(They only signed up to the discount popup — no message.)'}

${websiteBlock}

Draft the reply now.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: [
      { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: userBlock }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock && textBlock.type === 'text' ? textBlock.text.trim() : '';
}

/* ── Send the draft to the owner inbox ──────────────────────── */

async function emailDraft(
  lead: LeadContext,
  draft: string,
  website: WebsiteHint,
): Promise<void> {
  if (!draft) return;

  const who = lead.businessName ? `${lead.name || 'a lead'} at ${lead.businessName}` : (lead.name || lead.email);
  const subject = `Draft reply for ${who}`;

  const websiteNote = website
    ? `<p style="font-size:12px;color:#666;">Website scanned: <a href="${escapeHtml(website.url)}">${escapeHtml(website.url)}</a> — title "${escapeHtml(website.title || '(empty)')}".</p>`
    : `<p style="font-size:12px;color:#666;">No business website was scanned (free-email domain, or site didn't respond).</p>`;

  const html = `
    <p style="font-size:13px;color:#666;margin:0 0 4px 0;">AI-drafted suggestion. <strong>Verify any factual claims before sending.</strong></p>
    <p style="font-size:13px;color:#666;margin:0 0 16px 0;">Lead: <strong>${escapeHtml(lead.name || lead.email)}</strong> — ${escapeHtml(lead.email)}${lead.phone ? ` — ${escapeHtml(lead.phone)}` : ''}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px 0;">
    <div style="white-space:pre-wrap;font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;">${escapeHtml(draft)}</div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
    ${websiteNote}
  `;

  await sendEmail({
    to: siteConfig.email,
    subject,
    html,
    replyTo: lead.email,
  });
}
