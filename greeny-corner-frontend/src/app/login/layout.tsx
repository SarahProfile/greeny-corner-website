import { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your Greeny Corner account to track and care for your plants.',
  openGraph: {
    title: 'Login to Greeny Corner',
    description: 'Sign in to your Greeny Corner account to track and care for your plants.',
    url: `${SITE_URL}/login`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Greeny Corner Login',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Login to Greeny Corner',
    description: 'Sign in to your Greeny Corner account to track and care for your plants.',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
