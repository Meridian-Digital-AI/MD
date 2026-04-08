export type ContactStatus = 'new' | 'contacted' | 'quoted' | 'won' | 'lost';
export type ContactSource = 'website-contact-form' | 'website-sector-page' | 'website-booking';
export type BusinessType =
  | 'Restaurant / Takeaway'
  | 'Garage / MOT Centre'
  | 'Salon / Beauty'
  | 'Cleaning / Exterior'
  | 'Dry Cleaning / Laundry'
  | 'Other';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: BusinessType;
  message: string;
  source: ContactSource;
  sourcePage?: string;
  dateSubmitted: string;
  status: ContactStatus;
  notes: string;
}

// In-memory store for development — replace with a database before launch
const contacts: Contact[] = [];

export function createContact(
  data: Omit<Contact, 'id' | 'dateSubmitted' | 'status' | 'notes'>
): Contact {
  const contact: Contact = {
    ...data,
    id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    dateSubmitted: new Date().toISOString(),
    status: 'new',
    notes: '',
  };
  contacts.push(contact);
  return contact;
}

export function getContacts(): Contact[] {
  return [...contacts];
}

export function getDemoLink(businessType: BusinessType): string {
  switch (businessType) {
    case 'Restaurant / Takeaway':
      return '/demos/oriental-city';
    case 'Garage / MOT Centre':
      return '/demos/parkside-garage';
    default:
      return '/work';
  }
}
