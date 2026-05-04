import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Greeny Corner — the AI-powered plant care app built for plant lovers in the UAE and worldwide. Our mission is to make plant care effortless and enjoyable.',
  alternates: {
    canonical: 'https://www.greenycorner.ae/about',
    languages: {
      'en': 'https://www.greenycorner.ae/about',
      'ar': 'https://www.greenycorner.ae/about',
    },
  },
  openGraph: {
    title: 'About Greeny Corner — Smart Plant Care App',
    description: 'Learn about Greeny Corner — the AI-powered plant care app built for plant lovers in the UAE and worldwide.',
    url: 'https://www.greenycorner.ae/about',
    images: [{ url: 'https://www.greenycorner.ae/og-image.png', width: 1200, height: 630, alt: 'Greeny Corner' }],
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
