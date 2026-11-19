import type { Metadata } from "next";
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read the Greeny Corner privacy policy. Learn how we collect, use, and protect your personal data when using our plant care app.',
  alternates: {
    canonical: `${SITE_URL}/privacy`,
    languages: {
      'en': `${SITE_URL}/privacy`,
      'ar': `${SITE_URL}/privacy`,
    },
  },
  openGraph: {
    title: 'Privacy Policy | Greeny Corner',
    description: 'Read the Greeny Corner privacy policy. Learn how we collect, use, and protect your personal data.',
    url: `${SITE_URL}/privacy`,
  },
  robots: {
    index: true,
    follow: false,
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
