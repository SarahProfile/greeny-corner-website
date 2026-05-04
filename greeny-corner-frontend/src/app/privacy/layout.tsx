import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read the Greeny Corner privacy policy. Learn how we collect, use, and protect your personal data when using our plant care app.',
  alternates: {
    canonical: 'https://www.greenycorner.ae/privacy',
    languages: {
      'en': 'https://www.greenycorner.ae/privacy',
      'ar': 'https://www.greenycorner.ae/privacy',
    },
  },
  openGraph: {
    title: 'Privacy Policy | Greeny Corner',
    description: 'Read the Greeny Corner privacy policy. Learn how we collect, use, and protect your personal data.',
    url: 'https://www.greenycorner.ae/privacy',
  },
  robots: {
    index: true,
    follow: false,
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
