import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://meridiandigital.co.uk/sitemap.xml', // PLACEHOLDER — replace before launch
  };
}
