'use client';

import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/auth-provider';
import { useT } from '@/lib/providers/translation-provider';
import { LanguageSelector } from '@/components/language-selector';
import HelpChat from '@/components/marketing/HelpChat';
import DemoCard from '@/components/how-to-use/DemoCard';
import '../styles/marketing.css';
import './how-to-use.css';

// Demo content data
const traderDemos = [
  {
    skillLevel: 'beginner' as const,
    title: 'Natural Language Scanning',
    description:
      'Ask Pelican to find stocks in plain English. No complex screener setup, no syntax to learn — just describe what you\'re looking for.',
    examplePrompt: 'Show me stocks getting hammered today',
    features: ['Plain English', 'Instant Results', 'No Setup Required'],
    demoSrc: '/demos/how-to-use/trader-beginner.html',
  },
  {
    skillLevel: 'intermediate' as const,
    title: 'Multi-Filter Stock Scanning',
    description:
      'Combine multiple criteria in a single query. Price, volume, percentage moves, VWAP — stack as many filters as you need.',
    examplePrompt:
      'Show me US stocks down at least -3% today trading above $20 and trading at least 1.8x their normal volume',
    features: ['Multiple Filters', 'Volume Analysis', 'Real-Time Data'],
    demoSrc: '/demos/how-to-use/trader-intermediate.html',
  },
  {
    skillLevel: 'advanced' as const,
    title: 'Custom Backtesting',
    description:
      'Run sophisticated backtests with tick data, custom indicators, and full statistical output. Get results in seconds, not hours.',
    examplePrompt:
      'Backtest AAPL with 20-trade rolling EMA on tick data. Return P&L, win rate, max drawdown, and sensitivity analysis.',
    features: ['Tick Data', 'Custom Indicators', 'Statistical Output'],
    demoSrc: '/demos/how-to-use/trader-advanced.html',
  },
];

const investorDemos = [
  {
    skillLevel: 'beginner' as const,
    title: 'Understand Any Company',
    description:
      'Get clear, jargon-free explanations of what a company does, how it makes money, and why it\'s in the news.',
    examplePrompt: 'What does NVIDIA do and why is everyone talking about it?',
    features: ['Plain English', 'Business Model', 'Context'],
    demoSrc: '/demos/how-to-use/investor-beginner.html',
  },
  {
    skillLevel: 'intermediate' as const,
    title: 'Historical Analysis',
    description:
      'Query historical events, price patterns, and market milestones instantly. Years of data at your fingertips.',
    examplePrompt: 'How many All Time Highs did AAPL have in 2021?',
    features: ['Historical Data', 'Pattern Recognition', 'Quick Answers'],
    demoSrc: '/demos/how-to-use/investor-intermediate.html',
  },
  {
    skillLevel: 'advanced' as const,
    title: 'Cross-Ticker Analysis',
    description:
      'Analyze relationships between stocks, compare performance around events, and uncover correlations that take hours to find manually.',
    examplePrompt:
      "Show me all 27 dates when AAPL hit ATHs in 2021 with MSFT's 5-day return for each",
    features: ['Multi-Ticker', 'Event Correlation', 'Deep Analysis'],
    demoSrc: '/demos/how-to-use/investor-advanced.html',
  },
];

export default function HowToUsePage() {
  const router = useRouter();
  useAuth(); // Keep auth context active
  const t = useT();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'traders' | 'investors'>('traders');
  const topRef = useRef<HTMLDivElement>(null);
  const pendingScrollRestoreRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  const handleLaunchApp = () => {
    router.push('/auth/login');
  };

  const handleSignUp = () => {
    router.push('/auth/signup');
  };

  useEffect(() => {
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [activeTab]); // Re-run when tab changes to observe new elements

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileNavOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preserve scroll position when switching tabs (iframes can trigger jumps)
  useLayoutEffect(() => {
    if (!pendingScrollRestoreRef.current) return;

    const marketingPage = document.querySelector('.marketing-page') as HTMLElement | null;
    const restore = () => {
      window.scrollTo({ top: lastScrollTopRef.current, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = lastScrollTopRef.current;
      document.body.scrollTop = lastScrollTopRef.current;
      if (marketingPage) {
        marketingPage.scrollTop = lastScrollTopRef.current;
      }
    };

    restore();
    const timers = [0, 50, 150].map((delay) => setTimeout(restore, delay));
    pendingScrollRestoreRef.current = false;
    return () => timers.forEach(clearTimeout);
  }, [activeTab]);

  // Force scroll to top on page load - must run before paint
  useLayoutEffect(() => {
    // Disable smooth scrolling on the marketing page container
    const marketingPage = document.querySelector('.marketing-page');
    if (marketingPage) {
      (marketingPage as HTMLElement).style.scrollBehavior = 'auto';
      marketingPage.classList.add('no-smooth-scroll');
      marketingPage.scrollTop = 0;
    }

    // Also disable on html and body
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.scrollBehavior = 'auto';

    // Immediate scroll
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (marketingPage) {
      marketingPage.scrollTop = 0;
    }

    // Also scroll the ref element into view
    topRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });

    // Multiple delayed scrolls to handle iframes loading
    const timers = [50, 100, 200, 500, 1000].map((delay) =>
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        if (marketingPage) {
          marketingPage.scrollTop = 0;
        }
      }, delay)
    );

    return () => {
      timers.forEach(clearTimeout);
      // Restore smooth scroll on unmount
      if (marketingPage) {
        (marketingPage as HTMLElement).style.scrollBehavior = '';
        marketingPage.classList.remove('no-smooth-scroll');
      }
      document.documentElement.style.scrollBehavior = '';
      document.body.style.scrollBehavior = '';
    };
  }, []);

  const currentDemos = activeTab === 'traders' ? traderDemos : investorDemos;
  const handleTabChange = (tab: 'traders' | 'investors') => {
    if (tab === activeTab) return;
    lastScrollTopRef.current = window.scrollY;
    pendingScrollRestoreRef.current = true;
    setActiveTab(tab);
  };

  return (
    <div className="how-to-use-page">
      <div ref={topRef} className="grid-bg"></div>

      {/* Navigation */}
      <nav>
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <img src="/pelican-logo-transparent.png" alt="Pelican" />
            <span>Pelican</span>
          </Link>
          <div className="nav-links">
            <Link href="/#features">{t.marketing.nav.features}</Link>
            <Link href="/how-to-use" className="active">
              How to Use
            </Link>
            <Link href="/#team">{t.marketing.nav.team}</Link>
            <Link href="/#pricing">{t.marketing.nav.pricing}</Link>
            <Link href="/faq">{t.marketing.nav.faq}</Link>
            <LanguageSelector />
            <button onClick={handleLaunchApp} className="btn-primary">
              {t.marketing.nav.launchApp}
            </button>
          </div>
          <button
            type="button"
            className="nav-toggle"
            aria-label="Open menu"
            aria-expanded={mobileNavOpen}
            aria-controls="marketing-mobile-nav"
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <span className="nav-toggle-line" />
            <span className="nav-toggle-line" />
            <span className="nav-toggle-line" />
          </button>
        </div>
        <div
          id="marketing-mobile-nav"
          className={`nav-mobile ${mobileNavOpen ? 'open' : ''}`}
        >
          <div className="nav-mobile-inner">
            <Link href="/#features" onClick={() => setMobileNavOpen(false)}>
              {t.marketing.nav.features}
            </Link>
            <Link
              href="/how-to-use"
              onClick={() => setMobileNavOpen(false)}
              className="active"
            >
              How to Use
            </Link>
            <Link href="/#team" onClick={() => setMobileNavOpen(false)}>
              {t.marketing.nav.team}
            </Link>
            <Link href="/#pricing" onClick={() => setMobileNavOpen(false)}>
              {t.marketing.nav.pricing}
            </Link>
            <Link href="/faq" onClick={() => setMobileNavOpen(false)}>
              {t.marketing.nav.faq}
            </Link>
            <LanguageSelector />
            <button
              onClick={() => {
                setMobileNavOpen(false);
                handleLaunchApp();
              }}
              className="btn-primary"
            >
              {t.marketing.nav.launchApp}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="how-to-use-hero">
        <div className="section-inner">
          <div className="hero-content animate-on-scroll" style={{ textAlign: 'center' }}>
            <div className="section-tag">{'// TUTORIALS'}</div>
            <h1 className="section-title">See Pelican in Action</h1>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '1.25rem',
                maxWidth: '700px',
                margin: '1.5rem auto 0',
                lineHeight: 1.7,
              }}
            >
              Watch how Pelican transforms complex market questions into instant insights.
            </p>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="tabs-section">
        <div className="section-inner">
          <div className="tabs-container animate-on-scroll">
            <button
              className={`tab-button ${activeTab === 'traders' ? 'active' : ''}`}
              onClick={() => handleTabChange('traders')}
            >
              For Traders
            </button>
            <button
              className={`tab-button ${activeTab === 'investors' ? 'active' : ''}`}
              onClick={() => handleTabChange('investors')}
            >
              For Investors
            </button>
          </div>
        </div>
      </section>

      {/* Demo Sections */}
      <section className="demos-section">
        <div className="section-inner">
          <div className="demos-container">
            {currentDemos.map((demo, index) => (
              <DemoCard
                key={`${activeTab}-${index}`}
                skillLevel={demo.skillLevel}
                title={demo.title}
                description={demo.description}
                examplePrompt={demo.examplePrompt}
                features={demo.features}
                demoSrc={demo.demoSrc}
                reverse={index % 2 === 1}
                audience={activeTab === 'traders' ? 'trader' : 'investor'}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-inner animate-on-scroll">
          <h2>
            Ready to Trade
            <br />
            <span style={{ color: 'var(--accent-purple)' }}>Smarter?</span>
          </h2>
          <p>Join traders and investors who are already using Pelican.</p>
          <button onClick={handleSignUp} className="btn-primary">
            Sign Up Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-inner">
          <div className="footer-logo">
            <img src="/pelican-logo-transparent.png" alt="Pelican" />
            <span>Pelican Trading</span>
          </div>
          <div className="footer-links">
            <Link href="/terms">Terms of Use</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/faq">FAQ</Link>
          </div>
          <div className="footer-copy">{t.marketing.footer.copyright}</div>
        </div>
      </footer>

      {/* Help Chat Widget */}
      <HelpChat logoUrl="/pelican-logo-transparent.png" />
    </div>
  );
}
