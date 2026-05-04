// Default monthly deliverables per package tier.
//
// Used by the "Apply template" button on the monthly view to seed a
// fresh checklist for any new month. The user can then edit/add/remove
// individual items — templates are starter scaffolding, not enforced.
//
// Keep these aligned with what we promise on the marketing site (chatbot
// system prompt + /services page).

import type { PackageTier } from './packageFeatures';

export type DeliverableType = 'call' | 'creative' | 'blog' | 'audit' | 'report' | 'other';

export type DeliverableTemplate = {
  title: string;
  type: DeliverableType;
  notes?: string;
};

const COMMON_REPORT: DeliverableTemplate = {
  title: 'Monthly performance report',
  type: 'report',
  notes: 'Send PDF summary of leads, pageviews, ads (if applicable).',
};

const TEMPLATES: Record<PackageTier, DeliverableTemplate[]> = {
  'website-only': [
    { title: 'Hosting & SSL health check', type: 'audit' },
    { title: 'Performance audit (Lighthouse)', type: 'audit' },
  ],
  'get-started': [
    COMMON_REPORT,
    { title: 'Lead capture review', type: 'audit', notes: 'Spam check, email deliverability, form conversion.' },
    { title: 'Email automation health check', type: 'audit' },
  ],
  'grow': [
    COMMON_REPORT,
    { title: 'Bi-weekly check-in call (week 2)', type: 'call' },
    { title: 'Bi-weekly check-in call (week 4)', type: 'call' },
    { title: 'Nurture campaign update', type: 'creative', notes: 'Refresh sequence copy or add new step.' },
    { title: 'SEO blog post', type: 'blog', notes: 'Target one local search term.' },
    { title: 'Lead pipeline review', type: 'audit' },
  ],
  'full-partner': [
    COMMON_REPORT,
    { title: 'Weekly check-in call (week 1)', type: 'call' },
    { title: 'Weekly check-in call (week 2)', type: 'call' },
    { title: 'Weekly check-in call (week 3)', type: 'call' },
    { title: 'Weekly check-in call (week 4)', type: 'call' },
    { title: 'Ad creative refresh', type: 'creative', notes: 'New variants for Meta + Google ads.' },
    { title: 'SEO blog post', type: 'blog' },
    { title: 'Automation review', type: 'audit', notes: 'EPOS / accounting / delivery integrations.' },
    { title: 'Priority support log review', type: 'audit' },
  ],
};

export function templatesForTier(tier: PackageTier): DeliverableTemplate[] {
  return TEMPLATES[tier] ?? TEMPLATES['get-started'];
}

export const TYPE_LABELS: Record<DeliverableType, string> = {
  call: 'Call',
  creative: 'Creative',
  blog: 'Blog',
  audit: 'Audit',
  report: 'Report',
  other: 'Other',
};

export const TYPE_COLOURS: Record<DeliverableType, string> = {
  call: 'bg-blue-100 text-blue-800',
  creative: 'bg-purple-100 text-purple-800',
  blog: 'bg-emerald-100 text-emerald-800',
  audit: 'bg-amber-100 text-amber-800',
  report: 'bg-slate-200 text-slate-800',
  other: 'bg-slate-100 text-slate-700',
};
