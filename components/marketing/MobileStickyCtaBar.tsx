'use client';

import { useState, useEffect } from 'react';

export default function MobileStickyCtaBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past ~600px (roughly past the hero)
      setVisible(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="mobile-sticky-cta">
      <a href="/auth/signup" className="mobile-sticky-cta-button">
        Try For Free &rarr;
      </a>
    </div>
  );
}
