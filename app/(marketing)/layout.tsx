import type { Metadata } from 'next';
import { Bebas_Neue, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
import './styles/marketing.css';

const bebasNeue = Bebas_Neue({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue',
});

const ibmPlexSans = IBM_Plex_Sans({ 
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ibm-plex',
});

const jetbrainsMono = JetBrains_Mono({ 
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: 'Pelican Trading | AI Market Intelligence for Traders',
  description: 'The AI trading platform that thinks like you trade. Real-time market analysis, conversational backtesting, and institutional-grade intelligence—finally accessible to everyone.',
  icons: {
    icon: '/pelican-logo-transparent.png',
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