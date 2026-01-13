'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/auth-provider';
import HelpChat from '@/components/marketing/HelpChat';
import '../styles/marketing.css';
import '../styles/privacy.css';

export default function PrivacyPolicy() {
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

      <main className="privacy-page">
        <div className="privacy-container">
          <header className="privacy-header">
            <div className="privacy-tag">Legal</div>
            <h1>
              Privacy <span className="highlight">Policy</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '1rem' }}>
              PELICAN TRADING, LLC
            </p>
            <div className="privacy-meta">
              <span>Effective Date: January 12, 2026</span>
              <span>|</span>
              <span>Last Updated: January 12, 2026</span>
            </div>
          </header>

          <div className="privacy-content">
            {/* Section 1 */}
            <section id="section-1" className="privacy-section">
              <h2 className="privacy-section-title">
                <span className="privacy-section-number">1</span>
                INTRODUCTION
              </h2>
              
              <div className="privacy-subsection">
                <p className="privacy-text">
                  Pelican Trading, LLC (&quot;Pelican,&quot; &quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, services, websites, and applications (collectively, the &quot;Services&quot;).
                </p>
                <p className="privacy-text">
                  By accessing or using the Services, you agree to this Privacy Policy. If you do not agree, please do not use the Services.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="privacy-section">
              <h2 className="privacy-section-title">
                <span className="privacy-section-number">2</span>
                INFORMATION WE COLLECT
              </h2>

              <div className="privacy-subsection">
                <h3 className="privacy-subsection-title">2.1 Information You Provide</h3>
                <ul className="privacy-list">
                  <li><strong>Account Information:</strong> Name, email address, password, and billing information when you create an account or subscribe</li>
                  <li><strong>Payment Information:</strong> Credit card details and billing address (processed securely by Stripe; we do not store full card numbers)</li>
                  <li><strong>User Content:</strong> Trading queries, prompts, uploaded files, and any content you submit through the Services</li>
                  <li><strong>Communications:</strong> Emails, support requests, and feedback you send to us</li>
                </ul>
              </div>

              <div className="privacy-subsection">
                <h3 className="privacy-subsection-title">2.2 Information Collected Automatically</h3>
                <ul className="privacy-list">
                  <li><strong>Usage Data:</strong> Features accessed, queries made, timestamps, session duration, and interaction patterns</li>
                  <li><strong>Device Information:</strong> Browser type, operating system, device identifiers, and screen resolution</li>
                  <li><strong>Log Data:</strong> IP address, access times, pages viewed, and referring URLs</li>
                  <li><strong>Cookies and Similar Technologies:</strong> See Section 7 below</li>
                </ul>
              </div>

              <div className="privacy-subsection">
                <h3 className="privacy-subsection-title">2.3 Information From Third Parties</h3>
                <ul className="privacy-list">
                  <li><strong>Authentication Providers:</strong> If you sign in via third-party services (e.g., Google), we receive basic profile information</li>
                  <li><strong>Payment Processors:</strong> Stripe provides transaction confirmations and subscription status</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section id="section-3" className="privacy-section">
              <h2 className="privacy-section-title">
                <span className="privacy-section-number">3</span>
                HOW WE USE YOUR INFORMATION
              </h2>

              <div className="privacy-subsection">
                <p className="privacy-text">We use collected information to:</p>
                <ul className="privacy-list">
                  <li>Provide, operate, and maintain the Services</li>
                  <li>Process transactions and manage subscriptions</li>
                  <li>Respond to your inquiries and provide customer support</li>
                  <li>Personalize and improve your experience</li>
                  <li>Send administrative communications (account updates, security alerts, policy changes)</li>
                  <li>Analyze usage patterns to improve the Services</li>
                  <li>Detect, prevent, and address fraud, abuse, or security issues</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>

              <div className="privacy-subsection">
                <p className="privacy-text"><strong>We do not:</strong></p>
                <ul className="privacy-list">
                  <li>Sell your personal information to third parties</li>
                  <li>Use your trading queries to train AI models without explicit consent</li>
                  <li>Share your personal data for third-party marketing purposes</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="privacy-section">
              <h2 className="privacy-section-title">
                <span className="privacy-section-number">4</span>
                HOW WE SHARE YOUR INFORMATION
              </h2>

              <div className="privacy-subsection">
                <h3 className="privacy-subsection-title">4.1 Service Providers</h3>
                <p className="privacy-text">Third-party vendors who perform services on our behalf:</p>
                <div className="privacy-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Provider</th>
                        <th>Purpose</th>
                        <th>Data Shared</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Supabase</td>
                        <td>Authentication & database</td>
                        <td>Account data, user content</td>
                      </tr>
                      <tr>
                        <td>Stripe</td>
                        <td>Payment processing</td>
                        <td>Billing information</td>
                      </tr>
                      <tr>
                        <td>OpenAI / Anthropic</td>
                        <td>AI processing</td>
                        <td>Anonymized queries</td>
                      </tr>
                      <tr>
                        <td>Polygon</td>
                        <td>Market data</td>
                        <td>None (data flows to you)</td>
                      </tr>
                      <tr>
                        <td>Vercel</td>
                        <td>Hosting</td>
                        <td>Log data, IP addresses</td>
                      </tr>
                      <tr>
                        <td>Sentry</td>
                        <td>Error monitoring</td>
                        <td>Technical logs (no PII)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="privacy-subsection">
                <h3 className="privacy-subsection-title">4.2 Legal Requirements</h3>
                <p className="privacy-text">We may disclose information if required by law, legal process, or government request, or to:</p>
                <ul className="privacy-list">
                  <li>Protect the rights, property, or safety of Pelican, our users, or the public</li>
                  <li>Enforce our Terms of Service</li>
                  <li>Detect or prevent fraud or security issues</li>
                </ul>
              </div>

              <div className="privacy-subsection">
                <h3 className="privacy-subsection-title">4.3 Business Transfers</h3>
                <p className="privacy-text">
                  In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="privacy-section">
              <h2 className="privacy-section-title">
                <span className="privacy-section-number">5</span>
                DATA RETENTION
              </h2>

              <div className="privacy-subsection">
                <p className="privacy-text">We retain your information for as long as:</p>
                <ul className="privacy-list">
                  <li>Your account is active</li>
                  <li>Necessary to provide the Services</li>
                  <li>Required by law or for legitimate business purposes</li>
                </ul>
              </div>

              <div className="privacy-subsection">
                <p className="privacy-text"><strong>After account deletion:</strong></p>
                <ul className="privacy-list">
                  <li>Account data is deleted within 30 days</li>
                  <li>Anonymized usage analytics may be retained indefinitely</li>
                  <li>Backups are purged within 90 days</li>
                  <li>Legal/compliance records retained as required by law</li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section id="section-6" className="privacy-section">
              <h2 className="privacy-section-title">
                <span className="privacy-section-number">6</span>
                DATA SECURITY
              </h2>

              <div className="privacy-subsection">
                <p className="privacy-text">We implement industry-standard security measures including:</p>
                <ul className="privacy-list">
                  <li>Encryption in transit (TLS/HTTPS)</li>
                  <li>Encryption at rest for sensitive data</li>
                  <li>Secure authentication with hashed passwords</li>
                  <li>Regular security assessments</li>
                  <li>Access controls limiting employee access to data</li>
                </ul>
                <p className="privacy-text">
                  However, no method of transmission or storage is 100% secure. We cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your account credentials.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="section-7" className="privacy-section">
              <h2 className="privacy-section-title">
                <span className="privacy-section-number">7</span>
                COOKIES AND TRACKING TECHNOLOGIES
              </h2>

              <div className="privacy-subsection">
                <p className="privacy-text">We use cookies and similar technologies for:</p>
                <ul className="privacy-list">
                  <li><strong>Essential Cookies:</strong> Required for authentication and core functionality</li>
                  <li><strong>Analytics Cookies:</strong> To understand usage patterns and improve Services</li>
                  <li><strong>Preference Cookies:</strong> To remember your settings and preferences</li>
                </ul>
              </div>

              <div className="privacy-subsection">
                <p className="privacy-text"><strong>Managing Cookies:</strong></p>
                <ul className="privacy-list">
                  <li>Most browsers allow you to refuse or delete cookies</li>
                  <li>Disabling essential cookies may prevent you from using the Services</li>
                </ul>
                <p className="privacy-text">
                  We do not use cookies for third-party advertising.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="section-8" className="privacy-section">
              <h2 className="privacy-section-title">
                <span className="privacy-section-number">8</span>
                YOUR RIGHTS AND CHOICES
              </h2>

              <div className="privacy-subsection">
                <p className="privacy-text">Depending on your location, you may have the right to:</p>
                <ul className="privacy-list">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update inaccurate or incomplete data</li>
                  <li><strong>Deletion:</strong> Request deletion of your data (subject to legal retention requirements)</li>
                  <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
                  <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
                </ul>
              </div>

              <div className="privacy-subsection">
                <p className="privacy-text"><strong>To exercise these rights:</strong></p>
                <ul className="privacy-list">
                  <li>Email: <a href="mailto:support@pelicantrading.ai">support@pelicantrading.ai</a></li>
                  <li>Or use account settings where available</li>
                </ul>
                <p className="privacy-text">
                  We will respond to requests within 30 days (or as required by applicable law).
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section id="section-9" className="privacy-section">
              <h2 className="privacy-section-title">
                <span className="privacy-section-number">9</span>
                CALIFORNIA PRIVACY RIGHTS (CCPA)
              </h2>

              <div className="privacy-subsection">
                <p className="privacy-text">California residents have additional rights under the California Consumer Privacy Act:</p>
                <ul className="privacy-list">
                  <li><strong>Right to Know:</strong> Categories and specific pieces of personal information collected</li>
                  <li><strong>Right to Delete:</strong> Request deletion of personal information</li>
                  <li><strong>Right to Opt-Out:</strong> We do not sell personal information</li>
                  <li><strong>Non-Discrimination:</strong> We will not discriminate against you for exercising your rights</li>
                </ul>
                <p className="privacy-text">
                  To submit a request, email <a href="mailto:support@pelicantrading.ai">support@pelicantrading.ai</a> with &quot;CCPA Request&quot; in the subject line.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section id="section-10" className="privacy-section">
              <h2 className="privacy-section-title">
                <span className="privacy-section-number">10</span>
                INTERNATIONAL DATA TRANSFERS
              </h2>

              <div className="privacy-subsection">
                <p className="privacy-text">
                  The Services are operated in the United States. If you access the Services from outside the U.S., your information may be transferred to, stored, and processed in the U.S. where data protection laws may differ from your jurisdiction.
                </p>
                <p className="privacy-text">
                  By using the Services, you consent to such transfers.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section id="section-11" className="privacy-section">
              <h2 className="privacy-section-title">
                <span className="privacy-section-number">11</span>
                CHILDREN&apos;S PRIVACY
              </h2>

              <div className="privacy-subsection">
                <p className="privacy-text">
                  The Services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If we learn we have collected data from a child, we will delete it promptly. If you believe a child has provided us with personal information, please contact us.
                </p>
              </div>
            </section>

            {/* Section 12 */}
            <section id="section-12" className="privacy-section">
              <h2 className="privacy-section-title">
                <span className="privacy-section-number">12</span>
                THIRD-PARTY LINKS
              </h2>

              <div className="privacy-subsection">
                <p className="privacy-text">
                  The Services may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies.
                </p>
              </div>
            </section>

            {/* Section 13 */}
            <section id="section-13" className="privacy-section">
              <h2 className="privacy-section-title">
                <span className="privacy-section-number">13</span>
                CHANGES TO THIS POLICY
              </h2>

              <div className="privacy-subsection">
                <p className="privacy-text">
                  We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &quot;Last Updated&quot; date. Material changes will be notified via email or prominent notice on the Services.
                </p>
                <p className="privacy-text">
                  Continued use after changes constitutes acceptance of the updated policy.
                </p>
              </div>
            </section>

            {/* Section 14 */}
            <section id="section-14" className="privacy-section">
              <h2 className="privacy-section-title">
                <span className="privacy-section-number">14</span>
                CONTACT US
              </h2>

              <div className="privacy-contact">
                <p className="privacy-text">For questions, concerns, or requests regarding this Privacy Policy:</p>
                <p><strong>Pelican Trading, LLC</strong></p>
                <p>2045 W Grand Ave</p>
                <p>STE B 773866</p>
                <p>Chicago, IL 60612 US</p>
                <p>Contact us: <a href="mailto:support@pelicantrading.ai">support@pelicantrading.ai</a></p>
              </div>
            </section>

            {/* Final Notice */}
            <div className="privacy-notice">
              <p>By using the Services, you acknowledge that you have read and understood this Privacy Policy.</p>
            </div>
          </div>

          {/* CTA */}
          <div className="privacy-cta">
            <h3>Questions About Our Privacy Policy?</h3>
            <p>Contact our team if you need clarification on any of these terms.</p>
            <div className="privacy-cta-buttons">
              <a href="mailto:support@pelicantrading.ai" className="btn-secondary">
                Contact Support
              </a>
              <Link href="/" className="btn-primary">
                Back to Home →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="privacy-footer">
        <p>
          © 2025 Pelican Trading. <Link href="/">Back to Home</Link> | <Link href="/terms">Terms of Service</Link> | <Link href="/faq">FAQ</Link>
        </p>
      </footer>

      <HelpChat logoUrl="/pelican-logo-transparent.png" />
    </>
  );
}
