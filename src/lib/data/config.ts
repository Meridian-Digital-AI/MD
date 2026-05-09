export interface SiteConfig {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  email: string;
  phone: string;
  address: string;
  workingHours: string;
  foundedYear: number;
  analyticsId: string;
  calBookingUrl: string;
  social: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export const siteConfig: SiteConfig = {
  id: 'meridian-digital',
  name: 'Meridian Digital',
  tagline: 'Websites & automation for local businesses',
  description:
    'We build modern websites with built-in business automation for local businesses in Exeter and Devon. AI-powered delivery, London quality, Exeter prices.',
  url: 'https://meridian-digital-partners.com',
  email: 'wandj@meridian-digital-partners.com',
  phone: '07485 718512',
  address: 'Exeter, Devon',
  workingHours: 'Monday to Friday, 9am–5pm',
  foundedYear: 2026,
  // GA4 Measurement ID is read from NEXT_PUBLIC_GA_MEASUREMENT_ID at build time.
  // If unset (e.g. dev or before launch), GA scripts are not injected — see layout.tsx.
  analyticsId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
  calBookingUrl: 'https://cal.com/meridian-digital/15min', // PLACEHOLDER — replace with your real Cal.com URL
  social: {
    // PLACEHOLDER — replace before launch
    facebook: 'https://facebook.com/meridiandigital',
    instagram: 'https://instagram.com/meridiandigital',
    linkedin: 'https://linkedin.com/company/meridiandigital',
  },
};
