import type { Metadata } from 'next';
import './styles/marketing.css';

export const metadata: Metadata = {
  title: 'Pelican Trading | AI Market Intelligence for Traders',
  description: 'The AI trading platform that thinks like you trade. Real-time market analysis, conversational backtesting, and institutional-grade intelligence—finally accessible to everyone.',
  icons: {
    icon: '/pelican-logo.png',
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      {children}
    </>
  );
}

