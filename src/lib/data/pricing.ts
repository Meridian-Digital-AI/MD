export interface PricingTier {
  id: string;
  name: string;
  slug: string;
  monthlyPrice: number;
  setupFee: number;
  target: string;
  highlighted: boolean;
  features: string[];
  contractLength: string;
}

export interface WebsiteOnlyTier {
  id: string;
  name: string;
  oneOffPrice: number;
  monthlyHosting: number;
  description: string;
}

export interface AddonPricing {
  id: string;
  name: string;
  flatFee: number;
  minAdSpend: number;
  percentageThreshold: number;
  percentageRate: number;
  description: string;
}

export interface CommitmentPerk {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const pricingTiers: PricingTier[] = [
  {
    id: 'get-started',
    name: 'Get Started',
    slug: 'get-started',
    monthlyPrice: 297,
    setupFee: 497,
    target: 'Sole traders and new businesses',
    highlighted: false,
    features: [
      '5-page templated website',
      'Email welcome sequence',
      'Lead capture form with autoresponder',
      'Simple booking or contact flow',
      'Google Analytics install',
      'Monthly performance email report',
      'Hosting & SSL included',
    ],
    contractLength: '6-month minimum',
  },
  {
    id: 'grow',
    name: 'Grow Your Business',
    slug: 'grow-your-business',
    monthlyPrice: 597,
    setupFee: 997,
    target: 'Established local businesses ready to scale',
    highlighted: true,
    features: [
      'Everything in Get Started, plus:',
      'Up to 10-page custom website design',
      'Multi-step lead nurture campaigns',
      'Re-engagement email automation',
      'Loyalty programme or CRM integration',
      'Lead pipeline dashboard',
      'Blog with SEO optimisation',
      'Speed & SEO optimisation',
      'Bi-weekly 30-minute check-in call',
      'Quarterly strategy review',
    ],
    contractLength: '6-month minimum',
  },
  {
    id: 'full-partner',
    name: 'Full Digital Partner',
    slug: 'full-digital-partner',
    monthlyPrice: 997,
    setupFee: 1997,
    target: 'Growing multi-service businesses',
    highlighted: false,
    features: [
      'Everything in Grow, plus:',
      'Fully custom bespoke website design',
      'Online ordering, booking, or e-commerce',
      'End-to-end process automation',
      'AI chatbot or automated enquiry handling',
      'Custom API integrations (EPOS, accounting, delivery)',
      'Weekly check-in calls',
      'Priority support & response',
      'Dedicated account management',
    ],
    contractLength: '6-month minimum',
  },
];

export const websiteOnlyTiers: WebsiteOnlyTier[] = [
  {
    id: 'starter-site',
    name: 'Starter Site',
    oneOffPrice: 497,
    monthlyHosting: 47,
    description: '3-page website with contact form, mobile responsive, basic SEO setup.',
  },
  {
    id: 'professional-site',
    name: 'Professional Site',
    oneOffPrice: 997,
    monthlyHosting: 47,
    description:
      'Up to 7 pages, custom design, blog section, Google Analytics, speed optimisation.',
  },
  {
    id: 'premium-site',
    name: 'Premium Site',
    oneOffPrice: 1997,
    monthlyHosting: 47,
    description:
      'Fully bespoke design, up to 15 pages, advanced SEO, booking or ordering integration.',
  },
];

export const addonPricing: AddonPricing = {
  id: 'paid-ads',
  name: 'Paid Ads Management',
  flatFee: 247,
  minAdSpend: 300,
  percentageThreshold: 1500,
  percentageRate: 15,
  description:
    'Our marketing specialist manages your Google and Meta ad campaigns, driving targeted local traffic directly to your new website.',
};

export const commitmentPerks: CommitmentPerk[] = [
  {
    id: 'annual',
    name: 'Annual Prepay',
    description: 'Pay annually and get 1 month free.',
    icon: 'Calendar',
  },
  {
    id: 'multi-site',
    name: 'Multi-Site Discount',
    description: 'Additional locations at 50% of your monthly tier rate.',
    icon: 'MapPin',
  },
  {
    id: 'bundle',
    name: 'Bundle & Save',
    description: 'Core tier + paid ads = 10% off combined monthly.',
    icon: 'Package',
  },
  {
    id: 'referral',
    name: 'Referral Reward',
    description: '1 month free for every referral that signs up.',
    icon: 'Users',
  },
];
