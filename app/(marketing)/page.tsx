import type { Metadata } from 'next';
import Image from 'next/image';
import HomePageContent from '@/components/marketing/HomePageContent';
import SignUpButton from '@/components/marketing/SignUpButton';
import HeroChatDemoLoader from '@/components/marketing/HeroChatDemoLoader';

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
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-tag">Now in Beta</div>
            <h1>
              Stop Searching.<br />
              Start Asking.
            </h1>
            <p className="hero-subtitle">
              Pelican gives you institutional-grade market analysis in plain English. No scanners. No spreadsheets. No guesswork.
            </p>
            <div className="hero-cta">
              <SignUpButton className="btn-primary">Try For Free →</SignUpButton>
              <a href="#features" className="btn-secondary">See Features</a>
            </div>
            <p className="hero-free-explainer">10 free questions. No credit card required.</p>
            <div className="stats-bar">
              <div className="stat">
                <div className="stat-value">99%</div>
                <div className="stat-label">Cheaper Than Bloomberg</div>
              </div>
              <div className="stat">
                <div className="stat-value">10K+</div>
                <div className="stat-label">Tickers Covered</div>
              </div>
              <div className="stat">
                <div className="stat-value">30+</div>
                <div className="stat-label">Languages</div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <Image
              src="/pelican-logo-transparent.webp"
              alt="Pelican Trading"
              width={520}
              height={520}
              className="hero-logo-large"
              priority
            />
          </div>
        </div>
      </section>
      <section className="hero-demo-section">
        <div className="hero-demo-inner">
          <HeroChatDemoLoader />
        </div>
      </section>
      <HomePageContent />
    </>
  );
}
