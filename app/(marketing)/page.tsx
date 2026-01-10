'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/auth-provider';
import HelpChat from '@/components/marketing/HelpChat';
import './styles/marketing.css';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

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
            <a href="#features">Features</a>
            <a href="#team">Team</a>
            <a href="#pricing">Pricing</a>
            <Link href="/faq">FAQ</Link>
            <button onClick={handleLaunchApp} className="btn-primary">Launch App →</button>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-tag">Now in Beta</div>
            <h1>
              THE AI PLATFORM<br />
              THAT <span className="highlight">THINKS</span><br />
              LIKE YOU TRADE
            </h1>
            <p className="hero-subtitle">
              Institutional-grade market intelligence through natural conversation.
              Backtest strategies, analyze patterns, and execute with precision—all in one interface.
            </p>
            <div className="hero-cta">
              <button onClick={() => handleSignUp()} className="btn-primary">Start Trading →</button>
              <a href="#features" className="btn-secondary">See Features</a>
            </div>
            <div className="stats-bar">
              <div className="stat">
                <div className="stat-value">10K+</div>
                <div className="stat-label">Tickers Covered</div>
              </div>
              <div className="stat">
                <div className="stat-value">Plain English</div>
                <div className="stat-label">No Code Required</div>
              </div>
              <div className="stat">
                <div className="stat-value">1-Click</div>
                <div className="stat-label">Shareable Reports</div>
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
              <h2>CURSOR IS FOR DEVELOPERS.<br />PELICAN IS FOR TRADERS.</h2>
              <p>
                Stop juggling between TradingView, spreadsheets, and ChatGPT. Pelican is the unified
                AI platform that understands markets the way you do—through conversation.
              </p>
              <p>
                Ask complex questions. Get structured answers with real data. Share branded analysis
                with one click. This is how trading intelligence should work.
              </p>
            </div>
            <div className="what-platform bracket-box animate-on-scroll">
              <div className="platform-header">
                <div className="platform-dot red"></div>
                <div className="platform-dot yellow"></div>
                <div className="platform-dot green"></div>
              </div>
              <div className="platform-line">
                <span className="platform-prompt">you:</span>{' '}
                <span className="platform-command">backtest momentum strategy on SPY, last 6 months</span>
              </div>
              <div className="platform-line">
                <span className="platform-output">analyzing 126 trading sessions...</span>
              </div>
              <div className="platform-line">
                <span className="platform-success">✓</span>{' '}
                <span className="platform-output">Win rate:</span>{' '}
                <span className="platform-value">67.4%</span>
              </div>
              <div className="platform-line">
                <span className="platform-success">✓</span>{' '}
                <span className="platform-output">Sharpe ratio:</span>{' '}
                <span className="platform-value">1.84</span>
              </div>
              <div className="platform-line">
                <span className="platform-success">✓</span>{' '}
                <span className="platform-output">Max drawdown:</span>{' '}
                <span className="platform-value">-8.2%</span>
              </div>
              <div className="platform-line">
                <span className="platform-prompt">pelican:</span>{' '}
                <span className="platform-command">generating shareable report...<span className="cursor-blink">_</span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features">
        <div className="section-inner">
          <div className="section-header animate-on-scroll">
            <div className="section-tag">// What You Get</div>
            <h2 className="section-title">TRADING INTELLIGENCE, NOT ANOTHER TOOL TO LEARN</h2>
          </div>
          <div className="features-grid">
            <div className="feature-card bracket-box">
              <div className="feature-icon">💬</div>
              <h3>JUST ASK</h3>
              <p>Type questions like you&apos;d ask a trading buddy. &quot;What&apos;s moving in semis today?&quot; &quot;Show me SPY&apos;s worst drawdowns.&quot; No syntax, no learning curve.</p>
            </div>
            <div className="feature-card bracket-box">
              <div className="feature-icon">🧪</div>
              <h3>TEST IDEAS IN SECONDS</h3>
              <p>Describe any strategy in plain English and see if it actually works. Win rates, drawdowns, Sharpe ratios—without writing a single line of code.</p>
            </div>
            <div className="feature-card bracket-box">
              <div className="feature-icon">🧠</div>
              <h3>KNOWS YOUR STYLE</h3>
              <p>Pelican remembers your positions, your watchlist, and how you like to trade. Every conversation picks up where you left off.</p>
            </div>
            <div className="feature-card bracket-box">
              <div className="feature-icon">🔍</div>
              <h3>FINDS WHAT YOU&apos;D MISS</h3>
              <p>Surface unusual volume, divergences, and setups across thousands of tickers. Let AI do the scanning while you focus on decisions.</p>
            </div>
            <div className="feature-card bracket-box">
              <div className="feature-icon">📤</div>
              <h3>SHARE &amp; LOOK PRO</h3>
              <p>Generate branded tables and analysis ready for Twitter, Discord, or clients. One click from insight to shareable content.</p>
            </div>
            <div className="feature-card bracket-box">
              <div className="feature-icon">🚫</div>
              <h3>KILL THE TAB CHAOS</h3>
              <p>Stop bouncing between TradingView, spreadsheets, and ChatGPT. One interface for research, analysis, and idea generation.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="every-trader-section">
        <div className="section-inner">
          <div className="section-header animate-on-scroll">
            <div className="section-tag">// For Everyone</div>
            <h2 className="section-title">PELICAN FOR EVERY TRADER</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '1.1rem' }}>Whether you&apos;re just starting or managing millions, Pelican speaks your language</p>
          </div>
          <div className="trader-comparison">
            <div className="trader-card bracket-box animate-on-scroll">
              <div className="trader-card-title">New to Trading</div>
              <div className="trader-question">Is this TSLA dip worth buying?</div>
              <div className="trader-response">
                <p>Maybe—but only if buyers keep defending today&apos;s levels. As of 12:04 ET, TSLA is $425.21 (+2.8%) after bouncing from a low of $419.70, so dips are getting bought intraday.</p>
                <p>Simple plans for a new trader:</p>
                <div className="response-item">- Aggressive buy-the-dip: look for a pullback that holds 420–422, enter on a turn back up, risk a stop just below 419 (today&apos;s low). First target 429–430 (today&apos;s high), then 435 if momentum continues.</div>
                <div className="response-item">- Conservative: wait for a clean push and hold above 430, then buy a pullback toward 428–430, risk to ~423–425, target 435–440.</div>
                <p style={{ marginTop: '1rem' }}>If 419 breaks with volume and it can&apos;t reclaim quickly, skip it and wait for a better setup. Keep size small—TSLA moves fast—define your risk before you click.</p>
              </div>
            </div>
            <div className="trader-card bracket-box animate-on-scroll">
              <div className="trader-card-title">Experienced Trader</div>
              <div className="trader-question">The QQQ&apos;s closed down over -3% today. Using QQQ data for 2025, find every instance the QQQ&apos;s closed down -3% in a single day, and give me the 2 week return of the QQQ&apos;s following that event.</div>
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
            <div className="section-tag">// The Team</div>
            <h2 className="section-title">BUILT BY TRADERS, FOR TRADERS</h2>
          </div>
          <div className="team-grid">
            <div className="team-card bracket-box animate-on-scroll">
              <div className="team-name">NICK GROVES</div>
              <div className="team-role">Founder &amp; CEO</div>
              <p className="team-bio">
                Eight years across futures, FX, and digital assets. Former crypto arbitrage systems architect turned
                systems-driven strategist. Founded Pelican to challenge the industry&apos;s dependence on opaque tools
                and build an AI that thinks the way real traders operate—structured, contextual, and brutally honest.
              </p>
            </div>
            <div className="team-card bracket-box animate-on-scroll">
              <div className="team-name">RAYMOND CAMPBELL</div>
              <div className="team-role">Senior Architect</div>
              <p className="team-bio">
                Two decades building mission-critical financial infrastructure. Led NYSE&apos;s transition to electronic
                trading at Labranche, architecting ultra-low latency systems across 800+ symbols. Deep expertise
                in C++ high-performance systems, exchange connectivity, and modern crypto infrastructure.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="languages-section">
        <div className="section-inner">
          <div className="section-header animate-on-scroll">
            <div className="section-tag">// Global</div>
            <h2 className="section-title">AVAILABLE IN 30+ LANGUAGES</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '1.1rem' }}>Pelican speaks your language, wherever you trade</p>
          </div>
          <div className="languages-grid animate-on-scroll">
            <div className="language-tag">Chinese</div>
            <div className="language-tag">Spanish</div>
            <div className="language-tag">Japanese</div>
            <div className="language-tag">Korean</div>
            <div className="language-tag">French</div>
            <div className="language-tag">German</div>
            <div className="language-tag">Portuguese</div>
            <div className="language-tag">Italian</div>
            <div className="language-tag">Dutch</div>
            <div className="language-tag">Russian</div>
            <div className="language-tag">Turkish</div>
            <div className="language-tag">Arabic</div>
            <div className="language-tag">Polish</div>
            <div className="language-tag">Czech</div>
            <div className="language-tag">Slovak</div>
            <div className="language-tag">Hungarian</div>
            <div className="language-tag">Romanian</div>
            <div className="language-tag">Greek</div>
            <div className="language-tag">Swedish</div>
            <div className="language-tag">Danish</div>
            <div className="language-tag">Norwegian</div>
            <div className="language-tag">Finnish</div>
            <div className="language-tag">Ukrainian</div>
            <div className="language-tag">Hebrew</div>
            <div className="language-tag">Indonesian</div>
            <div className="language-tag">Malay</div>
            <div className="language-tag">Vietnamese</div>
            <div className="language-tag">Thai</div>
            <div className="language-tag">Filipino/Tagalog</div>
          </div>
        </div>
      </section>

      <section id="pricing" className="pricing-section">
        <div className="section-inner">
          <div className="section-header animate-on-scroll">
            <div className="section-tag">// Pricing</div>
            <h2 className="section-title">CREDIT-BASED PRICING THAT SCALES WITH YOU</h2>
          </div>

          {/* Credits Explainer */}
          <div className="credits-explainer animate-on-scroll">
            <h3>HOW CREDITS WORK</h3>
            <p>Credits represent analytical workload, not raw API calls. Simple questions cost less. Complex analysis costs more. You always know what you&apos;re spending.</p>
            <div className="credit-types-grid">
              <div className="credit-type bracket-box">
                <div className="credit-type-name">Conversation</div>
                <div className="credit-type-amount">2 <span>credits</span></div>
                <div className="credit-type-example">&quot;What&apos;s a moving average?&quot;</div>
              </div>
              <div className="credit-type bracket-box">
                <div className="credit-type-name">Price Check</div>
                <div className="credit-type-amount">10 <span>credits</span></div>
                <div className="credit-type-example">&quot;What&apos;s AAPL trading at?&quot;</div>
              </div>
              <div className="credit-type bracket-box">
                <div className="credit-type-name">Basic Analysis</div>
                <div className="credit-type-amount">25 <span>credits</span></div>
                <div className="credit-type-example">&quot;Is NVDA overbought?&quot;</div>
              </div>
              <div className="credit-type bracket-box">
                <div className="credit-type-name">Event Study</div>
                <div className="credit-type-amount">75 <span>credits</span></div>
                <div className="credit-type-example">&quot;How does SPY react after CPI?&quot;</div>
              </div>
              <div className="credit-type bracket-box">
                <div className="credit-type-name">Deep Analysis</div>
                <div className="credit-type-amount">200 <span>credits</span></div>
                <div className="credit-type-example">&quot;Backtest this strategy 1 year&quot;</div>
              </div>
            </div>
          </div>

          {/* Pricing Tiers */}
          <div className="pricing-tiers">
            {/* Starter Tier */}
            <div className="pricing-card bracket-box animate-on-scroll">
              <div className="pricing-tier-name">STARTER</div>
              <div className="pricing-for">Exploration &amp; Learning</div>
              <div className="pricing-amount">$29<span>/mo</span></div>
              <div className="pricing-period">Cancel anytime</div>
              <div className="pricing-credits">
                <div className="pricing-credits-amount">1,000</div>
                <div className="pricing-credits-label">credits / month</div>
              </div>
              <div className="pricing-effective">~$0.029 per credit</div>
              <div className="pricing-features">
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  Full AI assistant access
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  Live data on 10,000+ tickers
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  Trading education &amp; coaching
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  Basic technical analysis
                </div>
              </div>
              <button onClick={() => handleSignUp('starter')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                Get Started →
              </button>
            </div>

            {/* Pro Tier */}
            <div className="pricing-card bracket-box featured animate-on-scroll">
              <div className="pricing-badge">Most Popular</div>
              <div className="pricing-tier-name">PRO</div>
              <div className="pricing-for">Active Traders</div>
              <div className="pricing-amount">$99<span>/mo</span></div>
              <div className="pricing-period">Cancel anytime</div>
              <div className="pricing-credits">
                <div className="pricing-credits-amount">3,500</div>
                <div className="pricing-credits-label">credits / month</div>
              </div>
              <div className="pricing-effective">~$0.028 per credit</div>
              <div className="pricing-features">
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  Everything in Starter
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  Plain-English backtesting
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  Event studies &amp; correlation
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  One-click shareable reports
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  Remembers your trading context
                </div>
              </div>
              <button onClick={() => handleSignUp('pro')} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Start Trading →
              </button>
            </div>

            {/* Power Tier */}
            <div className="pricing-card bracket-box animate-on-scroll">
              <div className="pricing-tier-name">POWER</div>
              <div className="pricing-for">Heavy &amp; Professional Users</div>
              <div className="pricing-amount">$249<span>/mo</span></div>
              <div className="pricing-period">Cancel anytime</div>
              <div className="pricing-credits">
                <div className="pricing-credits-amount">10,000</div>
                <div className="pricing-credits-label">credits / month</div>
              </div>
              <div className="pricing-effective">~$0.025 per credit</div>
              <div className="pricing-features">
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  Everything in Pro
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  Multi-day tick analysis
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  Institutional flow detection
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  Extended backtest periods
                </div>
                <div className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  Priority support
                </div>
              </div>
              <button onClick={() => handleSignUp('power')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                Go Power →
              </button>
            </div>
          </div>

          {/* Market Comparison */}
          <div className="market-comparison animate-on-scroll">
            <h3>INSTITUTIONAL INTELLIGENCE. RETAIL PRICING.</h3>
            <p>Pelican delivers the analysis power of institutional terminals at a fraction of the cost.</p>
            <div className="market-grid">
              <div className="market-item">
                <div className="market-item-name">Bloomberg</div>
                <div className="market-item-price">~$24,000</div>
                <div className="market-item-annual">per year</div>
              </div>
              <div className="market-item">
                <div className="market-item-name">Refinitiv Eikon</div>
                <div className="market-item-price">~$22,000</div>
                <div className="market-item-annual">per year</div>
              </div>
              <div className="market-item">
                <div className="market-item-name">FactSet</div>
                <div className="market-item-price">~$12,000</div>
                <div className="market-item-annual">per year</div>
              </div>
              <div className="market-item pelican-item">
                <div className="market-item-name">Pelican</div>
                <div className="market-item-price">$348 – $2,988</div>
                <div className="market-item-annual">per year</div>
              </div>
            </div>
            <div className="savings-badge">~99% CHEAPER THAN INSTITUTIONAL TERMINALS</div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="section-inner animate-on-scroll">
          <h2>STOP SEARCHING.<br />START <span style={{ color: 'var(--accent-purple)' }}>ASKING.</span></h2>
          <p>Join traders who&apos;ve upgraded from scattered tools to unified intelligence.</p>
          <button onClick={() => handleSignUp()} className="btn-primary">Launch Pelican →</button>
        </div>
      </section>

      <footer>
        <div className="footer-inner">
          <div className="footer-logo">
            <img src="/pelican-logo.png" alt="Pelican" />
            <span>Pelican Trading</span>
          </div>
          <div className="footer-copy">
            © 2025 Pelican Trading. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Help Chat Widget */}
      <HelpChat logoUrl="/pelican-logo.png" />
    </>
  );
}

