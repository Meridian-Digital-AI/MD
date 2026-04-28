// Maps a client's package tier to which dashboard sections they can see / access.
// Single source of truth — change here, every nav and page reads from this.

export type PackageTier = 'get-started' | 'grow' | 'full-partner' | 'website-only';

export type DashboardSection =
  | 'overview'
  | 'leads'
  | 'pageviews'
  | 'analytics'
  | 'ads-view'
  | 'ads-manage'
  | 'settings';

export const SECTION_LABELS: Record<DashboardSection, string> = {
  overview: 'Overview',
  leads: 'Leads',
  pageviews: 'Website Views',
  analytics: 'Analytics',
  'ads-view': 'Ads',
  'ads-manage': 'Manage Ads',
  settings: 'Settings',
};

const FEATURES: Record<PackageTier, DashboardSection[]> = {
  'website-only':  ['overview', 'leads', 'pageviews', 'settings'],
  'get-started':   ['overview', 'leads', 'pageviews', 'settings'],
  'grow':          ['overview', 'leads', 'pageviews', 'analytics', 'ads-view', 'settings'],
  'full-partner':  ['overview', 'leads', 'pageviews', 'analytics', 'ads-view', 'ads-manage', 'settings'],
};

export function sectionsForTier(tier: PackageTier): DashboardSection[] {
  return FEATURES[tier] ?? FEATURES['get-started'];
}

export function tierAllowsSection(tier: PackageTier, section: DashboardSection): boolean {
  return sectionsForTier(tier).includes(section);
}

export const TIER_LABELS: Record<PackageTier, string> = {
  'website-only': 'Website Only',
  'get-started': 'Get Started',
  'grow': 'Grow Your Business',
  'full-partner': 'Full Digital Partner',
};
