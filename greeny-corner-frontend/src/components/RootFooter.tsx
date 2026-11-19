'use client';
import { usePathname } from 'next/navigation';
import Footer from './Footer';
import ArabicFooter from './ArabicFooter';

export default function RootFooter() {
  const pathname = usePathname();
  if (pathname.startsWith('/ar/') || pathname === '/ar') return <ArabicFooter />;
  return <Footer />;
}
