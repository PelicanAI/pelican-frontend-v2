'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/providers/translation-provider';
import { LanguageSelector } from '@/components/language-selector';

interface NavLink {
  href: string;
  label: string;
  active?: boolean;
  isAnchor?: boolean;
  onClick?: () => void;
}

interface MarketingNavProps {
  links: NavLink[];
  ctaLabel?: string;
  ctaAction?: 'login' | 'signup';
  mobileNavId?: string;
}

export default function MarketingNav({
  links,
  ctaLabel,
  ctaAction = 'login',
  mobileNavId = 'marketing-mobile-nav',
}: MarketingNavProps) {
  const router = useRouter();
  const t = useT();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const resolvedCtaLabel = ctaLabel ?? t.marketing.nav.launchApp;

  const handleCta = () => {
    router.push(ctaAction === 'login' ? '/auth/login' : '/auth/signup');
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileNavOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav>
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          <Image src="/pelican-logo-transparent.webp" alt="Pelican" width={32} height={32} />
          <span>Pelican</span>
        </Link>
        <div className="nav-links">
          {links.map((link) =>
            link.isAnchor ? (
              <a key={link.href} href={link.href} className={link.active ? 'active' : ''}>
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={link.active ? 'active' : ''}
              >
                {link.label}
              </Link>
            )
          )}
          <LanguageSelector />
          <button onClick={handleCta} className="btn-primary">
            {resolvedCtaLabel}
          </button>
        </div>
        <button
          type="button"
          className="nav-toggle"
          aria-label="Open menu"
          aria-expanded={mobileNavOpen}
          aria-controls={mobileNavId}
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          <span className="nav-toggle-line" />
          <span className="nav-toggle-line" />
          <span className="nav-toggle-line" />
        </button>
      </div>
      <div
        id={mobileNavId}
        className={`nav-mobile ${mobileNavOpen ? 'open' : ''}`}
      >
        <div className="nav-mobile-inner">
          {links.map((link) =>
            link.isAnchor ? (
              <a
                key={link.href}
                href={link.href}
                className={link.active ? 'active' : ''}
                onClick={() => setMobileNavOpen(false)}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={link.active ? 'active' : ''}
                onClick={() => setMobileNavOpen(false)}
              >
                {link.label}
              </Link>
            )
          )}
          <LanguageSelector />
          <button
            onClick={() => {
              setMobileNavOpen(false);
              handleCta();
            }}
            className="btn-primary"
          >
            {resolvedCtaLabel}
          </button>
        </div>
      </div>
    </nav>
  );
}
