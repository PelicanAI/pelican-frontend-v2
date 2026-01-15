'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { languages, type Locale } from '@/lib/languages';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

export function LanguageSelector() {
  const [locale, setLocale] = useState<Locale>('en');
  const router = useRouter();

  useEffect(() => {
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1] as Locale;
    
    if (cookieLocale) {
      setLocale(cookieLocale);
    }
  }, []);

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale);
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  };

  const selectedLanguage = locale;

  return (
    <Select value={locale} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[72px] h-10 px-2 bg-background border-border hover:bg-accent/50 transition-colors gap-1">
        <span className="font-mono text-sm text-muted-foreground">
          {selectedLanguage.toUpperCase()}
        </span>
      </SelectTrigger>
      <SelectContent className="max-h-[400px] z-dropdown">
        {languages.map((lang) => (
          <SelectItem 
            key={lang.code} 
            value={lang.code}
            className="py-2"
          >
            <div className="flex items-center gap-3 min-w-[160px]">
              <span className="font-mono text-xs text-muted-foreground w-6">{lang.code.toUpperCase()}</span>
              <span className="text-sm">{lang.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
