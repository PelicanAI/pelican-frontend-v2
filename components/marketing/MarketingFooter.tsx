'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useT } from '@/lib/providers/translation-provider';

export default function MarketingFooter() {
  const t = useT();

  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-logo">
          <Image src="/pelican-logo-transparent.webp" alt="Pelican" width={32} height={32} />
          <span>Pelican Trading</span>
        </div>
        <div className="footer-links">
          <Link href="/terms">Terms of Use</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/faq">FAQ</Link>
        </div>
        <div className="footer-copy">
          {t.marketing.footer.copyright}
        </div>
      </div>
      <div className="footer-trust">
        Your data is encrypted with AES-256. Pelican is not a financial advisor. Not investment advice.
      </div>
    </footer>
  );
}
