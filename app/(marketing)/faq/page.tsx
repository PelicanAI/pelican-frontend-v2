import type { Metadata } from 'next';
import FAQPageContent from '@/components/marketing/FAQPageContent';
import '../styles/marketing.css';
import '../styles/faq.css';

export const metadata: Metadata = {
  title: 'FAQ | Pelican Trading',
  description: 'Frequently asked questions about Pelican Trading — how it works, pricing, supported markets, data sources, and more.',
  alternates: {
    canonical: '/faq',
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Pelican Trading?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pelican is "Cursor for Traders" - an AI-powered trading intelligence platform that lets traders analyze markets, backtest strategies, and get insights using plain English instead of code.',
      },
    },
    {
      '@type': 'Question',
      name: 'Who is Pelican for?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pelican is designed for traders of all levels who want institutional-grade market intelligence without the complexity. Whether you\'re a day trader, swing trader, or long-term investor.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does Pelican\'s pricing work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pelican uses a credit-based pricing system. Credits represent analytical workload—simple queries cost fewer credits, complex analyses cost more. Three tiers: Base ($29/month), Pro ($99/month), and Power ($249/month).',
      },
    },
    {
      '@type': 'Question',
      name: 'How many tickers does Pelican cover?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pelican provides data on 10,000+ tickers covering US stocks, Foreign Exchange (FX), and cryptocurrencies.',
      },
    },
    {
      '@type': 'Question',
      name: 'What languages does Pelican support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pelican is available in 30+ languages including Chinese, Spanish, Japanese, Korean, French, German, Portuguese, Italian, Dutch, Russian, Turkish, Arabic, Polish, and many more.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the data real-time or delayed?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pelican provides both real-time and historical data. All subscribers get live data on 10,000+ tickers for up-to-the-minute market intelligence.',
      },
    },
  ],
};

export default function FAQ() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FAQPageContent />
    </>
  );
}
