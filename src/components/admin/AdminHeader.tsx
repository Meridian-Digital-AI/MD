'use client';

// Admin header with a per-device theme picker. Theme is persisted to
// localStorage so it sticks across reloads but doesn't bleed across users
// or browsers.

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import {
  ADMIN_THEMES,
  ADMIN_THEME_STORAGE_KEY,
  DEFAULT_ADMIN_THEME,
  isAdminThemeId,
  type AdminThemeId,
} from '@/components/admin/adminThemes';

const THEME_CHANGE_EVENT = 'meridian:admin-theme-change';

function subscribe(cb: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

function getSnapshot(): AdminThemeId {
  const stored = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
  return isAdminThemeId(stored) ? stored : DEFAULT_ADMIN_THEME;
}

function getServerSnapshot(): AdminThemeId {
  return DEFAULT_ADMIN_THEME;
}

export default function AdminHeader({ email }: { email: string | null }) {
  const themeId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [pickerOpen, setPickerOpen] = useState(false);

  const setTheme = (id: AdminThemeId) => {
    window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, id);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
    setPickerOpen(false);
  };

  const theme = ADMIN_THEMES[themeId];
  const isDarkHeader = themeId === 'navy';
  const linkColor = isDarkHeader ? 'text-slate-300 hover:text-white' : 'text-slate-500 hover:text-slate-900';
  const titleColor = isDarkHeader ? 'text-white' : 'text-[var(--color-navy-900)]';
  const emailColor = isDarkHeader ? 'text-slate-300' : 'text-slate-500';

  return (
    <header className={`border-b ${theme.headerBg} ${theme.headerBorder}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <Link href="/" className={`text-sm ${linkColor}`}>
            ← Meridian Digital
          </Link>
          <div className="mt-1 flex items-baseline gap-3">
            <h1 className={`text-lg font-semibold ${titleColor}`}>Admin Console</h1>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${theme.badgeBg} ${theme.badgeText}`}>
              You see everything
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="relative">
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                isDarkHeader
                  ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              aria-haspopup="menu"
              aria-expanded={pickerOpen}
            >
              Theme: {theme.label}
            </button>
            {pickerOpen && (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
              >
                {Object.values(ADMIN_THEMES).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="menuitem"
                    onClick={() => setTheme(t.id)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-50 ${
                      t.id === themeId ? 'bg-slate-50 font-semibold text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className={`h-3 w-3 rounded-full border border-slate-200 ${t.headerBg}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className={emailColor}>{email}</span>
          <form action="/auth/signout" method="post">
            <button className={`underline ${linkColor}`}>Sign out</button>
          </form>
        </div>
      </div>
    </header>
  );
}
