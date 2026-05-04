import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Free AI Plant Identifier — Identify Any Plant Instantly',
  description: 'Identify any plant instantly with AI. Upload a photo and get the plant name, care tips, watering schedule, and health advice in seconds. Free plant identification tool.',
  alternates: {
    canonical: 'https://www.greenycorner.ae/plant-identifier',
    languages: {
      'en': 'https://www.greenycorner.ae/plant-identifier',
      'ar': 'https://www.greenycorner.ae/plant-identifier',
    },
  },
  openGraph: {
    title: 'Free AI Plant Identifier — Identify Any Plant Instantly',
    description: 'Upload a photo and instantly identify any plant with AI. Get care tips, watering schedule, and health advice — all for free.',
    url: 'https://www.greenycorner.ae/plant-identifier',
    images: [{ url: 'https://www.greenycorner.ae/og-image.png', width: 1200, height: 630, alt: 'Greeny Corner Plant Identifier' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free AI Plant Identifier — Identify Any Plant Instantly',
    description: 'Upload a photo and instantly identify any plant with AI. Get care tips and watering schedule for free.',
  },
  keywords: [
    'plant identifier',
    'identify plant from photo',
    'AI plant identification',
    'free plant identifier',
    'plant name finder',
    'what plant is this',
    'plant recognition',
    'plant species identifier',
  ],
};

export default function PlantIdentifierLayout({ children }: { children: React.ReactNode }) {
  return children;
}
