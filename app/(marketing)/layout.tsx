import type { Metadata } from 'next';
import { Bebas_Neue, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
import './styles/marketing.css';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue',
  display: 'swap',
});

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ibm-plex',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://pelicantrading.ai'),
  title: 'Pelican Trading | AI Market Intelligence for Traders',
  description: 'The AI trading platform that thinks like you trade. Real-time market analysis, conversational backtesting, and institutional-grade intelligence — finally accessible to everyone.',
  icons: {
    icon: '/pelican-logo-transparent.webp',
  },
  openGraph: {
    title: 'Pelican Trading | AI Market Intelligence for Traders',
    description: 'The AI trading platform that thinks like you trade. Real-time market analysis, conversational backtesting, and institutional-grade intelligence — finally accessible to everyone.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Pelican Trading' }],
    type: 'website',
    siteName: 'Pelican Trading',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pelican Trading | AI Market Intelligence for Traders',
    description: 'The AI trading platform that thinks like you trade.',
    images: ['/og-image.png'],
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`marketing-page ${bebasNeue.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable}`}>
      {children}
    </div>
  );
}