'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

  useEffect(() => {
    if (!measurementId) return;

    // Firebase Analytics is already initialized through Firebase SDK
    // This just tracks page views
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', measurementId, {
        page_path: pathname + searchParams?.toString(),
      });
    }
  }, [pathname, searchParams, measurementId]);

  return null; // Firebase Analytics is handled by Firebase SDK
}
