import type { Metadata } from "next";
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Greeny Corner — the AI-powered plant care app built for plant lovers in the UAE and worldwide. Our mission is to make plant care effortless and enjoyable.',
  alternates: {
    canonical: `${SITE_URL}/about`,
    languages: {
      'en': `${SITE_URL}/about`,
      'ar': `${SITE_URL}/about`,
    },
  },
  openGraph: {
    title: 'About Greeny Corner — Smart Plant Care App',
    description: 'Learn about Greeny Corner — the AI-powered plant care app built for plant lovers in the UAE and worldwide.',
    url: `${SITE_URL}/about`,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Greeny Corner' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Greeny Corner — Smart Plant Care App',
    description: 'Learn about Greeny Corner — the AI-powered plant care app built for plant lovers in the UAE and worldwide.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
