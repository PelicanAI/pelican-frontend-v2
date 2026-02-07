import type { Metadata } from 'next';
import HomePageContent from '@/components/marketing/HomePageContent';
import './styles/marketing.css';

export const metadata: Metadata = {
  title: { absolute: 'Pelican Trading | AI Market Intelligence for Traders' },
  description: 'The AI trading platform that thinks like you trade. Real-time market analysis, conversational backtesting, and institutional-grade intelligence — finally accessible to everyone.',
  alternates: {
    canonical: '/',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Pelican Trading',
  url: 'https://pelicantrading.ai',
  logo: 'https://pelicantrading.ai/pelican-logo-transparent.webp',
  description: 'AI-powered trading intelligence platform for traders of all levels.',
  foundingDate: '2025',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@pelicantrading.ai',
    contactType: 'customer support',
  },
};

const productJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Pelican Trading',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  description: 'AI-powered trading assistant with real-time market analysis, plain-English backtesting, and institutional-grade intelligence.',
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '29',
    highPrice: '249',
    priceCurrency: 'USD',
    offerCount: 3,
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <HomePageContent />
    </>
  );
}
