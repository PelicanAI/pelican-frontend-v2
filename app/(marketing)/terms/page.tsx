'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/auth-provider';
import HelpChat from '@/components/marketing/HelpChat';
import '../styles/marketing.css';
import '../styles/terms.css';

export default function TermsOfUse() {
  const router = useRouter();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      router.push('/chat');
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <>
      <div className="grid-bg"></div>

      <nav>
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <img src="/pelican-logo-transparent.png" alt="Pelican" />
            <span>Pelican</span>
          </Link>
          <div className="nav-links">
            <Link href="/#features">Features</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/faq">FAQ</Link>
            <button onClick={handleGetStarted} className="btn-primary">Get Started →</button>
          </div>
        </div>
      </nav>

      <main className="terms-page">
        <div className="terms-container">
          <header className="terms-header">
            <div className="terms-tag">Legal</div>
            <h1>
              Terms and <span className="highlight">Conditions</span> of Service
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '1rem' }}>
              PELICAN TRADING, LLC
            </p>
            <div className="terms-meta">
              <span>Effective Date: 11/23/2025</span>
              <span>|</span>
              <span>Last Updated: 11/23/2025</span>
            </div>
          </header>

          {/* Table of Contents */}
          <div className="terms-toc">
            <div className="terms-toc-title">Table of Contents</div>
            <ol className="terms-toc-list">
              <li><a href="#section-1"><span className="toc-number">1.</span>Acceptance of Terms</a></li>
              <li><a href="#section-2"><span className="toc-number">2.</span>Nature of Services - Critical Disclaimers</a></li>
              <li><a href="#section-3"><span className="toc-number">3.</span>AI-Generated Content Disclaimers</a></li>
              <li><a href="#section-4"><span className="toc-number">4.</span>Market Data and Information</a></li>
              <li><a href="#section-5"><span className="toc-number">5.</span>Risk Disclosures</a></li>
              <li><a href="#section-6"><span className="toc-number">6.</span>Prohibited Uses</a></li>
              <li><a href="#section-7"><span className="toc-number">7.</span>Intellectual Property</a></li>
              <li><a href="#section-8"><span className="toc-number">8.</span>Limitation of Liability</a></li>
              <li><a href="#section-9"><span className="toc-number">9.</span>Indemnification</a></li>
              <li><a href="#section-10"><span className="toc-number">10.</span>Disclaimers of Warranties</a></li>
              <li><a href="#section-11"><span className="toc-number">11.</span>Dispute Resolution</a></li>
              <li><a href="#section-12"><span className="toc-number">12.</span>Data and Privacy</a></li>
              <li><a href="#section-13"><span className="toc-number">13.</span>API and Technical Terms</a></li>
              <li><a href="#section-14"><span className="toc-number">14.</span>Compliance and Regulatory</a></li>
              <li><a href="#section-15"><span className="toc-number">15.</span>Beta Features</a></li>
              <li><a href="#section-16"><span className="toc-number">16.</span>Termination</a></li>
              <li><a href="#section-17"><span className="toc-number">17.</span>Enterprise Terms</a></li>
              <li><a href="#section-18"><span className="toc-number">18.</span>Miscellaneous Provisions</a></li>
              <li><a href="#section-19"><span className="toc-number">19.</span>Specific Risk Warnings</a></li>
              <li><a href="#section-20"><span className="toc-number">20.</span>Regulatory Disclosures</a></li>
              <li><a href="#section-21"><span className="toc-number">21.</span>Future Services Disclaimer</a></li>
              <li><a href="#section-22"><span className="toc-number">22.</span>Communications</a></li>
              <li><a href="#section-23"><span className="toc-number">23.</span>Acknowledgments</a></li>
              <li><a href="#section-24"><span className="toc-number">24.</span>Questions and Contact</a></li>
              <li><a href="#section-25"><span className="toc-number">25.</span>Limitations of Interpretation</a></li>
            </ol>
          </div>

          <div className="terms-content">
            {/* Section 1 */}
            <section id="section-1" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">1</span>
                Acceptance of Terms
              </h2>
              
              <div className="terms-subsection">
                <h3 className="terms-subsection-title">1.1 Binding Agreement</h3>
                <p className="terms-text">
                  These Terms and Conditions of Service (the &quot;Terms,&quot; &quot;Agreement,&quot; or &quot;TOS&quot;) constitute a legally binding agreement between you (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;) and Pelican Trading, LLC, a Delaware limited liability company (&quot;Pelican,&quot; &quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), governing your access to and use of the Pelican platform, services, websites, applications, APIs, tools, and all related software and documentation (collectively, the &quot;Services&quot;).
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">1.2 Acceptance Required</h3>
                <p className="terms-text">
                  By accessing, browsing, or using the Services in any manner, including but not limited to visiting or browsing the website, registering an account, or accessing any content, information, or materials, you agree to be bound by these Terms. If you do not agree to all provisions of these Terms, you are not authorized to access or use the Services and must immediately cease all use.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">1.3 Capacity to Contract</h3>
                <p className="terms-text">You represent and warrant that you:</p>
                <ul className="terms-list-roman">
                  <li>are at least eighteen (18) years of age;</li>
                  <li>have the legal capacity to enter into binding contracts;</li>
                  <li>are not prohibited by applicable law from using the Services; and</li>
                  <li>will comply with all applicable laws and regulations in your use of the Services.</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">1.4 Modifications</h3>
                <p className="terms-text">
                  We reserve the right to modify these Terms at any time in our sole discretion. Material changes will be notified via email or prominent notice on the Services. Continued use after such modifications constitutes acceptance of the updated Terms.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">2</span>
                Nature of Services - Critical Disclaimers
              </h2>

              <div className="terms-notice warning">
                <p>THE SERVICES ARE PROVIDED STRICTLY FOR INFORMATIONAL AND EDUCATIONAL PURPOSES ONLY.</p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">2.1 Educational Purpose Only</h3>
                <p className="terms-text terms-warning-text">
                  PELICAN IS NOT A BROKER-DEALER, INVESTMENT ADVISOR, FINANCIAL ADVISOR, COMMODITY TRADING ADVISOR, FINANCIAL PLANNER, FIDUCIARY, OR TAX ADVISOR. THE SERVICES DO NOT CONSTITUTE INVESTMENT ADVICE, FINANCIAL ADVICE, TRADING ADVICE, TAX ADVICE, LEGAL ADVICE, OR ANY OTHER FORM OF PROFESSIONAL ADVICE.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">2.2 No Recommendations</h3>
                <p className="terms-text">
                  Nothing provided through the Services should be construed as a recommendation to buy, sell, hold, or otherwise transact in any security, derivative, commodity, or financial instrument. All content is general in nature and does not take into account your individual circumstances, financial situation, objectives, or risk tolerance.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">2.3 No Fiduciary Relationship</h3>
                <p className="terms-text terms-warning-text">
                  NO FIDUCIARY, ADVISORY, OR SIMILAR RELATIONSHIP IS CREATED BETWEEN YOU AND PELICAN. We do not owe you any fiduciary duties, which means we do not act in your best interests and are not required to disclose any conflicts of interest.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">2.4 Independent Verification Required</h3>
                <p className="terms-text">
                  You acknowledge and agree that you must independently verify all information, data, calculations, analysis, and content provided through the Services before making any decisions. Do not rely solely on the Services for any purpose.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">2.5 No Personalized Advisory Relationship</h3>
                <p className="terms-text terms-warning-text">
                  PELICAN DOES NOT TAILOR, CUSTOMIZE, OR PERSONALIZE ANY OUTPUTS, ANALYSIS, OR INFORMATION TO ANY INDIVIDUAL USER&apos;S FINANCIAL SITUATION, INVESTMENT OBJECTIVES, RISK TOLERANCE, OR PERSONAL CIRCUMSTANCES.
                </p>
                <p className="terms-text">All responses generated by the Services are generic, educational, and non-specific to any user. The Services do not and cannot:</p>
                <ul className="terms-list">
                  <li>Consider your personal financial circumstances</li>
                  <li>Provide suitability analysis for any investment or strategy</li>
                  <li>Assess appropriateness of any financial product for your situation</li>
                  <li>Account for your individual tax situation, investment horizon, or liquidity needs</li>
                  <li>Create, imply, or establish any personalized advisory relationship</li>
                </ul>
                <div className="terms-notice important">
                  <p>YOUR PROVISION OF PERSONAL INFORMATION OR TRADING PARAMETERS DOES NOT CREATE A PERSONALIZED SERVICE. Any appearance of customization is algorithmic and does not constitute tailored financial advice. You are expressly prohibited from relying on any outputs as a basis for trading decisions.</p>
                </div>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">2.6 Regulatory Non-Advice Firewall</h3>
                <p className="terms-text terms-warning-text">
                  THE SERVICES DO NOT PROVIDE REGULATORY INTERPRETATION, COMPLIANCE GUIDANCE, TAX STRATEGY, OR LEGAL ANALYSIS.
                </p>
                <p className="terms-text">Pelican does not and cannot:</p>
                <ul className="terms-list">
                  <li>Interpret or apply securities laws, commodities regulations, or tax codes</li>
                  <li>Provide guidance on regulatory compliance or reporting obligations</li>
                  <li>Generate advice that would be regulated under the Investment Advisers Act of 1940</li>
                  <li>Provide recommendations covered by the Commodity Exchange Act</li>
                  <li>Offer opinions on the legality or regulatory status of any trading activity</li>
                  <li>Assess your compliance with pattern day trader rules, margin requirements, or position limits</li>
                </ul>
                <p className="terms-text">
                  Any outputs that appear analytical, statistical, or data-driven are educational demonstrations only and DO NOT CONSTITUTE ACTIONABLE FINANCIAL RECOMMENDATIONS. The sophisticated appearance of AI-generated analysis does not transform educational content into professional advice.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">2.7 Model Outputs Are Not Market Predictions</h3>
                <p className="terms-text terms-warning-text">
                  ALL OUTPUTS, CALCULATIONS, AND ANALYSIS ARE RETROSPECTIVE OR HYPOTHETICAL AND SHOULD NEVER BE INTERPRETED AS PREDICTIONS, FORECASTS, OR ASSURANCES OF FUTURE MARKET BEHAVIOR.
                </p>
                <p className="terms-text">The Services:</p>
                <ul className="terms-list">
                  <li>Do not predict future price movements</li>
                  <li>Cannot forecast market outcomes</li>
                  <li>Do not guarantee probability of success</li>
                  <li>Provide no assurance of profitability</li>
                  <li>Offer no certainty about market behavior</li>
                </ul>
                <p className="terms-text">
                  All modeling is inherently probabilistic, subject to fundamental uncertainty, and based on incomplete information. Statistical correlations, patterns, or trends identified in historical data have no predictive validity.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section id="section-3" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">3</span>
                AI-Generated Content Disclaimers
              </h2>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">3.1 Artificial Intelligence Limitations</h3>
                <p className="terms-text">
                  The Services utilize artificial intelligence, machine learning, large language models, and algorithmic systems (collectively, &quot;AI Systems&quot;) that may produce errors, inaccuracies, hallucinations, biases, or misleading information. AI-generated content may appear authoritative but could be partially or entirely incorrect.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">3.2 No Guarantee of Accuracy</h3>
                <p className="terms-text terms-warning-text">
                  WE MAKE NO REPRESENTATIONS OR WARRANTIES REGARDING THE ACCURACY, COMPLETENESS, TIMELINESS, SUITABILITY, OR RELIABILITY OF ANY AI-GENERATED CONTENT.
                </p>
                <p className="terms-text">AI Systems may:</p>
                <ul className="terms-list">
                  <li>Generate false or fabricated information</li>
                  <li>Misinterpret market data or patterns</li>
                  <li>Produce inconsistent results</li>
                  <li>Fail to identify critical risks</li>
                  <li>Exhibit unpredictable behavior</li>
                  <li>Contain systematic biases</li>
                  <li>Hallucinate facts, figures, or events</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">3.3 Automation Bias Risk</h3>
                <p className="terms-text">
                  Users acknowledge the psychological tendency to over-rely on automated systems (&quot;automation bias&quot;). You must maintain critical judgment and not defer decision-making to AI outputs.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">3.4 Model Variability</h3>
                <p className="terms-text">
                  Results may vary based on model version, provider, data source, prompt construction, system load, or other factors. Identical queries may produce different outputs.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">3.5 User Misinterpretation and Misunderstanding</h3>
                <p className="terms-text terms-warning-text">
                  PELICAN IS NOT RESPONSIBLE FOR USER MISINTERPRETATION, MISUNDERSTANDING, SELECTIVE READING, OR MISREPRESENTATION OF ANY OUTPUTS.
                </p>
                <p className="terms-text">You acknowledge that:</p>
                <ul className="terms-list">
                  <li>You may misunderstand AI-generated content</li>
                  <li>Outputs may be ambiguous, incomplete, or conditional</li>
                  <li>Speculative language may appear factual</li>
                  <li>Context may be lost or misapplied</li>
                  <li>Partial information may create false impressions</li>
                  <li>Technical terminology may be misused or misunderstood</li>
                  <li>Formatting choices do not imply accuracy</li>
                </ul>
                <div className="terms-notice warning">
                  <p>THE RISK OF MISINTERPRETATION RESTS ENTIRELY WITH YOU. Pelican has no duty to ensure you correctly understand any output.</p>
                </div>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">3.6 User Verification Obligation</h3>
                <p className="terms-text terms-warning-text">
                  YOU HAVE AN ABSOLUTE AND NON-DELEGABLE OBLIGATION TO INDEPENDENTLY VERIFY ALL INFORMATION THROUGH AUTHORITATIVE SOURCES BEFORE TAKING ANY ACTION.
                </p>
                <p className="terms-text">This means you MUST:</p>
                <ul className="terms-list">
                  <li>Validate all data through official market sources</li>
                  <li>Consult licensed financial professionals for investment decisions</li>
                  <li>Verify calculations through independent means</li>
                  <li>Cross-reference any statistical claims</li>
                  <li>Confirm regulatory requirements with qualified counsel</li>
                  <li>Never rely on Pelican as a sole or primary information source</li>
                </ul>
                <div className="terms-notice critical">
                  <p>FAILURE TO INDEPENDENTLY VERIFY INFORMATION IS AT YOUR SOLE RISK.</p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">4</span>
                Market Data and Information Disclaimers
              </h2>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">4.1 Non-Display Data Usage</h3>
                <p className="terms-text">
                  The Services utilize &quot;non-display data&quot; for computational and analytical purposes. Users do not directly access raw exchange data feeds. All market information is processed, transformed, and presented through intermediary systems.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">4.2 Data Accuracy Disclaimer</h3>
                <p className="terms-text">Market data, prices, volumes, and other information may be:</p>
                <ul className="terms-list">
                  <li>Delayed, stale, or cached</li>
                  <li>Incomplete or missing data points</li>
                  <li>Subject to revision or correction</li>
                  <li>Aggregated from multiple sources with varying quality</li>
                  <li>Affected by technical errors or transmission issues</li>
                  <li>Different from official exchange records</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">4.3 No Warranty of Data Quality</h3>
                <p className="terms-text terms-warning-text">
                  WE EXPRESSLY DISCLAIM ALL WARRANTIES REGARDING DATA ACCURACY, COMPLETENESS, OR FITNESS FOR ANY PARTICULAR PURPOSE. Data may contain errors, omissions, or inaccuracies that could materially affect analysis outcomes.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">4.4 Historical Data Limitations</h3>
                <p className="terms-text">Historical data and backtesting results:</p>
                <ul className="terms-list">
                  <li>Do not guarantee future performance</li>
                  <li>May suffer from survivorship bias</li>
                  <li>Cannot account for all market conditions</li>
                  <li>May not include transaction costs, slippage, or market impact</li>
                  <li>Are hypothetical and may not reflect actual trading results</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">4.5 No Duty to Update or Correct</h3>
                <p className="terms-text terms-warning-text">
                  PELICAN HAS NO OBLIGATION TO UPDATE, REVISE, CORRECT, MAINTAIN, OR VERIFY ANY DATA, OUTPUT, ANALYSIS, OR INFORMATION.
                </p>
                <p className="terms-text">Data and outputs may:</p>
                <ul className="terms-list">
                  <li>Remain incorrect indefinitely</li>
                  <li>Become outdated without notice</li>
                  <li>Contain undetected errors permanently</li>
                  <li>Never be updated even if errors are discovered</li>
                  <li>Deteriorate in quality over time</li>
                  <li>Become increasingly inaccurate</li>
                </ul>
                <p className="terms-text">
                  You acknowledge that relying on potentially outdated or incorrect information is entirely at your risk.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">4.6 Data Vendor and Exchange Compliance</h3>
                <p className="terms-text">
                  Pelican transforms, analyzes, delays, aggregates, and summarizes data from various sources. THE SERVICES DO NOT PROVIDE OR REDISTRIBUTE RAW MARKET DATA.
                </p>
                <p className="terms-text">You acknowledge:</p>
                <ul className="terms-list">
                  <li>Pelican&apos;s data is derivative and transformed</li>
                  <li>You may need separate market data licenses for trading</li>
                  <li>Data vendor terms may restrict your use</li>
                  <li>Exchange agreements may prohibit certain uses</li>
                  <li>Pelican is not responsible for your compliance with data vendor requirements</li>
                  <li>Third-party data sources may change, terminate, or restrict access without notice</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">5</span>
                Risk Disclosures
              </h2>

              <div className="terms-notice critical">
                <p>TRADING AND INVESTING IN FINANCIAL INSTRUMENTS INVOLVES SUBSTANTIAL RISK OF LOSS AND IS NOT SUITABLE FOR EVERY PERSON. YOU CAN LOSE ALL OR MORE THAN YOUR INITIAL INVESTMENT. PAST PERFORMANCE IS NOT INDICATIVE OF FUTURE RESULTS.</p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">5.2 Specific Trading Risks</h3>
                <p className="terms-text">Users acknowledge and accept the following non-exhaustive list of risks:</p>
                <ul className="terms-list">
                  <li>Total loss of capital</li>
                  <li>Leverage and margin risks</li>
                  <li>Liquidity risks</li>
                  <li>Counterparty risks</li>
                  <li>Technology and system failures</li>
                  <li>Market manipulation</li>
                  <li>Regulatory changes</li>
                  <li>Tax consequences</li>
                  <li>Currency fluctuations</li>
                  <li>Geopolitical events</li>
                  <li>Black swan events</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">5.3 No Profit Guarantee</h3>
                <p className="terms-text terms-warning-text">
                  THE SERVICES DO NOT GUARANTEE PROFITABILITY, POSITIVE RETURNS, OR SUCCESSFUL OUTCOMES. Most traders lose money. You should be prepared to lose all funds used for trading.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">5.4 User Trading Independence</h3>
                <p className="terms-text terms-warning-text">
                  YOUR TRADING DECISIONS AND BEHAVIOR ARE COMPLETELY INDEPENDENT OF PELICAN.
                </p>
                <p className="terms-text">Pelican has:</p>
                <ul className="terms-list">
                  <li>No visibility into your actual positions, capital, or leverage</li>
                  <li>No knowledge of your portfolio composition or strategy</li>
                  <li>No ability to monitor your trading activity</li>
                  <li>No responsibility for your trade timing or execution</li>
                  <li>No influence over your risk management decisions</li>
                  <li>No duty to warn you about position risks</li>
                </ul>
                <p className="terms-text">
                  YOU BEAR SOLE RESPONSIBILITY FOR ALL TRADING DECISIONS. Any correlation between Pelican outputs and your trading activity is coincidental and does not create liability.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">5.5 Model Predictions Disclaimer</h3>
                <p className="terms-text terms-warning-text">
                  OUTPUTS THAT DISCUSS PROBABILITIES, SCENARIOS, OR STATISTICAL RELATIONSHIPS ARE NOT PREDICTIONS OF FUTURE EVENTS.
                </p>
                <p className="terms-text">All modeling:</p>
                <ul className="terms-list">
                  <li>Is based on historical patterns that may not repeat</li>
                  <li>Cannot account for unprecedented events</li>
                  <li>Fails to capture all market dynamics</li>
                  <li>Contains inherent and irreducible uncertainty</li>
                  <li>Should never be interpreted as forecasts</li>
                </ul>
                <div className="terms-notice warning">
                  <p>TREATING MODEL OUTPUTS AS PREDICTIVE IS A FUNDAMENTAL MISUSE OF THE SERVICES.</p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section id="section-6" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">6</span>
                Prohibited Uses
              </h2>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">6.1 Restrictions</h3>
                <p className="terms-text">You agree not to:</p>
                <ul className="terms-list">
                  <li>Use the Services for any unlawful purpose or in violation of any applicable laws</li>
                  <li>Redistribute, resell, or commercialize any data or content without authorization</li>
                  <li>Reverse engineer, decompile, or disassemble any aspect of the Services</li>
                  <li>Circumvent rate limits, access controls, or security measures</li>
                  <li>Scrape, harvest, or collect data through automated means</li>
                  <li>Manipulate or interfere with the Services or other users&apos; access</li>
                  <li>Transmit malicious code, viruses, or harmful components</li>
                  <li>Impersonate any person or entity</li>
                  <li>Use the Services to engage in market manipulation or fraudulent trading</li>
                  <li>Access the Services from prohibited jurisdictions</li>
                  <li>Violate any third-party rights</li>
                  <li>Use the Services for high-frequency or algorithmic trading without authorization</li>
                  <li>Create derivative works based on the Services</li>
                  <li>Use the Services for competitive analysis or benchmarking</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">6.2 Automated Trading Prohibition</h3>
                <p className="terms-text">
                  Unless explicitly authorized in writing, you may not connect the Services to any automated trading system, execution management system, or order routing system.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">6.3 Professional and High-Frequency Trading Prohibition</h3>
                <p className="terms-text terms-warning-text">
                  THE SERVICES ARE NOT DESIGNED, LICENSED, TESTED, OR INTENDED FOR:
                </p>
                <ul className="terms-list">
                  <li>High-frequency trading strategies</li>
                  <li>Algorithmic or automated trading systems</li>
                  <li>Professional trading operations</li>
                  <li>Institutional trading desks</li>
                  <li>Market making activities</li>
                  <li>Arbitrage strategies requiring low latency</li>
                  <li>Systematic trading programs</li>
                  <li>Quantitative fund strategies</li>
                </ul>
                <p className="terms-text">
                  Professional traders and institutions must not rely on the Services for time-sensitive, high-volume, or mission-critical trading decisions.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="section-7" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">7</span>
                Intellectual Property
              </h2>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">7.1 Ownership</h3>
                <p className="terms-text">
                  All content, features, functionality, software, algorithms, models, designs, and technology comprising the Services are owned by Pelican or its licensors and are protected by intellectual property laws.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">7.2 Limited License</h3>
                <p className="terms-text">
                  Subject to compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Services for personal, non-commercial purposes.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">7.3 User Content</h3>
                <p className="terms-text">
                  You retain ownership of content you submit but grant Pelican a worldwide, perpetual, irrevocable, royalty-free license to use, modify, reproduce, and create derivative works from such content.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">7.4 Feedback</h3>
                <p className="terms-text">
                  Any feedback, suggestions, or improvements you provide become the property of Pelican without compensation to you.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="section-8" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">8</span>
                Limitation of Liability
              </h2>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">8.1 Disclaimer of Damages</h3>
                <p className="terms-text terms-warning-text">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL PELICAN, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, SUPPLIERS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO:
                </p>
                <ul className="terms-list">
                  <li>Trading losses</li>
                  <li>Lost profits or revenues</li>
                  <li>Loss of data</li>
                  <li>Business interruption</li>
                  <li>Emotional distress</li>
                  <li>Reputational harm</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">8.2 Cap on Liability</h3>
                <p className="terms-text terms-warning-text">
                  PELICAN&apos;S TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE GREATER OF (A) $100 OR (B) THE FEES PAID BY YOU IN THE TWELVE MONTHS PRECEDING THE CLAIM.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">8.3 Basis of Bargain</h3>
                <p className="terms-text">
                  These limitations reflect the allocation of risk between the parties and form an essential basis of the bargain.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section id="section-9" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">9</span>
                Indemnification
              </h2>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">9.1 User Indemnification</h3>
                <p className="terms-text">
                  You agree to indemnify, defend, and hold harmless Pelican and its affiliates, officers, directors, employees, agents, licensors, and suppliers from and against all claims, losses, expenses, damages, and costs, including reasonable attorneys&apos; fees, arising from:
                </p>
                <ul className="terms-list">
                  <li>Your violation of these Terms</li>
                  <li>Your use or misuse of the Services</li>
                  <li>Your trading or investment activities</li>
                  <li>Your violation of any laws or third-party rights</li>
                  <li>Content you submit or transmit through the Services</li>
                  <li>Your negligence or willful misconduct</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">9.2 Defense Control</h3>
                <p className="terms-text">
                  Pelican reserves the right to assume exclusive defense and control of any matter subject to indemnification, at your expense.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section id="section-10" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">10</span>
                Disclaimers of Warranties
              </h2>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">10.1 &quot;As Is&quot; Basis</h3>
                <p className="terms-text terms-warning-text">
                  THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">10.2 Disclaimed Warranties</h3>
                <p className="terms-text terms-warning-text">WE SPECIFICALLY DISCLAIM ALL WARRANTIES INCLUDING:</p>
                <ul className="terms-list">
                  <li>MERCHANTABILITY</li>
                  <li>FITNESS FOR A PARTICULAR PURPOSE</li>
                  <li>NON-INFRINGEMENT</li>
                  <li>TITLE</li>
                  <li>ACCURACY</li>
                  <li>RELIABILITY</li>
                  <li>AVAILABILITY</li>
                  <li>SECURITY</li>
                  <li>QUIET ENJOYMENT</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">10.3 No Warranty of Continuous Operation</h3>
                <p className="terms-text">
                  We do not warrant uninterrupted, timely, secure, or error-free operation of the Services.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section id="section-11" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">11</span>
                Dispute Resolution
              </h2>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">11.1 Binding Arbitration</h3>
                <p className="terms-text">
                  Any dispute arising from or relating to these Terms or the Services shall be resolved through binding arbitration administered by the American Arbitration Association under its Commercial Arbitration Rules.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">11.2 Arbitration Procedures</h3>
                <p className="terms-text">Arbitration shall be:</p>
                <ul className="terms-list">
                  <li>Conducted in Delaware</li>
                  <li>Decided by a single arbitrator</li>
                  <li>Conducted in English</li>
                  <li>Limited to written submissions unless otherwise agreed</li>
                  <li>Confidential</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">11.3 Class Action Waiver</h3>
                <p className="terms-text terms-warning-text">
                  YOU WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION, CLASS ARBITRATION, OR REPRESENTATIVE ACTION. DISPUTES MUST BE BROUGHT INDIVIDUALLY.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">11.4 Small Claims Exception</h3>
                <p className="terms-text">
                  Either party may bring qualifying claims in small claims court.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">11.5 Injunctive Relief</h3>
                <p className="terms-text">
                  Pelican may seek injunctive relief in any court of competent jurisdiction for intellectual property violations or breaches of confidentiality.
                </p>
              </div>
            </section>

            {/* Section 12 */}
            <section id="section-12" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">12</span>
                Data and Privacy
              </h2>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">12.1 Data Collection</h3>
                <p className="terms-text">
                  We collect, process, and store data as described in our Privacy Policy, incorporated herein by reference.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">12.2 Non-Personal Data</h3>
                <p className="terms-text">
                  We may collect and use aggregated, anonymized data for any purpose, including improving the Services, research, and commercial purposes.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">12.3 Data Retention</h3>
                <p className="terms-text">
                  We retain data according to legal requirements and business needs. We have no obligation to store data indefinitely.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">12.4 Security</h3>
                <p className="terms-text">
                  While we implement security measures, we cannot guarantee absolute security. You acknowledge the inherent risks of internet-based services.
                </p>
              </div>
            </section>

            {/* Section 13 */}
            <section id="section-13" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">13</span>
                API and Technical Terms
              </h2>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">13.1 API Access</h3>
                <p className="terms-text">If provided API access, you agree to:</p>
                <ul className="terms-list">
                  <li>Comply with all documentation and specifications</li>
                  <li>Respect rate limits and quotas</li>
                  <li>Not exceed authorized usage levels</li>
                  <li>Maintain security of credentials</li>
                  <li>Promptly report any security issues</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">13.2 Service Levels</h3>
                <p className="terms-text">
                  Unless covered by a separate enterprise agreement, we provide no service level agreements, uptime guarantees, or performance commitments.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">13.3 Changes and Deprecation</h3>
                <p className="terms-text">
                  We may modify, suspend, or deprecate APIs or features with or without notice.
                </p>
              </div>
            </section>

            {/* Section 14 */}
            <section id="section-14" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">14</span>
                Compliance and Regulatory Matters
              </h2>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">14.1 User Compliance Obligation</h3>
                <p className="terms-text">
                  You are solely responsible for ensuring your use complies with all applicable laws, including but not limited to:
                </p>
                <ul className="terms-list">
                  <li>Securities laws and regulations</li>
                  <li>Commodities laws and regulations</li>
                  <li>Tax laws and reporting requirements</li>
                  <li>Anti-money laundering (AML) requirements</li>
                  <li>Know Your Customer (KYC) requirements</li>
                  <li>International trade and sanctions laws</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">14.2 OFAC Compliance</h3>
                <p className="terms-text">
                  You represent that you are not on any prohibited party list maintained by the Office of Foreign Assets Control (OFAC) or similar authority.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">14.3 Geographic Restrictions</h3>
                <p className="terms-text">
                  The Services are not available in all jurisdictions. You are responsible for compliance with local laws.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">14.4 Regulatory Changes</h3>
                <p className="terms-text">
                  We may modify or terminate Services in response to regulatory requirements without liability.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">14.5 Expanded User Compliance Obligation</h3>
                <p className="terms-text terms-warning-text">
                  YOU ARE SOLELY AND ENTIRELY RESPONSIBLE FOR DETERMINING WHETHER YOUR USE OF AI-POWERED ANALYTICS OR TRADING TOOLS IS LEGAL IN YOUR JURISDICTION.
                </p>
                <p className="terms-text">You must independently determine:</p>
                <ul className="terms-list">
                  <li>Whether AI-assisted trading is permitted in your country</li>
                  <li>If you require licenses to use analytical tools</li>
                  <li>Whether algorithmic analysis violates local regulations</li>
                  <li>If AI-generated content is admissible for your purposes</li>
                  <li>Whether your trading activity requires registration</li>
                  <li>If using the Services violates professional standards or employer policies</li>
                </ul>
                <div className="terms-notice warning">
                  <p>PELICAN MAKES NO REPRESENTATION THAT THE SERVICES ARE APPROPRIATE, LEGAL, OR AVAILABLE FOR USE IN ANY PARTICULAR LOCATION.</p>
                </div>
              </div>
            </section>

            {/* Section 15 */}
            <section id="section-15" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">15</span>
                Beta Features and Experimental Services
              </h2>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">15.1 Beta Disclaimer</h3>
                <p className="terms-text">
                  Features designated as &quot;beta,&quot; &quot;preview,&quot; &quot;experimental,&quot; or similar are provided for evaluation purposes and may:
                </p>
                <ul className="terms-list">
                  <li>Contain bugs or errors</li>
                  <li>Be discontinued without notice</li>
                  <li>Change substantially</li>
                  <li>Not be suitable for production use</li>
                  <li>Have different or no support</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">15.2 No Reliance</h3>
                <p className="terms-text">
                  Do not rely on beta features for critical decisions or production systems.
                </p>
              </div>
            </section>

            {/* Section 16 */}
            <section id="section-16" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">16</span>
                Termination
              </h2>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">16.1 Termination Rights</h3>
                <p className="terms-text">
                  Either party may terminate these Terms at any time. We may suspend or terminate your access immediately for any reason or no reason.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">16.2 Effects of Termination</h3>
                <p className="terms-text">Upon termination:</p>
                <ul className="terms-list">
                  <li>Your access rights cease immediately</li>
                  <li>You must stop using the Services</li>
                  <li>We may delete your data</li>
                  <li>Accrued obligations survive</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">16.3 No Refunds</h3>
                <p className="terms-text">
                  Termination does not entitle you to any refunds unless required by law.
                </p>
              </div>
            </section>

            {/* Section 17 */}
            <section id="section-17" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">17</span>
                Enterprise and Institutional Terms
              </h2>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">17.1 Separate Agreements</h3>
                <p className="terms-text">
                  Enterprise or institutional clients may be subject to additional terms through separate agreements that supplement or supersede portions of these Terms.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">17.2 Data Vendor Requirements</h3>
                <p className="terms-text">
                  Institutional users must comply with all third-party data vendor requirements and may need separate data licenses.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">17.3 Redistribution Restrictions</h3>
                <p className="terms-text">
                  Unless explicitly authorized, you may not redistribute, resell, or sublicense any data or Services to third parties.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">17.4 Data Vendor Compliance Requirements</h3>
                <p className="terms-text">
                  Institutional users acknowledge that Pelican&apos;s data is transformed, delayed, and processed through multiple analytical layers.
                </p>
                <p className="terms-text terms-warning-text">INSTITUTIONAL USERS MAY NOT:</p>
                <ul className="terms-list">
                  <li>Treat Pelican outputs as official market data</li>
                  <li>Redistribute any data or analysis to third parties</li>
                  <li>Use outputs for regulatory reporting</li>
                  <li>Rely on data for best execution analysis</li>
                  <li>Create derivative data products</li>
                  <li>Claim data comes directly from exchanges</li>
                </ul>
                <p className="terms-text">
                  Institutions requiring real-time, official market data must obtain appropriate licenses directly from exchanges and data vendors.
                </p>
              </div>
            </section>

            {/* Section 18 */}
            <section id="section-18" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">18</span>
                Miscellaneous Provisions
              </h2>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">18.1 Entire Agreement</h3>
                <p className="terms-text">
                  These Terms constitute the entire agreement between you and Pelican regarding the Services.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">18.2 Severability</h3>
                <p className="terms-text">
                  If any provision is found unenforceable, the remaining provisions continue in full force.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">18.3 No Waiver</h3>
                <p className="terms-text">
                  Our failure to enforce any right or provision is not a waiver of such right or provision.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">18.4 Assignment</h3>
                <p className="terms-text">
                  You may not assign these Terms without our prior written consent. We may assign these Terms without restriction.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">18.5 Governing Law</h3>
                <p className="terms-text">
                  These Terms are governed by Delaware law, excluding conflict of law principles.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">18.6 Survival</h3>
                <p className="terms-text">
                  Provisions that by their nature should survive termination shall survive, including disclaimers, limitations of liability, indemnification, and dispute resolution.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">18.7 Force Majeure</h3>
                <p className="terms-text">
                  Neither party is liable for delays or failures due to causes beyond reasonable control.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">18.8 Interpretation</h3>
                <p className="terms-text">
                  Headings are for convenience only. &quot;Including&quot; means &quot;including but not limited to.&quot;
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">18.9 Electronic Communications</h3>
                <p className="terms-text">
                  You consent to electronic communications and agree electronic signatures have the same legal effect as manual signatures.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">18.10 Export Controls</h3>
                <p className="terms-text">
                  You agree to comply with all applicable export and re-export control laws and regulations.
                </p>
              </div>
            </section>

            {/* Section 19 */}
            <section id="section-19" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">19</span>
                Specific Risk Warnings
              </h2>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">19.1 Model Risk</h3>
                <p className="terms-text">Quantitative models and algorithms may:</p>
                <ul className="terms-list">
                  <li>Contain mathematical errors</li>
                  <li>Be based on flawed assumptions</li>
                  <li>Fail in unprecedented market conditions</li>
                  <li>Suffer from overfitting to historical data</li>
                  <li>Not capture all relevant risk factors</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">19.2 Execution Risk</h3>
                <p className="terms-text">
                  The Services do not provide trade execution. Actual execution may differ materially from analysis due to:
                </p>
                <ul className="terms-list">
                  <li>Slippage</li>
                  <li>Market impact</li>
                  <li>Latency</li>
                  <li>Partial fills</li>
                  <li>Rejected orders</li>
                  <li>Technical failures</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">19.3 Calculation Disclaimer</h3>
                <p className="terms-text">
                  All calculations, including but not limited to returns, volatility, correlations, backtests, and statistical measures, may be incorrect, incomplete, or based on flawed data.
                </p>
              </div>
            </section>

            {/* Section 20 */}
            <section id="section-20" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">20</span>
                Regulatory Disclosures
              </h2>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">20.1 No SIPC Protection</h3>
                <p className="terms-text">
                  The Services are not covered by Securities Investor Protection Corporation (SIPC) insurance.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">20.2 No FDIC Insurance</h3>
                <p className="terms-text">
                  The Services and any associated accounts are not FDIC insured.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">20.3 Not a Registered Entity</h3>
                <p className="terms-text">
                  Pelican is not registered as a broker-dealer, investment advisor, commodity trading advisor, commodity pool operator, futures commission merchant, or any other regulated entity.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">20.4 No Suitability Assessment</h3>
                <p className="terms-text">
                  We do not assess the suitability or appropriateness of any product, strategy, or transaction for your circumstances.
                </p>
              </div>
            </section>

            {/* Section 21 */}
            <section id="section-21" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">21</span>
                Future Services Disclaimer
              </h2>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">21.1 Potential Brokerage Services</h3>
                <p className="terms-text">If Pelican offers brokerage, execution, or similar services in the future:</p>
                <ul className="terms-list">
                  <li>Such services will be governed by separate agreements</li>
                  <li>Additional regulatory disclosures will apply</li>
                  <li>Current educational services remain non-advisory</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">21.2 No Current Execution Capability</h3>
                <p className="terms-text">
                  Pelican currently provides no ability to execute, route, or place orders.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">21.3 Current Limitations on Professional Use</h3>
                <p className="terms-text terms-warning-text">
                  UNTIL EXPLICITLY AUTHORIZED FOR PROFESSIONAL USE, THE SERVICES ARE NOT INTENDED FOR:
                </p>
                <ul className="terms-list">
                  <li>Registered investment advisors</li>
                  <li>Broker-dealers</li>
                  <li>Hedge funds</li>
                  <li>Proprietary trading firms</li>
                  <li>Market makers</li>
                  <li>Trading desks</li>
                  <li>Financial institutions</li>
                </ul>
                <p className="terms-text">
                  Professional entities using the Services do so entirely at their own risk and liability.
                </p>
              </div>
            </section>

            {/* Section 22 */}
            <section id="section-22" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">22</span>
                Communications
              </h2>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">22.1 Electronic Notices</h3>
                <p className="terms-text">
                  You consent to receive all communications electronically via email or the Services.
                </p>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">22.2 Notice to Pelican</h3>
                <p className="terms-text">Legal notices to Pelican must be sent to:</p>
                <div className="terms-contact">
                  <p><strong>Pelican Trading, LLC</strong></p>
                  <p>2045 W Grand Ave</p>
                  <p>Email: <a href="mailto:legal@pelican.ai">legal@pelican.ai</a></p>
                </div>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">22.3 Notice to You</h3>
                <p className="terms-text">
                  We may provide notice via your registered email address or the Services.
                </p>
              </div>
            </section>

            {/* Section 23 */}
            <section id="section-23" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">23</span>
                Acknowledgments
              </h2>

              <div className="terms-acknowledgment">
                <h4>BY USING THE SERVICES, YOU ACKNOWLEDGE THAT:</h4>
                <ul>
                  <li>You have read and understood these Terms in their entirety</li>
                  <li>You have had the opportunity to seek independent legal advice</li>
                  <li>You understand the risks of trading and investing</li>
                  <li>You will not hold Pelican responsible for any losses</li>
                  <li>The Services are educational only and not personalized advice</li>
                  <li>AI-generated content may be inaccurate or misleading</li>
                  <li>You must independently verify all information</li>
                  <li>You are solely responsible for your decisions and their consequences</li>
                  <li>No fiduciary relationship exists</li>
                  <li>You waive rights to class actions</li>
                  <li>Disputes will be resolved through individual arbitration</li>
                </ul>
              </div>
            </section>

            {/* Section 24 */}
            <section id="section-24" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">24</span>
                Questions and Contact
              </h2>

              <div className="terms-contact">
                <div className="terms-contact-title">Contact Us</div>
                <p>For questions about these Terms, please contact:</p>
                <p>Email: <a href="mailto:support@pelican.ai">support@pelican.ai</a></p>
                <p>Website: <a href="https://www.pelican.ai" target="_blank" rel="noopener noreferrer">www.pelican.ai</a></p>
              </div>
            </section>

            {/* Section 25 */}
            <section id="section-25" className="terms-section">
              <h2 className="terms-section-title">
                <span className="terms-section-number">25</span>
                Limitations of Interpretation &amp; Output Behavior
              </h2>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">25.1 Authoritative Tone Does Not Equal Accuracy</h3>
                <p className="terms-text terms-warning-text">
                  AI-GENERATED OUTPUTS MAY EXHIBIT CONFIDENT, AUTHORITATIVE, OR PROFESSIONAL TONE THAT DOES NOT REFLECT ACTUAL ACCURACY, RELIABILITY, OR EXPERTISE.
                </p>
                <p className="terms-text">You must not interpret the following as indicators of correctness:</p>
                <ul className="terms-list">
                  <li>Confident or assertive language</li>
                  <li>Professional terminology or jargon</li>
                  <li>Detailed explanations or reasoning</li>
                  <li>Mathematical precision or decimal places</li>
                  <li>Coherent narrative structure</li>
                  <li>Absence of uncertainty markers</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">25.2 Formatting Is Not Validation</h3>
                <p className="terms-text">
                  The presence of charts, graphs, tables, bold text, statistical figures, or professional formatting DOES NOT imply:
                </p>
                <ul className="terms-list">
                  <li>Accuracy of underlying data</li>
                  <li>Validity of calculations</li>
                  <li>Correctness of methodology</li>
                  <li>Professional review or verification</li>
                  <li>Regulatory compliance</li>
                  <li>Suitability for any purpose</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">25.3 No Human Review</h3>
                <p className="terms-text terms-warning-text">
                  ALL OUTPUTS ARE AUTO-GENERATED WITHOUT HUMAN REVIEW, VERIFICATION, OR VALIDATION.
                </p>
                <p className="terms-text">No licensed professional has:</p>
                <ul className="terms-list">
                  <li>Reviewed outputs for accuracy</li>
                  <li>Verified calculations or methodology</li>
                  <li>Approved content for distribution</li>
                  <li>Confirmed regulatory compliance</li>
                  <li>Validated statistical claims</li>
                  <li>Checked for errors or omissions</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">25.4 Interpretation Prohibition</h3>
                <p className="terms-text terms-warning-text">YOU ARE EXPRESSLY PROHIBITED FROM:</p>
                <ul className="terms-list">
                  <li>Treating any output as factual without independent verification</li>
                  <li>Interpreting confident language as expertise</li>
                  <li>Assuming detailed analysis implies accuracy</li>
                  <li>Believing formatting indicates professionalism</li>
                  <li>Treating coherence as correctness</li>
                  <li>Interpreting lack of disclaimers as endorsement</li>
                </ul>
              </div>

              <div className="terms-subsection">
                <h3 className="terms-subsection-title">25.5 Output Variability Warning</h3>
                <p className="terms-text">
                  Identical queries may produce different outputs. Variations in response do not indicate:
                </p>
                <ul className="terms-list">
                  <li>Evolution of market conditions</li>
                  <li>Updated analysis</li>
                  <li>Improved accuracy</li>
                  <li>Error correction</li>
                  <li>Learning from feedback</li>
                </ul>
                <p className="terms-text">
                  Output differences are artifacts of model behavior, not meaningful signals.
                </p>
              </div>
            </section>

            {/* Final Notice */}
            <div className="terms-notice critical">
              <p>BY ACCESSING OR USING THE SERVICES, YOU AGREE TO BE BOUND BY THESE TERMS AND CONDITIONS.</p>
            </div>

            <div className="terms-notice warning" style={{ marginTop: '1rem' }}>
              <p>IMPORTANT: THESE TERMS CONTAIN AN ARBITRATION CLAUSE AND CLASS ACTION WAIVER. BY AGREEING TO THESE TERMS, YOU AGREE TO RESOLVE DISPUTES THROUGH BINDING INDIVIDUAL ARBITRATION AND WAIVE THE RIGHT TO PARTICIPATE IN CLASS ACTIONS.</p>
            </div>

            <div className="terms-notice critical" style={{ marginTop: '1rem' }}>
              <p>CRITICAL WARNING: THE SERVICES ARE EDUCATIONAL ONLY. NO OUTPUT, ANALYSIS, OR INFORMATION PROVIDED BY PELICAN SHOULD BE USED AS THE BASIS FOR ANY TRADING OR INVESTMENT DECISION. YOU BEAR FULL RESPONSIBILITY FOR ALL FINANCIAL DECISIONS AND THEIR CONSEQUENCES. PELICAN ACCEPTS NO LIABILITY FOR ANY LOSSES, DAMAGES, OR ADVERSE OUTCOMES RESULTING FROM YOUR USE OF THE SERVICES.</p>
            </div>

          </div>

          {/* CTA */}
          <div className="terms-cta">
            <h3>Questions About Our Terms?</h3>
            <p>Contact our team if you need clarification on any of these terms.</p>
            <div className="terms-cta-buttons">
              <a href="mailto:legal@pelican.ai" className="btn-secondary">
                Contact Legal
              </a>
              <Link href="/" className="btn-primary">
                Back to Home →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="terms-footer">
        <p>
          © 2025 Pelican Trading. <Link href="/">Back to Home</Link> | <Link href="/faq">FAQ</Link>
        </p>
      </footer>

      <HelpChat logoUrl="/pelican-logo-transparent.png" />
    </>
  );
}
