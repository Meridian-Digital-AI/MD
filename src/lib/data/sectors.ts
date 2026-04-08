export interface Sector {
  id: string;
  name: string;
  slug: string;
  icon: string;
  shortDescription: string;
  heroTitle: string;
  heroHeadline: string;
  heroSubheadline: string;
  painPoints: { title: string; description: string }[];
  features: { title: string; description: string; icon: string }[];
  proofHeadline: string;
  proofDescription: string;
  demoAvailable: boolean;
  demoSlug?: string;
  demoLabel?: string;
  ctaText: string;
  metaTitle: string;
  metaDescription: string;
}

export const sectors: Sector[] = [
  {
    id: 'restaurants',
    name: 'Restaurants & Takeaways',
    slug: 'restaurants',
    icon: 'UtensilsCrossed',
    shortDescription: 'Online ordering, loyalty, direct customer relationships',
    heroTitle: 'Websites & Automation for Restaurants & Takeaways',
    heroHeadline: 'Stop paying 30% to Just Eat. Get your own ordering system.',
    heroSubheadline:
      'We build direct online ordering systems with loyalty programmes, marketing automation, and customer retention — so every order is yours to keep.',
    painPoints: [
      {
        title: 'Losing margin to aggregators',
        description:
          'Just Eat, Uber Eats, and Deliveroo take 25–35% of every order. On a £20 order, that\'s up to £7 gone before you\'ve paid for ingredients.',
      },
      {
        title: 'No direct customer relationships',
        description:
          'When customers order through marketplaces, those platforms own the relationship. You can\'t email them, reward them, or bring them back.',
      },
      {
        title: 'No repeat-order marketing',
        description:
          'Without customer data, you can\'t send weekly specials, birthday offers, or re-engage lapsed customers. You\'re paying acquisition costs on every single order.',
      },
      {
        title: 'Relying on phone orders',
        description:
          'Phone orders tie up staff, lead to mistakes, and aren\'t available when you\'re busy. An online system takes orders 24/7 without errors.',
      },
    ],
    features: [
      { title: 'Direct online ordering', description: 'Full cart and checkout on your own website — no commission to anyone.', icon: 'ShoppingCart' },
      { title: 'Categorised menu with filters', description: 'Dietary filters (vegetarian, gluten-free, allergens) built in.', icon: 'ListFilter' },
      { title: 'Loyalty programme', description: 'Points-per-pound system that rewards repeat customers automatically.', icon: 'Award' },
      { title: 'Customer referral system', description: 'Tracked referrals with automatic rewards for both parties.', icon: 'UserPlus' },
      { title: 'Marketing automation', description: 'Welcome series, re-engagement, abandoned cart recovery, birthday rewards, weekly specials — all automatic.', icon: 'Mail' },
      { title: 'Order tracking', description: 'Live order status so customers know exactly when their food is ready.', icon: 'Clock' },
      { title: 'Google review collection', description: 'Automated post-order review requests to build your online reputation.', icon: 'Star' },
      { title: 'Admin dashboard', description: 'Revenue analytics, order management, and campaign performance in one place.', icon: 'BarChart3' },
    ],
    proofHeadline: '45 direct orders per week',
    proofDescription:
      'Our ordering system is designed to convert 40+ direct orders per week, saving the average takeaway £800/month in marketplace fees.',
    demoAvailable: true,
    demoSlug: 'oriental-city',
    demoLabel: 'See the Oriental City Demo',
    ctaText: 'Book a call to see how it works for your restaurant',
    metaTitle: 'Restaurant & Takeaway Websites | Meridian Digital Exeter',
    metaDescription:
      'Stop paying 30% to Just Eat. Get your own online ordering system with built-in loyalty, marketing automation, and direct customer relationships. Exeter, Devon.',
  },
  {
    id: 'garages',
    name: 'Garages & MOT Centres',
    slug: 'garages',
    icon: 'Wrench',
    shortDescription: 'Automated MOT reminders, online booking, vehicle portals',
    heroTitle: 'Websites & Automation for Garages & MOT Centres',
    heroHeadline: 'Fill your MOT diary automatically. No more empty slots.',
    heroSubheadline:
      'We build online booking systems with automated MOT reminder sequences that keep your diary full — without chasing customers by phone.',
    painPoints: [
      {
        title: 'Relying on phone bookings',
        description:
          'Phone bookings tie up your reception, miss calls during busy periods, and make it harder for customers to book outside working hours.',
      },
      {
        title: 'No MOT reminders',
        description:
          'Without automated reminders, customers forget their MOT is due and book elsewhere — or worse, drive without one.',
      },
      {
        title: 'Losing customers to online-first garages',
        description:
          'Garages that offer easy online booking and reminders are winning customers from those still relying on phone and paper diaries.',
      },
      {
        title: 'No review collection',
        description:
          'Happy customers rarely leave reviews unprompted. Without a system, your Google listing doesn\'t reflect the quality of your work.',
      },
    ],
    features: [
      { title: 'Online MOT & service booking', description: 'Slot management with real-time availability — customers book in seconds.', icon: 'CalendarCheck' },
      { title: 'MOT reminder engine', description: '3-stage automated sequence: 6 weeks, 2 weeks, and 3 days before expiry.', icon: 'Bell' },
      { title: 'Customer vehicle portal', description: 'Customers enter their reg to see service history and rebook instantly.', icon: 'Car' },
      { title: 'Post-service review automation', description: 'Automatic Google review requests sent after every completed job.', icon: 'Star' },
      { title: 'Admin dashboard', description: 'Bookings calendar, reminder campaign stats, and revenue tracking.', icon: 'BarChart3' },
      { title: 'Marketing automation', description: 'Welcome series, win-back campaigns, seasonal promotions, and referral programme.', icon: 'Mail' },
    ],
    proofHeadline: 'MOT diary booked 4+ weeks ahead',
    proofDescription:
      'Garages using automated MOT reminders typically see their diary booked 4+ weeks ahead, with 90%+ email open rates — because MOT reminders are genuinely useful, not marketing noise.',
    demoAvailable: true,
    demoSlug: 'parkside-garage',
    demoLabel: 'See the Parkside Garage Demo',
    ctaText: 'Book a call to see how it works for your garage',
    metaTitle: 'Garage & MOT Centre Websites | Meridian Digital Exeter',
    metaDescription:
      'Fill your MOT diary automatically with online booking and 3-stage reminder sequences. Built for garages in Exeter and Devon.',
  },
  {
    id: 'salons',
    name: 'Hair Salons & Beauty',
    slug: 'salons',
    icon: 'Scissors',
    shortDescription: 'Smart booking, no-show prevention, rebooking automation',
    heroTitle: 'Websites & Automation for Hair Salons & Beauty Studios',
    heroHeadline: 'Cut no-shows in half. Rebook clients automatically.',
    heroSubheadline:
      'We build smart booking systems with automated reminders and intelligent rebooking that keep your chairs full and your clients on schedule.',
    painPoints: [
      {
        title: 'No-shows cost thousands',
        description:
          'The average no-show costs a salon £40–£80 per empty chair. Over a year, that adds up to thousands in lost revenue.',
      },
      {
        title: 'Phone and walk-in only',
        description:
          'Relying on phone bookings means missed calls, double-bookings, and no way for clients to book when you\'re with a customer.',
      },
      {
        title: 'No loyalty programme',
        description:
          'Without a rewards system, there\'s no extra incentive for clients to stay loyal — they\'ll try the new salon down the road.',
      },
      {
        title: 'No rebooking prompts',
        description:
          'Clients forget to rebook at the right interval. A colour client who should return in 6 weeks drifts to 10 — or doesn\'t come back at all.',
      },
    ],
    features: [
      { title: 'Smart online booking', description: 'Service → stylist → time slot in 3 taps on a phone. Effortless.', icon: 'CalendarCheck' },
      { title: 'Automated reminders', description: '48-hour email and 2-hour SMS reminders cut no-shows by 50–70%.', icon: 'Bell' },
      { title: 'No-show tracking', description: 'Flag repeat offenders and optionally require deposits for their bookings.', icon: 'AlertTriangle' },
      { title: 'Intelligent rebooking', description: 'Service-based intervals — "Your colour is due in ~6 weeks — book now?" sent automatically.', icon: 'RefreshCw' },
      { title: 'Loyalty programme', description: 'Visit-based tiers that reward your best clients and encourage return visits.', icon: 'Award' },
      { title: 'Admin dashboard', description: 'Stylist schedules, no-show rates, rebooking stats, and revenue tracking.', icon: 'BarChart3' },
    ],
    proofHeadline: '50–70% fewer no-shows',
    proofDescription:
      'Automated reminders cut no-shows by 50–70%. Smart rebooking keeps your chairs full and your clients on schedule.',
    demoAvailable: false,
    demoLabel: 'Demo Coming Soon',
    ctaText: 'Book a call to see how it works for your salon',
    metaTitle: 'Hair Salon & Beauty Websites | Meridian Digital Exeter',
    metaDescription:
      'Cut no-shows in half with smart booking and automated reminders. Intelligent rebooking keeps clients coming back. Exeter, Devon.',
  },
  {
    id: 'cleaning',
    name: 'Cleaning & Exterior Services',
    slug: 'cleaning',
    icon: 'Sparkles',
    shortDescription: 'Instant quote calculators, recurring booking management',
    heroTitle: 'Websites & Automation for Cleaning & Exterior Services',
    heroHeadline: 'Turn website visitors into booked jobs — 24/7.',
    heroSubheadline:
      'We build instant quote calculators and automated follow-up systems that convert visitors into customers around the clock.',
    painPoints: [
      {
        title: 'Hours spent on manual quoting',
        description:
          'Every enquiry needs a phone call, a site visit, or a back-and-forth email chain before you can even give a price.',
      },
      {
        title: 'Losing out-of-hours leads',
        description:
          'When someone visits your website at 9pm on a Sunday and sees a basic contact form, they move on to the next provider.',
      },
      {
        title: 'No system for recurring clients',
        description:
          'Regular clients need manual rebooking reminders. Without a system, bookings slip and revenue drops.',
      },
      {
        title: 'Inconsistent marketing',
        description:
          'Seasonal services (spring cleans, gutter clearing, pre-Christmas deep cleans) need timely campaigns, but who has time to send them?',
      },
    ],
    features: [
      { title: 'Instant quote calculator', description: 'Service → property → frequency → extras → instant price. No waiting, no phone calls.', icon: 'Calculator' },
      { title: 'Automated lead follow-up', description: 'Multi-step email sequence nurtures every enquiry until they book or opt out.', icon: 'Mail' },
      { title: 'Recurring booking management', description: 'Weekly, fortnightly, or monthly schedules managed automatically.', icon: 'CalendarCheck' },
      { title: 'Seasonal campaign engine', description: 'Spring clean, pre-Christmas, and other seasonal promotions sent at the right time.', icon: 'Megaphone' },
      { title: 'Review collection', description: 'Automated post-service review requests build your Google reputation.', icon: 'Star' },
      { title: 'Admin dashboard', description: 'Lead pipeline, booking calendar, and campaign performance.', icon: 'BarChart3' },
    ],
    proofHeadline: 'Leads generated 24/7',
    proofDescription:
      'An instant quote calculator converts website visitors to leads around the clock — even at midnight on a Sunday when your competitors\' contact forms sit unread.',
    demoAvailable: false,
    demoLabel: 'Demo Coming Soon',
    ctaText: 'Book a call to see how it works for your cleaning business',
    metaTitle: 'Cleaning & Exterior Service Websites | Meridian Digital Exeter',
    metaDescription:
      'Turn website visitors into booked jobs 24/7 with instant quote calculators and automated follow-up. Exeter, Devon.',
  },
  {
    id: 'dry-cleaners',
    name: 'Dry Cleaners & Laundry',
    slug: 'dry-cleaners',
    icon: 'Shirt',
    shortDescription: 'Order tracking, collection booking, garment care reminders',
    heroTitle: 'Websites & Automation for Dry Cleaners & Laundry Services',
    heroHeadline: 'Give your customers order tracking. They\'ll love you for it.',
    heroSubheadline:
      'We build order tracking systems, collection booking, and loyalty programmes that transform the dry cleaning experience.',
    painPoints: [
      {
        title: 'No online presence',
        description:
          'Most dry cleaners rely entirely on walk-in traffic. Without a website, you\'re invisible to anyone searching online.',
      },
      {
        title: '"Is my suit ready?" phone calls',
        description:
          'Customers calling to check order status ties up your counter staff and frustrates everyone involved.',
      },
      {
        title: 'No online collection booking',
        description:
          'Customers can\'t schedule a pickup online, so they either forget or find a competitor that offers it.',
      },
      {
        title: 'No loyalty programme',
        description:
          'Dry cleaning is a repeat business — but without a loyalty system, there\'s no incentive to stick with one provider.',
      },
    ],
    features: [
      { title: 'Order lifecycle tracking', description: 'Collection Booked → Collected → In Progress → Quality Check → Ready → Delivered. No more "is it ready?" calls.', icon: 'PackageSearch' },
      { title: 'Collection & delivery booking', description: 'Time slot booking for pickups and deliveries, with automated confirmations.', icon: 'Truck' },
      { title: 'Recurring weekly pickup', description: 'Regular customers set a weekly schedule — predictable revenue for you, convenience for them.', icon: 'CalendarCheck' },
      { title: 'Garment care reminders', description: '"Your winter coat was last cleaned 10 months ago" — timely, helpful, and drives repeat business.', icon: 'Bell' },
      { title: 'Digital loyalty card', description: 'Digital stamp card that replaces the paper one they always lose.', icon: 'Award' },
      { title: 'Admin dashboard', description: 'Visual kanban board showing every order\'s status at a glance.', icon: 'BarChart3' },
    ],
    proofHeadline: 'Zero "is it ready?" phone calls',
    proofDescription:
      'Order tracking alone transforms the customer experience — no more "is my suit ready?" phone calls. And recurring pickup schedules create predictable monthly revenue.',
    demoAvailable: false,
    demoLabel: 'Demo Coming Soon',
    ctaText: 'Book a call to see how it works for your dry cleaning business',
    metaTitle: 'Dry Cleaner & Laundry Websites | Meridian Digital Exeter',
    metaDescription:
      'Give customers order tracking, online collection booking, and loyalty rewards. Built for dry cleaners in Exeter and Devon.',
  },
];
