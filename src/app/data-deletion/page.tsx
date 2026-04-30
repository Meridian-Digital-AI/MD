import type { Metadata } from 'next';
import { siteConfig } from '@/lib/data/config';

export const metadata: Metadata = {
  title: 'Data Deletion | Meridian Digital',
  description:
    'How to request deletion of your personal data from Meridian Digital, including data collected via Meta, Google Ads, or Google Analytics integrations.',
};

const LAST_UPDATED = '30 April 2026';

export default function DataDeletionPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10">
        <p className="text-sm uppercase tracking-wide text-slate-500">Legal</p>
        <h1 className="mt-2 text-4xl font-semibold text-[var(--color-navy-900)]">
          Data Deletion Instructions
        </h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
      </header>

      <div className="prose prose-slate max-w-none text-slate-700">
        <p>
          {siteConfig.name} respects your right to delete personal data we hold about you. This
          page explains how to request deletion and what we will do.
        </p>

        <h2>1. If you connected a Meta or Google account</h2>
        <p>
          You can revoke our access at any time directly with the platform:
        </p>
        <ul>
          <li>
            <strong>Meta / Facebook</strong> — visit{' '}
            <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank" rel="noopener noreferrer">
              facebook.com/settings → Business Integrations
            </a>{' '}
            and remove &ldquo;Meridian Ads Builder&rdquo; (or whichever Meridian app is listed).
          </li>
          <li>
            <strong>Google</strong> — visit{' '}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">
              myaccount.google.com/permissions
            </a>{' '}
            and remove access for {siteConfig.name}.
          </li>
        </ul>
        <p>
          When access is revoked, the access and refresh tokens we hold for your account become
          immediately useless. We additionally delete the stored token from our database within
          7 days of detecting the revocation.
        </p>

        <h2>2. To delete all data we hold about you</h2>
        <p>
          Email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> from the email
          address associated with your account, with the subject line &ldquo;Data deletion
          request&rdquo;. Include in the body:
        </p>
        <ul>
          <li>The full name on the account.</li>
          <li>The email address used to register.</li>
          <li>(If applicable) the business or client account name.</li>
        </ul>
        <p>
          We will:
        </p>
        <ul>
          <li>Acknowledge receipt within 3 business days.</li>
          <li>Verify your identity (we may ask one or two follow-up questions).</li>
          <li>
            Delete the data within 30 days, unless we are legally required to retain specific
            records (e.g. invoices for tax purposes, kept for up to 6 years).
          </li>
          <li>Confirm completion by email.</li>
        </ul>

        <h2>3. What gets deleted</h2>
        <ul>
          <li>Your user account and authentication credentials.</li>
          <li>Any leads, pageviews, and dashboard data attributed to your account.</li>
          <li>OAuth tokens for any platform integrations you authorised.</li>
          <li>Email subscription records.</li>
        </ul>

        <h2>4. What we may retain</h2>
        <ul>
          <li>
            Records required by HMRC and UK law for accounting, tax, and anti-fraud purposes
            (typically 6 years).
          </li>
          <li>
            Aggregated, anonymised analytics that cannot be linked back to you.
          </li>
        </ul>

        <h2>5. Questions</h2>
        <p>
          If you are not sure what data we hold, email{' '}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> and ask for a Subject
          Access Request. We will provide a copy of your data within 30 days.
        </p>

        <h2>6. Complaints</h2>
        <p>
          If you are unhappy with how we handle your request, you have the right to complain to
          the UK Information Commissioner&rsquo;s Office at{' '}
          <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer">
            ico.org.uk/make-a-complaint
          </a>.
        </p>
      </div>
    </article>
  );
}
