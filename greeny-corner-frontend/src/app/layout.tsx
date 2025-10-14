import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ClientI18nProvider from "@/components/ClientI18nProvider";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://greenycorner.ae'),
  title: {
    default: 'Greeny Corner - Smart Plant Care & Identification App',
    template: '%s | Greeny Corner'
  },
  description: 'AI-powered plant identification and care management app. Track your plants, get watering reminders, and learn expert care tips. Perfect for plant lovers in UAE and worldwide.',
  keywords: [
    'plant care app',
    'plant identification',
    'plant watering reminder',
    'indoor plants',
    'plant care schedule',
    'AI plant identifier',
    'houseplants UAE',
    'plant care Dubai',
    'gardening app',
    'plant tracker',
    'smart plant care',
    'plant health monitor',
    'botanical identification',
    'green thumb app'
  ],
  authors: [{ name: 'Greeny Corner' }],
  creator: 'Greeny Corner',
  publisher: 'Greeny Corner',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon-greeny.svg',
    shortcut: '/favicon-greeny.svg',
    apple: '/favicon-greeny.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://greenycorner.ae',
    title: 'Greeny Corner - Smart Plant Care & Identification App',
    description: 'AI-powered plant identification and care management. Track your plants, get watering reminders, and learn expert care tips.',
    siteName: 'Greeny Corner',
    images: [
      {
        url: '/greeny-logo.svg',
        width: 1200,
        height: 630,
        alt: 'Greeny Corner - Plant Care App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Greeny Corner - Smart Plant Care & Identification App',
    description: 'AI-powered plant identification and care management. Track your plants and get watering reminders.',
    images: ['/greeny-logo.svg'],
    creator: '@greenycorner',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code-here',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://greenycorner.ae" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        <GoogleAnalytics />
        <ClientI18nProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ClientI18nProvider>
      </body>
    </html>
  );
}
