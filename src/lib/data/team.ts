export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  bio: string;
  phone?: string;
  photo?: string; // PLACEHOLDER — replace with actual photo path before launch
}

export const team: TeamMember[] = [
  {
    id: 'will',
    name: 'Will',
    initials: 'WA',
    role: 'Co-Founder',
    phone: '07498 588299',
    bio: 'Will co-founded Meridian Digital to help local businesses in Exeter get the digital tools they deserve — modern websites, smart automation, and marketing that actually works.',
  },
  {
    id: 'joe',
    name: 'Joe',
    initials: 'JA',
    role: 'Co-Founder',
    phone: '07485 718512',
    bio: 'Joe co-founded Meridian Digital with a focus on helping local businesses grow. From strategy to execution, he works alongside Will to deliver results that make a real difference.',
  },
];
