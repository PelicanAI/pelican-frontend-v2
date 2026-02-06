import type { Metadata } from 'next';
import Link from 'next/link';
import '../legal-styles.css';

export const metadata: Metadata = {
  title: 'Terms of Service | Pelican Trading',
  description: 'Terms and Conditions of Service for Pelican Trading, LLC — governing your access to and use of the Pelican platform and services.',
};

export default function TermsPage() {
  return (
    <div className="legal-page">
      <nav className="legal-nav">
        <Link href="/" className="back-link">← Back to Home</Link>
      </nav>
      <main className="legal-content">
        <h1>Terms of Service</h1>
        <p className="legal-meta">
          <strong>PELICAN TRADING, LLC</strong><br />
          Effective Date: November 23, 2025<br />
          Last Updated: November 23, 2025
        </p>

        <section>
          <h2>1. INTRODUCTION</h2>
          <p>
            These Terms and Conditions of Service (the &quot;Terms,&quot; &quot;Agreement,&quot; or &quot;TOS&quot;) constitute a legally binding agreement between you (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;) and Pelican Trading, LLC, a Delaware limited liability company (&quot;Pelican,&quot; &quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), governing your access to and use of the Pelican platform, services, websites, applications, APIs, tools, and all related software and documentation (collectively, the &quot;Services&quot;).
          </p>
          <p>
            By accessing, browsing, or using the Services in any manner, including but not limited to visiting or browsing the website, registering an account, or accessing any content, information, or materials, you agree to be bound by these Terms. If you do not agree to all provisions of these Terms, you are not authorized to access or use the Services and must immediately cease all use.
          </p>
        </section>

        <section>
          <h2>2. NATURE OF SERVICES - CRITICAL DISCLAIMERS</h2>
          <p>
            <strong>THE SERVICES ARE PROVIDED STRICTLY FOR INFORMATIONAL AND EDUCATIONAL PURPOSES ONLY.</strong>
          </p>
          <p>
            PELICAN IS NOT A BROKER-DEALER, INVESTMENT ADVISOR, FINANCIAL ADVISOR, COMMODITY TRADING ADVISOR, FINANCIAL PLANNER, FIDUCIARY, OR TAX ADVISOR. THE SERVICES DO NOT CONSTITUTE INVESTMENT ADVICE, FINANCIAL ADVICE, TRADING ADVICE, TAX ADVICE, LEGAL ADVICE, OR ANY OTHER FORM OF PROFESSIONAL ADVICE.
          </p>
          <p>
            Nothing provided through the Services should be construed as a recommendation to buy, sell, hold, or otherwise transact in any security, derivative, commodity, or financial instrument. All content is general in nature and does not take into account your individual circumstances, financial situation, objectives, or risk tolerance.
          </p>
        </section>

        <section>
          <h2>3. AI-GENERATED CONTENT DISCLAIMERS</h2>
          <p>
            The Services utilize artificial intelligence, machine learning, large language models, and algorithmic systems (collectively, &quot;AI Systems&quot;) that may produce errors, inaccuracies, hallucinations, biases, or misleading information. AI-generated content may appear authoritative but could be partially or entirely incorrect.
          </p>
          <p>
            <strong>WE MAKE NO REPRESENTATIONS OR WARRANTIES REGARDING THE ACCURACY, COMPLETENESS, TIMELINESS, SUITABILITY, OR RELIABILITY OF ANY AI-GENERATED CONTENT.</strong>
          </p>
          <p>
            YOU HAVE AN ABSOLUTE AND NON-DELEGABLE OBLIGATION TO INDEPENDENTLY VERIFY ALL INFORMATION THROUGH AUTHORITATIVE SOURCES BEFORE TAKING ANY ACTION.
          </p>
        </section>

        <section>
          <h2>4. RISK DISCLOSURES</h2>
          <p>
            <strong>TRADING AND INVESTING IN FINANCIAL INSTRUMENTS INVOLVES SUBSTANTIAL RISK OF LOSS AND IS NOT SUITABLE FOR EVERY PERSON. YOU CAN LOSE ALL OR MORE THAN YOUR INITIAL INVESTMENT. PAST PERFORMANCE IS NOT INDICATIVE OF FUTURE RESULTS.</strong>
          </p>
          <p>
            THE SERVICES DO NOT GUARANTEE PROFITABILITY, POSITIVE RETURNS, OR SUCCESSFUL OUTCOMES. Most traders lose money. You should be prepared to lose all funds used for trading.
          </p>
        </section>

        <section>
          <h2>5. LIMITATION OF LIABILITY</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL PELICAN, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, SUPPLIERS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO TRADING LOSSES, LOST PROFITS OR REVENUES, LOSS OF DATA, BUSINESS INTERRUPTION, EMOTIONAL DISTRESS, OR REPUTATIONAL HARM.
          </p>
          <p>
            PELICAN&apos;S TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE GREATER OF (A) $100 OR (B) THE FEES PAID BY YOU IN THE TWELVE MONTHS PRECEDING THE CLAIM.
          </p>
        </section>

        <section>
          <h2>6. DISPUTE RESOLUTION</h2>
          <p>
            Any dispute arising from or relating to these Terms or the Services shall be resolved through binding arbitration administered by the American Arbitration Association under its Commercial Arbitration Rules. Arbitration shall be conducted in Delaware, decided by a single arbitrator, conducted in English, and limited to written submissions unless otherwise agreed.
          </p>
          <p>
            <strong>YOU WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION, CLASS ARBITRATION, OR REPRESENTATIVE ACTION. DISPUTES MUST BE BROUGHT INDIVIDUALLY.</strong>
          </p>
        </section>

        <section>
          <h2>7. CONTACT US</h2>
          <p>
            For questions about these Terms, please contact:
          </p>
          <p>
            <strong>Pelican Trading, LLC</strong><br />
            2045 W Grand Ave<br />
            STE B 773866<br />
            Chicago, IL 60612 US
          </p>
          <p>
            Email: <a href="mailto:legal@pelican.ai">legal@pelican.ai</a><br />
            Support: <a href="mailto:support@pelicantrading.ai">support@pelicantrading.ai</a>
          </p>
        </section>

        <section style={{ marginTop: '3rem', padding: '1.5rem', background: 'var(--muted)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>
            <strong>IMPORTANT:</strong> These Terms contain an arbitration clause and class action waiver. By agreeing to these Terms, you agree to resolve disputes through binding individual arbitration and waive the right to participate in class actions.
          </p>
        </section>
      </main>
    </div>
  );
}

