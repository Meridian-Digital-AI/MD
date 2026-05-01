import type { Metadata } from 'next';
import { Sora, Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import SiteChrome from '@/components/SiteChrome';
import CookieConsent from '@/components/CookieConsent';
import EmailCapturePopup from '@/components/EmailCapturePopup';
import PageviewTracker from '@/components/PageviewTracker';
import { siteConfig } from '@/lib/data/config';

const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sora',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Meridian Digital | Websites & Automation for Local Businesses in Exeter',
  description:
    'We build modern websites with built-in email sequences, booking systems, loyalty programmes, and AI — so your business grows on autopilot. Based in Exeter, Devon.',
  keywords: [
    'web design Exeter',
    'business automation Devon',
    'local business websites',
    'restaurant ordering system',
    'MOT booking system',
    'salon booking website',
    'Next.js agency Exeter',
    'email automation',
    'loyalty programme',
    'Meridian Digital',
  ],
  openGraph: {
    title: 'Meridian Digital | Websites & Automation for Local Businesses in Exeter',
    description:
      'We build modern websites with built-in email sequences, booking systems, loyalty programmes, and AI — so your business grows on autopilot. Based in Exeter, Devon.',
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: 'en_GB',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: siteConfig.name,
  url: siteConfig.url,
  email: siteConfig.email,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Exeter',
    addressRegion: 'Devon',
    addressCountry: 'GB',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-inter">
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <SiteChrome>{children}</SiteChrome>
        <CookieConsent />
        <EmailCapturePopup />
        <PageviewTracker />

        {/* Google Analytics — replace analyticsId in config before launch */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${siteConfig.analyticsId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${siteConfig.analyticsId}');
          `}
        </Script>
      </body>
    </html>
  );
}
