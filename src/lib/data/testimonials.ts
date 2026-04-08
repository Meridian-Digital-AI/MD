export interface Testimonial {
  id: string;
  quote: string;
  name: string; // PLACEHOLDER — replace before launch
  businessType: string;
  location: string;
  rating: number;
}

// PLACEHOLDER — replace all testimonials with real ones before launch
export const testimonials: Testimonial[] = [
  {
    id: 'testimonial-1',
    quote:
      'Meridian built our ordering site in two weeks. We\'re now getting 40+ direct orders a week instead of paying Just Eat 30% commission.',
    name: 'James Chen',
    businessType: 'Takeaway Owner',
    location: 'Exeter',
    rating: 5,
  },
  {
    id: 'testimonial-2',
    quote:
      'The MOT reminder system filled our diary four weeks ahead. We\'ve never had that before.',
    name: 'Mark Thompson',
    businessType: 'Garage Owner',
    location: 'Crediton',
    rating: 5,
  },
  {
    id: 'testimonial-3',
    quote:
      'They actually explained everything in plain English and the site works brilliantly on my phone.',
    name: 'Sarah Mitchell',
    businessType: 'Cleaning Business Owner',
    location: 'Topsham',
    rating: 5,
  },
];
