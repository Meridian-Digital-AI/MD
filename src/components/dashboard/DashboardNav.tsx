'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { DashboardSection } from '@/lib/dashboard/packageFeatures';

const SECTION_PATHS: Record<DashboardSection, string> = {
  overview: '/dashboard',
  leads: '/dashboard/leads',
  pageviews: '/dashboard/pageviews',
  analytics: '/dashboard/analytics',
  'ads-view': '/dashboard/ads',
  'ads-manage': '/dashboard/ads/manage',
  settings: '/dashboard/settings',
};

export function DashboardNav({
  sections,
  sectionLabels,
}: {
  sections: DashboardSection[];
  sectionLabels: Record<DashboardSection, string>;
}) {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-6">
        {sections.map((section) => {
          const href = SECTION_PATHS[section];
          const active =
            section === 'overview'
              ? pathname === href
              : pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={section}
              href={href}
              className={`whitespace-nowrap border-b-2 py-3 text-sm font-medium transition ${
                active
                  ? 'border-[var(--color-blue-600)] text-[var(--color-navy-900)]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {sectionLabels[section]}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
