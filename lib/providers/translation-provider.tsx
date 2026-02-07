'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Locale, translatedLocales } from '@/lib/languages';
import { Translations } from '@/types/translations';
import enTranslations from '@/messages/en.json';

interface TranslationContextType {
  t: Translations;
  locale: Locale;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  const [translations, setTranslations] = useState<Translations>(enTranslations as unknown as Translations);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get locale from cookie (default to English if missing/invalid)
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1] as Locale | undefined;

    const isValidLocale =
      !!cookieLocale &&
      (translatedLocales as readonly string[]).includes(cookieLocale);
    const initialLocale = (isValidLocale ? cookieLocale : 'en') as Locale;

    if (!cookieLocale || !isValidLocale) {
      document.cookie = `locale=en; path=/; max-age=31536000; SameSite=Lax`;
    }

    setLocale(initialLocale);

    // Listen for locale changes (when user selects new language)
    const checkLocaleChange = () => {
      const newLocale = document.cookie
        .split('; ')
        .find(row => row.startsWith('locale='))
        ?.split('=')[1] as Locale | undefined;

      const isValidNewLocale =
        !!newLocale &&
        (translatedLocales as readonly string[]).includes(newLocale);
      const resolvedLocale = (isValidNewLocale ? newLocale : 'en') as Locale;

      if (!newLocale || !isValidNewLocale) {
        document.cookie = `locale=en; path=/; max-age=31536000; SameSite=Lax`;
      }

      if (resolvedLocale !== locale) {
        setLocale(resolvedLocale);
      }
    };

    // Check for locale changes every second (for when language selector updates)
    const interval = setInterval(checkLocaleChange, 1000);
    return () => clearInterval(interval);
  }, [locale]);

  useEffect(() => {
    setIsLoading(true);
    
    // Determine which translation file to load
    // If locale has translations, use it; otherwise use English
    const translationLocale: (typeof translatedLocales)[number] = 
      (translatedLocales as readonly string[]).includes(locale) 
        ? (locale as (typeof translatedLocales)[number])
        : 'en';

    import(`@/messages/${translationLocale}.json`)
      .then(async (localeModule) => {
        // Always load English as base
        const enModule = await import('@/messages/en.json')
        const en = enModule.default
        const locale = localeModule.default

        // Deep merge: English base + locale overrides
        // Missing keys in locale fall back to English
        setTranslations({
          ...en,
          ...locale,
          common: { ...en.common, ...(locale.common || {}) },
          chat: { ...en.chat, ...(locale.chat || {}) },
          market: { ...en.market, ...(locale.market || {}) },
          marketing: {
            ...en.marketing,
            ...(locale.marketing || {}),
            nav: { ...(en.marketing?.nav || {}), ...(locale.marketing?.nav || {}) },
            hero: { ...(en.marketing?.hero || {}), ...(locale.marketing?.hero || {}) },
            stats: { ...(en.marketing?.stats || {}), ...(locale.marketing?.stats || {}) },
            what: { ...(en.marketing?.what || {}), ...(locale.marketing?.what || {}) },
            features: { ...(en.marketing?.features || {}), ...(locale.marketing?.features || {}) },
            traders: { ...(en.marketing?.traders || {}), ...(locale.marketing?.traders || {}) },
            languages: { ...(en.marketing?.languages || {}), ...(locale.marketing?.languages || {}) },
            team: { ...(en.marketing?.team || {}), ...(locale.marketing?.team || {}) },
            pricing: { ...(en.marketing?.pricing || {}), ...(locale.marketing?.pricing || {}) },
            cta: { ...(en.marketing?.cta || {}), ...(locale.marketing?.cta || {}) },
            footer: { ...(en.marketing?.footer || {}), ...(locale.marketing?.footer || {}) },
            faq: { ...(en.marketing?.faq || {}), ...(locale.marketing?.faq || {}) },
          },
        })
        setIsLoading(false)
      })
      .catch(() => {
        // Complete fallback to English if locale file doesn't exist at all
        import('@/messages/en.json').then(module => {
          setTranslations(module.default)
          setIsLoading(false)
        })
      });
  }, [locale]);

  return (
    <TranslationContext.Provider value={{ t: translations, locale, isLoading }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useT() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useT must be used within TranslationProvider');
  }
  return context.t;
}

export function useLocale() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useLocale must be used within TranslationProvider');
  }
  return context.locale;
}

