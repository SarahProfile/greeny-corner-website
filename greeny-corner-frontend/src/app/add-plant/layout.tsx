import { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Add Plant',
  description: 'Add a new plant to your Greeny Corner collection with AI-powered identification.',
  openGraph: {
    title: 'Add Plant - Greeny Corner',
    description: 'Add a new plant to your collection with AI-powered identification.',
    url: `${SITE_URL}/add-plant`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Add Plant - Greeny Corner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Add Plant - Greeny Corner',
    description: 'Add a new plant to your collection with AI-powered identification.',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AddPlantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
