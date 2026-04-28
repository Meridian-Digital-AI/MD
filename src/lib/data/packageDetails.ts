// Detailed breakdown of what's actually built and automated for each
// managed tier. Drives the per-tier subpages at /services/[slug].
//
// `slug` here matches the `slug` on the corresponding PricingTier so the
// pricing card can deep-link to the right page.

export type AutomationCategory = {
  id: string;
  title: string;
  icon: string; // lucide-react icon name
  intro: string;
  items: string[];
};

export type PackageDetail = {
  slug: string;
  tagline: string;
  whoItsFor: string;
  buildTime: string;
  categories: AutomationCategory[];
  notIncluded: string[];
  upgradePath?: { name: string; href: string };
};

export const packageDetails: PackageDetail[] = [
  // ────────────────────────────────────────────────────────────
  // GET STARTED — £297/mo
  // ────────────────────────────────────────────────────────────
  {
    slug: 'get-started',
    tagline:
      'Everything a sole trader or new business needs to look professional online and never miss a lead — without paying for features you won\u2019t use yet.',
    whoItsFor:
      'Sole traders, new businesses, and side-hustles that need a credible web presence and a reliable way to capture enquiries.',
    buildTime: '2 weeks from kick-off to launch',
    categories: [
      {
        id: 'site',
        title: 'Your website',
        icon: 'Globe',
        intro: 'A clean, fast, mobile-first site you can be proud to share.',
        items: [
          '5-page templated website built on a modern, fast framework',
          'Mobile and tablet responsive out of the box',
          'Branded with your colours, logo, photography and copy',
          'Hosting, SSL certificate and CDN included',
          'Daily off-site backups and automatic security patching',
          'Uptime monitoring \u2014 we get alerted if your site goes down',
        ],
      },
      {
        id: 'leads',
        title: 'Lead capture & alerts',
        icon: 'Mail',
        intro:
          'Every enquiry is captured, logged and pushed to you instantly so nothing slips through the cracks.',
        items: [
          'Branded contact / quote form on the website',
          'Spam and bot protection (honeypot + rate limiting)',
          'Instant email alert to you the moment a lead lands',
          'Auto-acknowledgement email to the customer within seconds',
          'Source and UTM tracking so you know where each lead came from',
        ],
      },
      {
        id: 'first-response',
        title: 'First-response automation',
        icon: 'Zap',
        intro:
          'A simple welcome sequence so every prospect gets a warm reply, even if you\u2019re busy on the tools.',
        items: [
          'Welcome / introduction email sequence (up to 3 messages)',
          'Branded email templates matched to your website',
          'One-click unsubscribe and full GDPR compliance',
        ],
      },
      {
        id: 'booking',
        title: 'Simple booking or contact flow',
        icon: 'Calendar',
        intro: 'A frictionless way for customers to take the next step.',
        items: [
          'Single booking or contact widget on the site',
          'Calendar link (Google or Outlook) or email forwarding',
          'Automatic confirmation email with the appointment details',
          'One reminder email before the appointment to reduce no-shows',
        ],
      },
      {
        id: 'reporting',
        title: 'Reporting',
        icon: 'BarChart3',
        intro: 'You\u2019ll always know whether the site is working for you.',
        items: [
          'Google Analytics installed and verified',
          'Monthly performance email: visits, leads, top pages and search terms',
        ],
      },
    ],
    notIncluded: [
      'Multi-step nurture campaigns and re-engagement journeys',
      'Loyalty programme or CRM integration',
      'Live lead pipeline dashboard',
      'Blog with SEO content',
      'Bi-weekly strategy calls',
    ],
    upgradePath: {
      name: 'Grow Your Business',
      href: '/services/grow-your-business',
    },
  },

  // ────────────────────────────────────────────────────────────
  // GROW YOUR BUSINESS — £597/mo
  // ────────────────────────────────────────────────────────────
  {
    slug: 'grow-your-business',
    tagline:
      'A bigger website plus the marketing automation that turns one-off enquiries into repeat customers and Google reviews.',
    whoItsFor:
      'Established local businesses with steady demand who want to scale enquiries, retain customers and stop relying on word-of-mouth alone.',
    buildTime: '3 weeks from kick-off to launch',
    categories: [
      {
        id: 'site',
        title: 'Your website',
        icon: 'Globe',
        intro:
          'Custom-designed website built around your services and your customers\u2019 most common questions.',
        items: [
          'Up to 10-page custom-designed website',
          'Multiple service / location pages, optimised for local search',
          'Speed and Core Web Vitals optimisation',
          'Technical and on-page SEO setup',
          'Blog with monthly SEO-optimised content (we write or guide)',
          'Everything from Get Started: hosting, SSL, backups, uptime monitoring',
        ],
      },
      {
        id: 'leads',
        title: 'Lead capture & qualification',
        icon: 'Mail',
        intro:
          'Capture more leads, route them to the right person, and know which marketing actually works.',
        items: [
          'Multiple forms and landing pages (one per service or campaign)',
          'Full source / UTM attribution per lead',
          'Round-robin assignment if you have more than one team member',
          'Instant email + SMS alerts on new high-value leads (optional)',
        ],
      },
      {
        id: 'nurture',
        title: 'Multi-step nurture & re-engagement',
        icon: 'Send',
        intro:
          'Most leads aren\u2019t ready to buy on day one. We keep you in front of them automatically.',
        items: [
          '5\u20137 email drip sequence over the first two weeks',
          'Quote / booking abandonment reminders',
          'Re-engagement campaigns for leads quiet for 60 or 90 days',
          'Branded email templates matched to your website',
        ],
      },
      {
        id: 'booking',
        title: 'Booking & reminders',
        icon: 'Calendar',
        intro: 'Fewer no-shows, more rebookings, less manual admin.',
        items: [
          'Multi-step online booking with Google or Outlook calendar sync',
          'Automatic confirmation + ICS calendar attachment',
          'Reminders 48h, 24h and 1h before appointment via email and/or SMS',
          'Post-appointment follow-up: thank-you, review request and rebook nudge',
          'Recurring service reminders (MOT, dental, hairdressing, etc.)',
        ],
      },
      {
        id: 'reviews',
        title: 'Reviews & reputation',
        icon: 'Star',
        intro: 'Turn happy customers into Google reviews on autopilot.',
        items: [
          'Automatic Google review request after each completed appointment',
          'Happy / unhappy splitter \u2014 unhappy feedback stays private so you can fix issues before they become public',
          'Weekly review-monitoring digest emailed to you',
        ],
      },
      {
        id: 'loyalty',
        title: 'Retention & loyalty',
        icon: 'Heart',
        intro: 'Make existing customers come back more often.',
        items: [
          'Birthday and anniversary emails with offer codes',
          'Points-based loyalty programme OR CRM integration (your choice)',
          'Monthly newsletter / campaign send',
          'Customer segmentation by spend, frequency and service type',
        ],
      },
      {
        id: 'reporting',
        title: 'Live dashboard & strategy',
        icon: 'BarChart3',
        intro:
          'Stop guessing. Real numbers, in plain English, every fortnight.',
        items: [
          'Live lead pipeline dashboard you can log into any time',
          'Bi-weekly 30-minute check-in call with your account lead',
          'Quarterly strategy review and roadmap update',
          'Monthly performance email with leads, traffic and key wins',
        ],
      },
    ],
    notIncluded: [
      'Fully bespoke design and online ordering / e-commerce',
      'End-to-end process automation across your back-office tools',
      'AI chatbot or automated enquiry handling',
      'Custom API integrations (EPOS, accounting, delivery platforms)',
      'Weekly check-in calls and dedicated account management',
    ],
    upgradePath: {
      name: 'Full Digital Partner',
      href: '/services/full-digital-partner',
    },
  },

  // ────────────────────────────────────────────────────────────
  // FULL DIGITAL PARTNER — £997/mo
  // ────────────────────────────────────────────────────────────
  {
    slug: 'full-digital-partner',
    tagline:
      'A fully bespoke digital operation \u2014 your website, automation, AI and back-office tools all running as one connected system.',
    whoItsFor:
      'Growing multi-service or multi-location businesses ready to remove manual admin, integrate their tech stack and scale without scaling headcount.',
    buildTime: '4\u20136 weeks from kick-off to launch',
    categories: [
      {
        id: 'site',
        title: 'Bespoke site & commerce',
        icon: 'Globe',
        intro:
          'A site designed only for you, with revenue-generating features built in.',
        items: [
          'Fully custom bespoke website design',
          'Online ordering, table booking or full e-commerce',
          'Stripe payment processing and recurring billing',
          'Customer accounts, order history and saved details',
          'Everything from Grow: SEO, blog, multi-page, hosting, backups',
        ],
      },
      {
        id: 'ai',
        title: 'AI & conversational',
        icon: 'Bot',
        intro:
          'AI does the repetitive thinking so you and your team don\u2019t have to.',
        items: [
          '24/7 AI chatbot trained on your services, hours, FAQs and pricing',
          'Chatbot can capture leads, book appointments and escalate to a human',
          'AI-drafted reply suggestions for incoming customer emails',
          'AI call-summary and next-action notes (when integrated with a call provider)',
          'Optional voice agent for after-hours calls (books, takes message, texts you)',
        ],
      },
      {
        id: 'process',
        title: 'End-to-end process automation',
        icon: 'Workflow',
        intro: 'Connect the dots between order, fulfilment and admin.',
        items: [
          'Order received \u2192 kitchen / staff alert \u2192 customer confirmation, automatic',
          'Stock-level alerts when items run low',
          'Auto-discount engine (happy hour, multi-buy, weekday-only)',
          'Invoice generation and reconciliation against Stripe payouts',
          'Staff rota / shift reminders by SMS the night before',
          'Form-failure detection \u2014 alert if submissions stop unexpectedly',
        ],
      },
      {
        id: 'integrations',
        title: 'Custom API integrations',
        icon: 'Plug',
        intro:
          'Your existing tools talk to each other automatically \u2014 no more double entry.',
        items: [
          'EPOS: Square, Toast, Lightspeed, Clover',
          'Accounting: Xero, QuickBooks, Sage \u2014 nightly transaction sync',
          'Delivery platforms: Deliveroo, Uber Eats, Just Eat \u2014 unified orders & sales',
          'CRM: HubSpot, Pipedrive, Salesforce \u2014 bi-directional contact sync',
          'Trade-specific tools (Cliniko, ServiceM8, MotorTrader, etc.)',
          'Email and calendar (Google Workspace or Microsoft 365)',
        ],
      },
      {
        id: 'marketing',
        title: 'Advanced marketing automation',
        icon: 'Megaphone',
        intro:
          'Smarter ads, smarter audiences, smarter spend \u2014 all driven by your own data.',
        items: [
          'Customer-list sync to Meta and Google Ads for lookalikes & exclusions',
          'Auto-pause rule when an ad campaign\u2019s cost-per-lead exceeds your threshold',
          'Landing-page A/B testing with auto-promote of the winning variant',
          'Cross-channel monthly view: Google Ads + Meta + GA4 in one dashboard',
          'UTM enforcement so every ad click is attributed correctly',
        ],
      },
      {
        id: 'reporting',
        title: 'Reporting & account management',
        icon: 'BarChart3',
        intro:
          'A real partner you speak to often \u2014 not a faceless agency.',
        items: [
          'Daily or weekly KPI digest to the owner: leads, bookings, revenue, ad spend',
          'Live unified dashboard you and your team can log into anytime',
          'Weekly check-in call with your account lead',
          'Dedicated account manager for the life of the contract',
          'Priority response (next business day on all support requests)',
        ],
      },
    ],
    notIncluded: [
      'This is our most comprehensive tier. If something isn\u2019t listed here we will scope it as a custom project \u2014 just ask.',
    ],
  },
];

export function getPackageDetail(slug: string): PackageDetail | undefined {
  return packageDetails.find((p) => p.slug === slug);
}
