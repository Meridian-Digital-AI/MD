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
  email: 'hello@meridian-digital-partners.com',
  phone: '07498 588299',
  address: 'Exeter, Devon',
  workingHours: 'Monday to Friday, 9am–5pm',
  foundedYear: 2026,
  analyticsId: 'G-XXXXXXXXXX', // PLACEHOLDER — replace before launch
  social: {
    // PLACEHOLDER — replace before launch
    facebook: 'https://facebook.com/meridiandigital',
    instagram: 'https://instagram.com/meridiandigital',
    linkedin: 'https://linkedin.com/company/meridiandigital',
  },
};
