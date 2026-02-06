import type { Metadata } from 'next';
import Link from 'next/link';
import '../legal-styles.css';

export const metadata: Metadata = {
  title: 'Privacy Policy | Pelican Trading',
  description: 'Privacy Policy for Pelican Trading, LLC — how we collect, use, disclose, and safeguard your information.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <nav className="legal-nav">
        <Link href="/" className="back-link">← Back to Home</Link>
      </nav>
      <main className="legal-content">
        <h1>Privacy Policy</h1>
        <p className="legal-meta">
          <strong>PELICAN TRADING, LLC</strong><br />
          Effective Date: January 12, 2026<br />
          Last Updated: January 12, 2026
        </p>

        <section>
          <h2>1. INTRODUCTION</h2>
          <p>
            Pelican Trading, LLC (&quot;Pelican,&quot; &quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, services, websites, and applications (collectively, the &quot;Services&quot;).
          </p>
          <p>
            By accessing or using the Services, you agree to this Privacy Policy. If you do not agree, please do not use the Services.
          </p>
        </section>

        <section>
          <h2>2. INFORMATION WE COLLECT</h2>
          
          <h3>2.1 Information You Provide</h3>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, password, and billing information when you create an account or subscribe</li>
            <li><strong>Payment Information:</strong> Credit card details and billing address (processed securely by Stripe; we do not store full card numbers)</li>
            <li><strong>User Content:</strong> Trading queries, prompts, uploaded files, and any content you submit through the Services</li>
            <li><strong>Communications:</strong> Emails, support requests, and feedback you send to us</li>
          </ul>

          <h3>2.2 Information Collected Automatically</h3>
          <ul>
            <li><strong>Usage Data:</strong> Features accessed, queries made, timestamps, session duration, and interaction patterns</li>
            <li><strong>Device Information:</strong> Browser type, operating system, device identifiers, and screen resolution</li>
            <li><strong>Log Data:</strong> IP address, access times, pages viewed, and referring URLs</li>
            <li><strong>Cookies and Similar Technologies:</strong> See Section 7 below</li>
          </ul>

          <h3>2.3 Information From Third Parties</h3>
          <ul>
            <li><strong>Authentication Providers:</strong> If you sign in via third-party services (e.g., Google), we receive basic profile information</li>
            <li><strong>Payment Processors:</strong> Stripe provides transaction confirmations and subscription status</li>
          </ul>
        </section>

        <section>
          <h2>3. HOW WE USE YOUR INFORMATION</h2>
          <p>We use collected information to:</p>
          <ul>
            <li>Provide, operate, and maintain the Services</li>
            <li>Process transactions and manage subscriptions</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Personalize and improve your experience</li>
            <li>Send administrative communications (account updates, security alerts, policy changes)</li>
            <li>Analyze usage patterns to improve the Services</li>
            <li>Detect, prevent, and address fraud, abuse, or security issues</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p><strong>We do not:</strong></p>
          <ul>
            <li>Sell your personal information to third parties</li>
            <li>Use your trading queries to train AI models without explicit consent</li>
            <li>Share your personal data for third-party marketing purposes</li>
          </ul>
        </section>

        <section>
          <h2>4. HOW WE SHARE YOUR INFORMATION</h2>
          
          <h3>4.1 Service Providers</h3>
          <p>Third-party vendors who perform services on our behalf:</p>
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
                <td>Authentication &amp; database</td>
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

          <h3>4.2 Legal Requirements</h3>
          <p>We may disclose information if required by law, legal process, or government request, or to:</p>
          <ul>
            <li>Protect the rights, property, or safety of Pelican, our users, or the public</li>
            <li>Enforce our Terms of Service</li>
            <li>Detect or prevent fraud or security issues</li>
          </ul>

          <h3>4.3 Business Transfers</h3>
          <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.</p>
        </section>

        <section>
          <h2>5. DATA RETENTION</h2>
          <p>We retain your information for as long as:</p>
          <ul>
            <li>Your account is active</li>
            <li>Necessary to provide the Services</li>
            <li>Required by law or for legitimate business purposes</li>
          </ul>
          <p>After account deletion:</p>
          <ul>
            <li>Account data is deleted within 30 days</li>
            <li>Anonymized usage analytics may be retained indefinitely</li>
            <li>Backups are purged within 90 days</li>
            <li>Legal/compliance records retained as required by law</li>
          </ul>
        </section>

        <section>
          <h2>6. DATA SECURITY</h2>
          <p>We implement industry-standard security measures including:</p>
          <ul>
            <li>Encryption in transit (TLS/HTTPS)</li>
            <li>Encryption at rest for sensitive data</li>
            <li>Secure authentication with hashed passwords</li>
            <li>Regular security assessments</li>
            <li>Access controls limiting employee access to data</li>
          </ul>
          <p>
            <strong>However, no method of transmission or storage is 100% secure.</strong> We cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your account credentials.
          </p>
        </section>

        <section>
          <h2>7. COOKIES AND TRACKING TECHNOLOGIES</h2>
          <p>We use cookies and similar technologies for:</p>
          <ul>
            <li><strong>Essential Cookies:</strong> Required for authentication and core functionality</li>
            <li><strong>Analytics Cookies:</strong> To understand usage patterns and improve Services</li>
            <li><strong>Preference Cookies:</strong> To remember your settings and preferences</li>
          </ul>
          <p><strong>Managing Cookies:</strong></p>
          <ul>
            <li>Most browsers allow you to refuse or delete cookies</li>
            <li>Disabling essential cookies may prevent you from using the Services</li>
          </ul>
          <p>We do not use cookies for third-party advertising.</p>
        </section>

        <section>
          <h2>8. YOUR RIGHTS AND CHOICES</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update inaccurate or incomplete data</li>
            <li><strong>Deletion:</strong> Request deletion of your data (subject to legal retention requirements)</li>
            <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
            <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
          </ul>
          <p><strong>To exercise these rights:</strong></p>
          <ul>
            <li>Email: <a href="mailto:support@pelicantrading.ai">support@pelicantrading.ai</a></li>
            <li>Or use account settings where available</li>
          </ul>
          <p>We will respond to requests within 30 days (or as required by applicable law).</p>
        </section>

        <section>
          <h2>9. CALIFORNIA PRIVACY RIGHTS (CCPA)</h2>
          <p>California residents have additional rights under the California Consumer Privacy Act:</p>
          <ul>
            <li><strong>Right to Know:</strong> Categories and specific pieces of personal information collected</li>
            <li><strong>Right to Delete:</strong> Request deletion of personal information</li>
            <li><strong>Right to Opt-Out:</strong> We do not sell personal information</li>
            <li><strong>Non-Discrimination:</strong> We will not discriminate against you for exercising your rights</li>
          </ul>
          <p>To submit a request, email <a href="mailto:support@pelicantrading.ai">support@pelicantrading.ai</a> with &quot;CCPA Request&quot; in the subject line.</p>
        </section>

        <section>
          <h2>10. INTERNATIONAL DATA TRANSFERS</h2>
          <p>
            The Services are operated in the United States. If you access the Services from outside the U.S., your information may be transferred to, stored, and processed in the U.S. where data protection laws may differ from your jurisdiction.
          </p>
          <p>By using the Services, you consent to such transfers.</p>
        </section>

        <section>
          <h2>11. CHILDREN&apos;S PRIVACY</h2>
          <p>
            The Services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If we learn we have collected data from a child, we will delete it promptly. If you believe a child has provided us with personal information, please contact us.
          </p>
        </section>

        <section>
          <h2>12. THIRD-PARTY LINKS</h2>
          <p>
            The Services may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies.
          </p>
        </section>

        <section>
          <h2>13. CHANGES TO THIS POLICY</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &quot;Last Updated&quot; date. Material changes will be notified via email or prominent notice on the Services.
          </p>
          <p>Continued use after changes constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2>14. CONTACT US</h2>
          <p>For questions, concerns, or requests regarding this Privacy Policy:</p>
          <p>
            <strong>Pelican Trading, LLC</strong><br />
            2045 W Grand Ave<br />
            STE B 773866<br />
            Chicago, IL 60612 US
          </p>
          <p>
            <strong>Email:</strong> <a href="mailto:privacy@pelican.ai">privacy@pelican.ai</a><br />
            <strong>Support:</strong> <a href="mailto:support@pelicantrading.ai">support@pelicantrading.ai</a>
          </p>
        </section>

        <section style={{ marginTop: '3rem', padding: '1.5rem', background: 'var(--muted)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>
            <strong>By using the Services, you acknowledge that you have read and understood this Privacy Policy.</strong>
          </p>
        </section>
      </main>
    </div>
  );
}

