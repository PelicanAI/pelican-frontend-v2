'use client';

import { useEffect } from 'react';

interface ScrollAnimationObserverProps {
  /** Additional selectors to observe beyond .animate-on-scroll */
  extraSelectors?: string[];
  /** Dependency to re-run observer (e.g. active tab) */
  dep?: string | number;
}

export default function ScrollAnimationObserver({
  extraSelectors = [],
  dep,
}: ScrollAnimationObserverProps) {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    const selectors = ['.animate-on-scroll', ...extraSelectors];
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        observer.observe(el);
      });
    });

    // Staggered animation for feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
      (card as HTMLElement).style.transitionDelay = `${index * 0.1}s`;
    });

    return () => observer.disconnect();
  }, [dep, extraSelectors]);

  return null;
}
