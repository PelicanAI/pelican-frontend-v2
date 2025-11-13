'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Locale, translatedLocales } from '@/lib/languages';
import { Translations } from '@/types/translations';

interface TranslationContextType {
  t: Translations;
  locale: Locale;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  const [translations, setTranslations] = useState<Translations | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get locale from cookie
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1] as Locale;
    
    if (cookieLocale) {
      setLocale(cookieLocale);
    }

    // Listen for locale changes (when user selects new language)
    const checkLocaleChange = () => {
      const newLocale = document.cookie
        .split('; ')
        .find(row => row.startsWith('locale='))
        ?.split('=')[1] as Locale;
      
      if (newLocale && newLocale !== locale) {
        setLocale(newLocale);
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
    const translationLocale = translatedLocales.includes(locale as any) 
      ? locale 
      : 'en';

    import(`@/messages/${translationLocale}.json`)
      .then(module => {
        setTranslations(module.default);
        setIsLoading(false);
      })
      .catch(() => {
        // Fallback to English if something goes wrong
        import('@/messages/en.json').then(module => {
          setTranslations(module.default);
          setIsLoading(false);
        });
      });
  }, [locale]);

  if (!translations) {
    return null; // Or a loading spinner
  }

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

