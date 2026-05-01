// Preset color themes for the admin header. Stored in localStorage,
// applied client-side on mount. Keys are stable identifiers; never rename.

export type AdminThemeId = 'amber' | 'navy' | 'sage' | 'rose' | 'slate' | 'violet';

export type AdminTheme = {
  id: AdminThemeId;
  label: string;
  // Tailwind classes applied to the <header> element.
  headerBg: string;
  headerBorder: string;
  // Pill ("You see everything" badge) classes.
  badgeBg: string;
  badgeText: string;
};

export const ADMIN_THEMES: Record<AdminThemeId, AdminTheme> = {
  amber: {
    id: 'amber',
    label: 'Amber (default)',
    headerBg: 'bg-amber-50',
    headerBorder: 'border-amber-200',
    badgeBg: 'bg-amber-200',
    badgeText: 'text-amber-900',
  },
  navy: {
    id: 'navy',
    label: 'Navy',
    headerBg: 'bg-slate-900',
    headerBorder: 'border-slate-800',
    badgeBg: 'bg-blue-500',
    badgeText: 'text-white',
  },
  sage: {
    id: 'sage',
    label: 'Sage',
    headerBg: 'bg-emerald-50',
    headerBorder: 'border-emerald-200',
    badgeBg: 'bg-emerald-200',
    badgeText: 'text-emerald-900',
  },
  rose: {
    id: 'rose',
    label: 'Rose',
    headerBg: 'bg-rose-50',
    headerBorder: 'border-rose-200',
    badgeBg: 'bg-rose-200',
    badgeText: 'text-rose-900',
  },
  slate: {
    id: 'slate',
    label: 'Slate',
    headerBg: 'bg-slate-100',
    headerBorder: 'border-slate-300',
    badgeBg: 'bg-slate-300',
    badgeText: 'text-slate-800',
  },
  violet: {
    id: 'violet',
    label: 'Violet',
    headerBg: 'bg-violet-50',
    headerBorder: 'border-violet-200',
    badgeBg: 'bg-violet-200',
    badgeText: 'text-violet-900',
  },
};

export const DEFAULT_ADMIN_THEME: AdminThemeId = 'amber';
export const ADMIN_THEME_STORAGE_KEY = 'meridian-admin-theme';

export function isAdminThemeId(value: unknown): value is AdminThemeId {
  return typeof value === 'string' && value in ADMIN_THEMES;
}
