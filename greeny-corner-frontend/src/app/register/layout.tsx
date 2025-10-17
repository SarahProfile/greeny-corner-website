import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a Greeny Corner account to start tracking and caring for your plants.',
  openGraph: {
    title: 'Sign Up for Greeny Corner',
    description: 'Create a Greeny Corner account to start tracking and caring for your plants.',
    url: 'https://www.greenycorner.ae/register',
    type: 'website',
    images: [
      {
        url: 'https://www.greenycorner.ae/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Greeny Corner Sign Up',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign Up for Greeny Corner',
    description: 'Create a Greeny Corner account to start tracking and caring for your plants.',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
