'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/auth-provider';
import { useT } from '@/lib/providers/translation-provider';
import { LanguageSelector } from '@/components/language-selector';
import HelpChat from '@/components/marketing/HelpChat';
import './styles/marketing.css';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useT();

  const handleLaunchApp = () => {
    if (user) {
      router.push('/chat');
    } else {
      router.push('/auth/login');
    }
  };

  const handleSignUp = (plan?: string) => {
    if (plan) {
      router.push(`/auth/signup?plan=${plan}`);
    } else {
      router.push('/auth/signup');
    }
  };

  useEffect(() => {
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll, .feature-card').forEach(el => {
      observer.observe(el);
    });

    // Staggered animation for feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
      (card as HTMLElement).style.transitionDelay = `${index * 0.1}s`;
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="grid-bg"></div>

      <nav>
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <img src="/pelican-logo.png" alt="Pelican" />
            <span>Pelican</span>
          </Link>
          <div className="nav-links">
            <a href="#features">{t.marketing.nav.features}</a>
            <a href="#team">{t.marketing.nav.team}</a>
            <a href="#pricing">{t.marketing.nav.pricing}</a>
            <Link href="/faq">{t.marketing.nav.faq}</Link>
            <LanguageSelector />
            <button onClick={handleLaunchApp} className="btn-primary">{t.marketing.nav.launchApp}</button>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-tag">{t.marketing.hero.betaTag}</div>
            <h1>
              {t.marketing.hero.title1}<br />
              {t.marketing.hero.title2} <span className="highlight">{t.marketing.hero.titleHighlight}</span><br />
              {t.marketing.hero.title3}
            </h1>
            <p className="hero-subtitle">
              {t.marketing.hero.subtitle}
            </p>
            <div className="hero-cta">
              <button onClick={() => handleSignUp()} className="btn-primary">{t.marketing.hero.startTrading}</button>
              <a href="#features" className="btn-secondary">{t.marketing.hero.seeFeatures}</a>
            </div>
            <div className="stats-bar">
              <div className="stat">
                <div className="stat-value">{t.marketing.stats.tickersCovered}</div>
                <div className="stat-label">{t.marketing.stats.tickersCoveredLabel}</div>
              </div>
              <div className="stat">
                <div className="stat-value">{t.marketing.stats.plainEnglish}</div>
                <div className="stat-label">{t.marketing.stats.noCodeRequired}</div>
              </div>
              <div className="stat">
                <div className="stat-value">{t.marketing.stats.oneClick}</div>
                <div className="stat-label">{t.marketing.stats.shareableReports}</div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <img src="/pelican-logo.png" alt="Pelican Logo" className="hero-logo-large" />
          </div>
        </div>
      </section>

      <section className="what-section">
        <div className="section-inner">
          <div className="what-content">
            <div className="what-text animate-on-scroll">
              <h2>{t.marketing.what.title}</h2>
              <p>
                {t.marketing.what.description1}
              </p>
              <p>
                {t.marketing.what.description2}
              </p>
            </div>
            <div className="what-platform bracket-box animate-on-scroll">
              <div className="platform-header">
                <div className="platform-dot red"></div>
                <div className="platform-dot yellow"></div>
                <div className="platform-dot green"></div>
              </div>
              <div className="platform-line">
                <span className="platform-prompt">{t.marketing.what.platformPrompt}</span>{' '}
                <span className="platform-command">{t.marketing.what.platformCommand}</span>
              </div>
              <div className="platform-line">
                <span className="platform-output">{t.marketing.what.platformAnalyzing}</span>
              </div>
              <div className="platform-line">
                <span className="platform-success">✓</span>{' '}
                <span className="platform-output">{t.marketing.what.platformWinRate}</span>{' '}
                <span className="platform-value">67.4%</span>
              </div>
              <div className="platform-line">
                <span className="platform-success">✓</span>{' '}
                <span className="platform-output">{t.marketing.what.platformSharpe}</span>{' '}
                <span className="platform-value">1.84</span>
              </div>
              <div className="platform-line">
                <span className="platform-success">✓</span>{' '}
                <span className="platform-output">{t.marketing.what.platformDrawdown}</span>{' '}
                <span className="platform-value">-8.2%</span>
              </div>
              <div className="platform-line">
                <span className="platform-prompt">{t.marketing.what.platformResponse}</span>{' '}
                <span className="platform-command">{t.marketing.what.platformGenerating}<span className="cursor-blink">_</span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features">
        <div className="section-inner">
          <div className="section-header animate-on-scroll">
            <div className="section-tag">{t.marketing.features.sectionTag}</div>
            <h2 className="section-title">{t.marketing.features.title}</h2>
          </div>
          <div className="features-grid">
            <div className="feature-card bracket-box">
              <div className="feature-icon">💬</div>
              <h3>{t.marketing.features.justAsk}</h3>
              <p>{t.marketing.features.justAskDesc}</p>
            </div>
            <div className="feature-card bracket-box">
              <div className="feature-icon">🧪</div>
              <h3>{t.marketing.features.testIdeas}</h3>
              <p>{t.marketing.features.testIdeasDesc}</p>
            </div>
            <div className="feature-card bracket-box">
              <div className="feature-icon">🧠</div>
              <h3>{t.marketing.features.knowsStyle}</h3>
              <p>{t.marketing.features.knowsStyleDesc}</p>
            </div>
            <div className="feature-card bracket-box">
              <div className="feature-icon">🔍</div>
              <h3>{t.marketing.features.findsWhat}</h3>
              <p>{t.marketing.features.findsWhatDesc}</p>
            </div>
            <div className="feature-card bracket-box">
              <div className="feature-icon">📤</div>
              <h3>{t.marketing.features.sharePro}</h3>
              <p>{t.marketing.features.shareProDesc}</p>
            </div>
            <div className="feature-card bracket-box">
              <div className="feature-icon">🚫</div>
              <h3>{t.marketing.features.killChaos}</h3>
              <p>{t.marketing.features.killChaosDesc}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="every-trader-section">
        <div className="section-inner">
          <div className="section-header animate-on-scroll">
            <div className="section-tag">{t.marketing.traders.sectionTag}</div>
            <h2 className="section-title">{t.marketing.traders.title}</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '1.1rem' }}>{t.marketing.traders.subtitle}</p>
          </div>
          <div className="trader-comparison">
            <div className="trader-card bracket-box animate-on-scroll">
              <div className="trader-card-title">{t.marketing.traders.newTrader}</div>
              <div className="trader-question">{t.marketing.traders.newTraderQuestion}</div>
              <div className="trader-response">
                <p>Maybe—but only if buyers keep defending today&apos;s levels. As of 12:04 ET, TSLA is $425.21 (+2.8%) after bouncing from a low of $419.70, so dips are getting bought intraday.</p>
                <p>Simple plans for a new trader:</p>
                <div className="response-item">- Aggressive buy-the-dip: look for a pullback that holds 420–422, enter on a turn back up, risk a stop just below 419 (today&apos;s low). First target 429–430 (today&apos;s high), then 435 if momentum continues.</div>
                <div className="response-item">- Conservative: wait for a clean push and hold above 430, then buy a pullback toward 428–430, risk to ~423–425, target 435–440.</div>
                <p style={{ marginTop: '1rem' }}>If 419 breaks with volume and it can&apos;t reclaim quickly, skip it and wait for a better setup. Keep size small—TSLA moves fast—define your risk before you click.</p>
              </div>
            </div>
            <div className="trader-card bracket-box animate-on-scroll">
              <div className="trader-card-title">{t.marketing.traders.experiencedTrader}</div>
              <div className="trader-question">{t.marketing.traders.experiencedTraderQuestion}</div>
              <div className="trader-response">
                <p>QQQ closed down at least -3% and the 2-week (10 trading days) return that followed:</p>
                <div className="response-item">- 2025-03-07: -3.88% day, next 2 weeks: -2.2%</div>
                <div className="response-item">- 2025-04-02: -5.35% day, next 2 weeks: -6.71%</div>
                <div className="response-item">- 2025-04-03: -6.21% day, next 2 weeks: -1.46%</div>
                <div className="response-item">- 2025-04-09: -4.25% day, next 2 weeks: +0.29%</div>
                <div className="response-item">- 2025-04-15: -3.02% day, next 2 weeks: +3.82%</div>
                <p className="summary-title">Summary (2-week/10-trading-day follow-through):</p>
                <div className="response-item">- Count: 5</div>
                <div className="response-item">- Average: -1.26%</div>
                <div className="response-item">- Median: -1.46%</div>
                <div className="response-item">- Best: +3.82%</div>
                <div className="response-item">- Worst: -6.71%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="team">
        <div className="section-inner">
          <div className="section-header animate-on-scroll">
            <div className="section-tag">{t.marketing.team.sectionTag}</div>
            <h2 className="section-title">{t.marketing.team.title}</h2>
          </div>
          <div className="team-grid">
            <div className="team-card bracket-box animate-on-scroll">
              <div className="team-name">{t.marketing.team.nickName}</div>
              <div className="team-role">{t.marketing.team.nickRole}</div>
              <p className="team-bio">
                {t.marketing.team.nickBio}
              </p>
            </div>
            <div className="team-card bracket-box animate-on-scroll">
              <div className="team-name">{t.marketing.team.rayName}</div>
              <div className="team-role">{t.marketing.team.rayRole}</div>
              <p className="team-bio">
                {t.marketing.team.rayBio}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="languages-section">
        <div className="section-inner">
          <div className="section-header animate-on-scroll" style={{ textAlign: 'center', marginBottom: '0' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{t.marketing.languages.subtitle}</p>
          </div>
        </div>
      </section>

      <section id="pricing" className="pricing-section">
        <div className="section-inner">
          <div className="section-header animate-on-scroll">
            <div className="section-tag">{t.marketing.pricing.sectionTag}</div>
            <h2 className="section-title">{t.marketing.pricing.title}</h2>
          </div>

          {/* Credits Explainer */}
          <div className="credits-explainer animate-on-scroll">
            <h3>{t.marketing.pricing.howCreditsWork}</h3>
            <p>{t.marketing.pricing.creditsExplainer}</p>
            <div className="credit-types-grid">
              <div className="credit-type bracket-box">
                <div className="credit-type-name">{t.marketing.pricing.conversation}</div>
                <div className="credit-type-amount">{t.marketing.pricing.conversationCredits} <span>{t.marketing.pricing.credits}</span></div>
                <div className="credit-type-example">{t.marketing.pricing.conversationExample}</div>
              </div>
              <div className="credit-type bracket-box">
                <div className="credit-type-name">{t.marketing.pricing.basicAnalysis}</div>
                <div className="credit-type-amount">{t.marketing.pricing.basicAnalysisCredits} <span>{t.marketing.pricing.credits}</span></div>
                <div className="credit-type-example">{t.marketing.pricing.basicAnalysisExample}</div>
              </div>
              <div className="credit-type bracket-box">
                <div className="credit-type-name">{t.marketing.pricing.eventStudy}</div>
                <div className="credit-type-amount">{t.marketing.pricing.eventStudyCredits} <span>{t.marketing.pricing.credits}</span></div>
                <div className="credit-type-example">{t.marketing.pricing.eventStudyExample}</div>
              </div>
              <div className="credit-type bracket-box">
                <div className="credit-type-name">{t.marketing.pricing.deepAnalysis}</div>
                <div className="credit-type-amount">{t.marketing.pricing.deepAnalysisCredits} <span>{t.marketing.pricing.credits}</span></div>
                <div className="credit-type-example">{t.marketing.pricing.deepAnalysisExample}</div>
              </div>
            </div>
          </div>

          {/* Pricing Tiers */}
          <div className="pricing-tiers">
            {/* Starter Tier */}
            <div className="pricing-card bracket-box animate-on-scroll">
              <div className="pricing-tier-name">{t.marketing.pricing.starter}</div>
              <div className="pricing-for">{t.marketing.pricing.starterFor}</div>
              <div className="pricing-amount">{t.marketing.pricing.starterPrice}<span>{t.marketing.pricing.starterPeriod}</span></div>
              <div className="pricing-period">{t.marketing.pricing.cancelAnytime}</div>
              <div className="pricing-credits">
                <div className="pricing-credits-amount">{t.marketing.pricing.starterCredits}</div>
                <div className="pricing-credits-label">{t.marketing.pricing.starterCreditsLabel}</div>
              </div>
              <div className="pricing-effective">{t.marketing.pricing.starterEffective}</div>
              <div className="pricing-features">
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  {t.marketing.pricing.starterFeature1}
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  {t.marketing.pricing.starterFeature2}
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  {t.marketing.pricing.starterFeature3}
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  {t.marketing.pricing.starterFeature4}
                </div>
              </div>
              <button onClick={() => handleSignUp('starter')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                {t.marketing.pricing.starterButton}
              </button>
            </div>

            {/* Pro Tier */}
            <div className="pricing-card bracket-box featured animate-on-scroll">
              <div className="pricing-badge">{t.marketing.pricing.mostPopular}</div>
              <div className="pricing-tier-name">{t.marketing.pricing.pro}</div>
              <div className="pricing-for">{t.marketing.pricing.proFor}</div>
              <div className="pricing-amount">{t.marketing.pricing.proPrice}<span>{t.marketing.pricing.proPeriod}</span></div>
              <div className="pricing-period">{t.marketing.pricing.cancelAnytime}</div>
              <div className="pricing-credits">
                <div className="pricing-credits-amount">{t.marketing.pricing.proCredits}</div>
                <div className="pricing-credits-label">{t.marketing.pricing.proCreditsLabel}</div>
              </div>
              <div className="pricing-effective">{t.marketing.pricing.proEffective}</div>
              <div className="pricing-features">
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  {t.marketing.pricing.proFeature1}
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  {t.marketing.pricing.proFeature2}
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  {t.marketing.pricing.proFeature3}
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  {t.marketing.pricing.proFeature4}
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  {t.marketing.pricing.proFeature5}
                </div>
              </div>
              <button onClick={() => handleSignUp('pro')} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {t.marketing.pricing.proButton}
              </button>
            </div>

            {/* Power Tier */}
            <div className="pricing-card bracket-box animate-on-scroll">
              <div className="pricing-tier-name">{t.marketing.pricing.power}</div>
              <div className="pricing-for">{t.marketing.pricing.powerFor}</div>
              <div className="pricing-amount">{t.marketing.pricing.powerPrice}<span>{t.marketing.pricing.powerPeriod}</span></div>
              <div className="pricing-period">{t.marketing.pricing.cancelAnytime}</div>
              <div className="pricing-credits">
                <div className="pricing-credits-amount">{t.marketing.pricing.powerCredits}</div>
                <div className="pricing-credits-label">{t.marketing.pricing.powerCreditsLabel}</div>
              </div>
              <div className="pricing-effective">{t.marketing.pricing.powerEffective}</div>
              <div className="pricing-features">
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  {t.marketing.pricing.powerFeature1}
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  {t.marketing.pricing.powerFeature2}
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  {t.marketing.pricing.powerFeature3}
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  {t.marketing.pricing.powerFeature4}
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  {t.marketing.pricing.powerFeature5}
                </div>
              </div>
              <button onClick={() => handleSignUp('power')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                {t.marketing.pricing.powerButton}
              </button>
            </div>
          </div>

          {/* Market Comparison */}
          <div className="market-comparison animate-on-scroll">
            <h3>{t.marketing.pricing.marketComparison}</h3>
            <p>{t.marketing.pricing.marketComparisonDesc}</p>
            <div className="market-grid">
              <div className="market-item">
                <div className="market-item-name">{t.marketing.pricing.bloomberg}</div>
                <div className="market-item-price">~$24,000</div>
                <div className="market-item-annual">{t.marketing.pricing.perYear}</div>
              </div>
              <div className="market-item">
                <div className="market-item-name">{t.marketing.pricing.refinitiv}</div>
                <div className="market-item-price">~$22,000</div>
                <div className="market-item-annual">{t.marketing.pricing.perYear}</div>
              </div>
              <div className="market-item">
                <div className="market-item-name">{t.marketing.pricing.factset}</div>
                <div className="market-item-price">~$12,000</div>
                <div className="market-item-annual">{t.marketing.pricing.perYear}</div>
              </div>
              <div className="market-item pelican-item">
                <div className="market-item-name">{t.marketing.pricing.pelican}</div>
                <div className="market-item-price">$348 – $2,988</div>
                <div className="market-item-annual">{t.marketing.pricing.perYear}</div>
              </div>
            </div>
            <div className="savings-badge">{t.marketing.pricing.savingsBadge}</div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="section-inner animate-on-scroll">
          <h2>{t.marketing.cta.title1}<br />{t.marketing.cta.title2} <span style={{ color: 'var(--accent-purple)' }}>{t.marketing.cta.titleHighlight}</span></h2>
          <p>{t.marketing.cta.subtitle}</p>
          <button onClick={() => handleSignUp()} className="btn-primary">{t.marketing.cta.button}</button>
        </div>
      </section>

      <footer>
        <div className="footer-inner">
          <div className="footer-logo">
            <img src="/pelican-logo.png" alt="Pelican" />
            <span>Pelican Trading</span>
          </div>
          <div className="footer-links">
            <Link href="/terms">Terms of Use</Link>
            <Link href="/faq">FAQ</Link>
          </div>
          <div className="footer-copy">
            {t.marketing.footer.copyright}
          </div>
        </div>
      </footer>

      {/* Help Chat Widget */}
      <HelpChat logoUrl="/pelican-logo.png" />
    </>
  );
}

