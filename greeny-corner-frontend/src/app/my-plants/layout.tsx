import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Plants',
  description: 'View and manage your plant collection with Greeny Corner.',
  openGraph: {
    title: 'My Plants - Greeny Corner',
    description: 'View and manage your plant collection with Greeny Corner.',
    url: 'https://www.greenycorner.ae/my-plants',
    type: 'website',
    images: [
      {
        url: 'https://www.greenycorner.ae/og-image.png',
        width: 1200,
        height: 630,
        alt: 'My Plants - Greeny Corner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Plants - Greeny Corner',
    description: 'View and manage your plant collection with Greeny Corner.',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function MyPlantsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
