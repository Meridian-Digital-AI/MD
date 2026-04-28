// Thin Resend wrapper. If RESEND_API_KEY is missing we no-op so dev environments
// (and the very first deploy before the user signs up for Resend) don't crash.

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

const FROM = process.env.RESEND_FROM || 'Meridian Digital <noreply@meridian-digital-partners.com>';

export async function sendEmail({ to, subject, html, replyTo }: SendEmailArgs): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // No key — log and skip so the lead capture endpoint still succeeds.
    console.warn('[resend] RESEND_API_KEY missing, skipping email to', to);
    return { ok: true, skipped: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[resend] failed', res.status, text);
      return { ok: false, error: `${res.status}: ${text.slice(0, 200)}` };
    }
    const json = (await res.json()) as { id?: string };
    return { ok: true, id: json.id };
  } catch (err) {
    console.error('[resend] threw', err);
    return { ok: false, error: (err as Error).message };
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
