import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PWAProvider from '@/components/PWAProvider';
import ScrollToTop from '@/components/ScrollToTop';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: '#4F8FEA',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: 'Cryptgen Generation 2023 | Bisnis Digital UNM',
  description: 'Website resmi kelas Bisnis Digital angkatan 2023, Universitas Negeri Makassar.',
  manifest: '/manifest.json',

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}>
        <PWAProvider>
          <ScrollToTop />
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </PWAProvider>
      </body>
    </html>
  );
}

