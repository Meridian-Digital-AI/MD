export interface Demo {
  id: string;
  name: string;
  businessType: string;
  slug: string;
  description: string;
  features: string[];
  designNotes: string;
  gradientFrom: string;
  gradientTo: string;
  demoUrl: string; // PLACEHOLDER — replace before launch
  screenshotAlt: string;
}

export const demos: Demo[] = [
  {
    id: 'oriental-city',
    name: 'Oriental City',
    businessType: 'Chinese Takeaway & Restaurant',
    slug: 'oriental-city',
    description:
      'A complete direct ordering system that replaces marketplace dependency with customer ownership, loyalty, and automated marketing.',
    features: [
      'Full online ordering with cart and checkout',
      'Categorised menu with dietary filters',
      'Loyalty programme with points-per-pound',
      'Customer referral system with tracking',
      'Marketing automation suite (8 campaigns)',
      'Live order status tracking',
      'Google review collection automation',
      'Admin dashboard with revenue analytics',
    ],
    designNotes: 'Warm reds and golds, Asian cuisine aesthetic',
    gradientFrom: '#991B1B',
    gradientTo: '#D97706',
    demoUrl: '/work#oriental-city', // TODO: Replace with deployed Vercel URL once live
    screenshotAlt: 'Oriental City takeaway ordering website showing menu and checkout flow',
  },
  {
    id: 'parkside-garage',
    name: 'Parkside Garage',
    businessType: 'MOT Centre & Car Repairs',
    slug: 'parkside-garage',
    description:
      'An online booking and MOT reminder system that fills the diary automatically and builds lasting customer relationships.',
    features: [
      'Multi-step online booking with slot management',
      'Automated MOT reminder engine (3-stage sequence)',
      'Customer vehicle portal with service history',
      'Post-service Google review automation',
      'Admin dashboard with bookings calendar',
      'Full marketing automation (6 campaigns)',
      'Ad campaign management system',
      'Referral programme with tracking',
    ],
    designNotes: 'Deep navy, white, amber — trustworthy and established',
    gradientFrom: '#0F1B2D',
    gradientTo: '#D97706',
    demoUrl: '/work#parkside-garage', // TODO: Replace with deployed Vercel URL once live
    screenshotAlt: 'Parkside Garage website showing MOT booking system and reminder dashboard',
  },
];
