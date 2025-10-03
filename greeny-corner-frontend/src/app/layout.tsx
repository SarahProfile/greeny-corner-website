import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ClientI18nProvider from "@/components/ClientI18nProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Greeny Corner",
  description: "Identify plants and manage their care schedule",
  icons: {
    icon: '/favicon-greeny.svg',
    shortcut: '/favicon-greeny.svg',
    apple: '/favicon-greeny.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        <ClientI18nProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ClientI18nProvider>
      </body>
    </html>
  );
}
