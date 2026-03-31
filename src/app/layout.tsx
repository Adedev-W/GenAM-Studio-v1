import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://genam.studio'),
  title: {
    default: 'GenAM Studio — Platform AI Agent untuk UMKM Indonesia',
    template: '%s | GenAM Studio',
  },
  description: 'Buat chatbot AI yang paham produk kamu, tampilkan katalog visual interaktif, dan layani pelanggan 24/7 — tanpa coding. Platform AI agent untuk UMKM Indonesia.',
  keywords: [
    'AI agent untuk UMKM',
    'chatbot AI Indonesia',
    'platform AI bisnis Indonesia',
    'buat chatbot AI gratis',
    'chatbot AI untuk toko online',
    'AI customer service otomatis',
    'buat AI agent tanpa coding',
    'chatbot WhatsApp AI Indonesia',
    'GenAM Studio',
  ],
  openGraph: {
    title: 'GenAM Studio — Platform AI Agent untuk UMKM Indonesia',
    description: 'Buat chatbot AI yang paham produk kamu, tampilkan katalog visual interaktif, dan layani pelanggan 24/7 — tanpa coding.',
    url: 'https://genam.studio',
    siteName: 'GenAM Studio',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'GenAM Studio' }],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GenAM Studio — Platform AI Agent untuk UMKM Indonesia',
    description: 'Buat chatbot AI yang paham produk kamu dan layani pelanggan 24/7 — tanpa coding.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <body className="font-body antialiased" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
