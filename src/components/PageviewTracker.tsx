'use client';

import { useEffect } from 'react';

/* Fires exactly once per browser session. Dedupes with sessionStorage
 * so a visitor clicking around the site only counts as one "visit".
 * Silent failure — never interferes with rendering. */

export default function PageviewTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (sessionStorage.getItem('md_pv_sent') === '1') return;
      sessionStorage.setItem('md_pv_sent', '1');
    } catch {
      // sessionStorage unavailable (private mode) — still ping once
    }

    fetch('/api/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: window.location.pathname + window.location.search,
        referrer: document.referrer,
      }),
      keepalive: true,
    }).catch(() => {
      // best-effort
    });
  }, []);

  return null;
}
