'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const resolvedCtaLabel = ctaLabel ?? t.marketing.nav.launchApp;

  const handleCta = () => {
    router.push(ctaAction === 'login' ? '/auth/login' : '/auth/signup');
  };

  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false);
    toggleButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileNavOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Focus trap for mobile nav
  useEffect(() => {
    if (!mobileNavOpen || !mobileNavRef.current) return;

    const panel = mobileNavRef.current;
    const focusableSelector = 'a[href], button, input, [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileNav();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusableElements = Array.from(
        panel.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus first focusable element when menu opens
    const focusableElements = panel.querySelectorAll<HTMLElement>(focusableSelector);
    focusableElements[0]?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileNavOpen, closeMobileNav]);

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
          ref={toggleButtonRef}
          type="button"
          className="nav-toggle"
          aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
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
        ref={mobileNavRef}
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
                onClick={() => closeMobileNav()}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={link.active ? 'active' : ''}
                onClick={() => closeMobileNav()}
              >
                {link.label}
              </Link>
            )
          )}
          <LanguageSelector />
          <button
            onClick={() => {
              closeMobileNav();
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
