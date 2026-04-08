export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  bio: string;
  photo?: string; // PLACEHOLDER — replace with actual photo path before launch
}

export const team: TeamMember[] = [
  {
    id: 'will',
    name: 'Will',
    initials: 'WA',
    role: 'Website Design & Automation',
    bio: 'Will handles website design and automation builds. He uses AI to build production-quality code, delivering custom Next.js sites and automation systems at a fraction of traditional agency costs.',
  },
  {
    id: 'partner',
    name: 'Partner', // PLACEHOLDER — replace before launch
    initials: 'MD',
    role: 'Ads & Marketing Strategy',
    bio: 'Our marketing specialist handles Google and Meta advertising, campaign strategy, and performance optimisation — driving the right customers to your new digital presence.',
  },
];
