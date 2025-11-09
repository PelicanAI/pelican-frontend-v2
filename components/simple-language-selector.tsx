"use client"

import { Globe } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLanguage, type Locale } from '@/lib/use-language'

const languages = [
  { code: 'en' as Locale, name: 'English', flag: '🇺🇸' },
  { code: 'es' as Locale, name: 'Español', flag: '🇪🇸' },
  { code: 'zh' as Locale, name: '中文', flag: '🇨🇳' },
  { code: 'ja' as Locale, name: '日本語', flag: '🇯🇵' },
  { code: 'pt' as Locale, name: 'Português', flag: '🇵🇹' },
]

export function SimpleLanguageSelector() {
  const { locale, setLocale } = useLanguage()

  return (
    <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
      <SelectTrigger className="w-[140px] h-10 bg-background border-border">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent className="z-dropdown">
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

