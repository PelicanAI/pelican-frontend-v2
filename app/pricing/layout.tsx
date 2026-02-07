import type { Metadata } from 'next';
import { Bebas_Neue, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
import '@/app/(marketing)/styles/marketing.css';

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
  title: 'Pricing | Pelican Trading',
  description: 'Simple, credit-based pricing for Pelican Trading. Pay for what you use with no hidden fees — plans starting at $29/month.',
  openGraph: {
    title: 'Pricing | Pelican Trading',
    description: 'Simple, credit-based pricing. Plans starting at $29/month.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Pelican Trading Pricing' }],
    type: 'website',
    siteName: 'Pelican Trading',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing | Pelican Trading',
    description: 'Simple, credit-based pricing. Plans starting at $29/month.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`marketing-page ${bebasNeue.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable}`}>
      <div className="grid-bg"></div>
      {children}
    </div>
  );
}
