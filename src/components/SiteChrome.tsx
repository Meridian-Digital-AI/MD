'use client';

// Renders the public-site Navbar + Footer everywhere EXCEPT on signed-in
// app surfaces (admin, dashboard, login, auth callbacks, pending-approval),
// which provide their own chrome.

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const HIDE_PREFIXES = ['/admin', '/dashboard', '/login', '/auth', '/pending-approval'];

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const hideChrome = HIDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (hideChrome) {
    return <main id="main-content" className="flex-1">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
