import type { Metadata } from 'next';
import { siteConfig } from '@/lib/data/config';

export const metadata: Metadata = {
  title: 'Privacy Policy | Meridian Digital',
  description:
    'How Meridian Digital collects, uses, stores, and protects your personal data — including data accessed via Meta Marketing API, Google Ads API, and Google Analytics.',
};

const LAST_UPDATED = '30 April 2026';

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10">
        <p className="text-sm uppercase tracking-wide text-slate-500">Legal</p>
        <h1 className="mt-2 text-4xl font-semibold text-[var(--color-navy-900)]">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
      </header>

      <div className="prose prose-slate max-w-none text-slate-700">
        <p>
          {siteConfig.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a digital agency based in {siteConfig.address}.
          This policy explains what personal data we collect, why we collect it, how we use it,
          and the rights you have over it. If anything is unclear, email us at{' '}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
        </p>

        <h2>1. Who is the data controller?</h2>
        <p>
          {siteConfig.name}, contactable at{' '}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>. For UK GDPR and the Data
          Protection Act 2018, we are the controller of personal data described in this policy.
        </p>

        <h2>2. What data we collect</h2>
        <ul>
          <li>
            <strong>Contact &amp; account data</strong> — name, email address, phone number,
            company name, and login credentials when you sign up to the Meridian dashboard or
            contact us through the website.
          </li>
          <li>
            <strong>Lead data</strong> — when one of our client websites captures a form
            submission, we store the submitter&rsquo;s name, email, phone number, and message on
            behalf of that client.
          </li>
          <li>
            <strong>Usage data</strong> — pages visited, referrer, country (derived from IP),
            browser user-agent, and timestamps. We do not store full IP addresses.
          </li>
          <li>
            <strong>Advertising &amp; analytics data</strong> — when authorised by the account
            owner, we read campaign performance data (spend, impressions, clicks, conversions)
            from Meta Marketing API, Google Ads API, and Google Analytics 4. We do not write or
            modify ads without explicit authorisation.
          </li>
          <li>
            <strong>OAuth tokens</strong> — when you connect a Meta, Google Ads, or Google
            Analytics account, we store the access and refresh tokens issued by those platforms
            so we can read campaign data on your behalf. Tokens are stored server-side with
            row-level access controls and are never exposed to other clients.
          </li>
        </ul>

        <h2>3. Why we use it (lawful basis)</h2>
        <ul>
          <li>
            <strong>Contract</strong> — we process account data, lead data, and connected-platform
            data to deliver the services you have engaged us for.
          </li>
          <li>
            <strong>Legitimate interest</strong> — to monitor service health, detect abuse,
            improve the product, and respond to support enquiries.
          </li>
          <li>
            <strong>Consent</strong> — for marketing emails (you can withdraw at any time) and
            for non-essential cookies.
          </li>
          <li>
            <strong>Legal obligation</strong> — to keep records required by HMRC and applicable
            UK law.
          </li>
        </ul>

        <h2>4. Third parties we share data with</h2>
        <p>
          We use the following processors, each bound by data-processing agreements:
        </p>
        <ul>
          <li><strong>Supabase</strong> (US/EU) — hosts our Postgres database and authentication.</li>
          <li><strong>Vercel</strong> (US/EU) — hosts the website and dashboard.</li>
          <li><strong>Resend</strong> (US/EU) — sends transactional and lead-notification emails.</li>
          <li><strong>Meta Platforms Inc.</strong> — when you authorise a Meta Marketing API connection.</li>
          <li><strong>Google LLC</strong> — when you authorise Google Ads or Google Analytics connections.</li>
          <li><strong>Stripe</strong> (US) — only if and when we use it for billing.</li>
        </ul>
        <p>
          We do not sell personal data and we do not share it with advertising networks.
        </p>

        <h2>5. International transfers</h2>
        <p>
          Some processors are located outside the UK and EEA. Where transfers occur, we rely on
          UK International Data Transfer Agreements and the EU Standard Contractual Clauses to
          provide an adequate level of protection.
        </p>

        <h2>6. Retention</h2>
        <ul>
          <li>Account data: retained while your account is active and for up to 6 years after closure for tax/legal records.</li>
          <li>Lead data: retained until the client (lead owner) deletes it or terminates the engagement.</li>
          <li>Pageview data: 24 months, after which it is aggregated and anonymised.</li>
          <li>OAuth tokens: until you disconnect the integration, after which they are immediately deleted.</li>
        </ul>

        <h2>7. Your rights</h2>
        <p>Under UK GDPR you have the right to:</p>
        <ul>
          <li>Access a copy of your personal data.</li>
          <li>Correct inaccurate data.</li>
          <li>Delete your data (see <a href="/data-deletion">Data Deletion</a>).</li>
          <li>Restrict or object to processing.</li>
          <li>Receive your data in a portable format.</li>
          <li>Withdraw consent at any time where processing is based on consent.</li>
          <li>Lodge a complaint with the UK Information Commissioner&rsquo;s Office (ICO).</li>
        </ul>
        <p>
          To exercise any of these rights, email{' '}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>. We will respond within 30
          days.
        </p>

        <h2>8. Cookies</h2>
        <p>
          We use essential cookies for authentication and session management, and (with your
          consent) analytics cookies to understand how the site is used. You can change cookie
          preferences via the banner at the bottom of any page or by clearing your browser
          cookies for this domain.
        </p>

        <h2>9. Security</h2>
        <p>
          Data is encrypted in transit (TLS 1.2+) and at rest. Database access is gated by
          row-level security policies. Privileged operations require authenticated admin
          sessions. We follow industry standard practice for credential storage and rotation.
        </p>

        <h2>10. Children</h2>
        <p>
          Our services are intended for businesses. We do not knowingly collect data from anyone
          under the age of 16.
        </p>

        <h2>11. Changes to this policy</h2>
        <p>
          We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the
          top of this page reflects the most recent revision. Material changes will be
          communicated by email to active account holders.
        </p>

        <h2>12. Contact</h2>
        <p>
          {siteConfig.name}<br />
          {siteConfig.address}<br />
          Email: <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
        </p>
      </div>
    </article>
  );
}
