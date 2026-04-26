import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Meridian Digital',
    short_name: 'Meridian',
    description: 'Websites & automation for local businesses in Exeter and Devon',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B1120',
    theme_color: '#2563EB',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
