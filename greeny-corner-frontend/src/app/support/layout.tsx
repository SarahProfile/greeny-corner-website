import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Support Center',
  description: 'Get help with Greeny Corner - Plant care app support, FAQs, and contact information. We\'re here to help you care for your plants.',
  alternates: {
    canonical: 'https://www.greenycorner.ae/support',
  },
  openGraph: {
    title: 'Support Center | Greeny Corner',
    description: 'Get help with Greeny Corner - Plant care app support, FAQs, and contact information.',
    url: 'https://www.greenycorner.ae/support',
  },
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
