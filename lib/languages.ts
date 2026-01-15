export const languages = [
  // Top 5 by trading market relevance
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', nativeName: 'हिन्दी' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', nativeName: 'العربية' },
  // Remaining languages alphabetically by English name
  { code: 'cs', name: 'Czech', flag: '🇨🇿', nativeName: 'Čeština' },
  { code: 'da', name: 'Danish', flag: '🇩🇰', nativeName: 'Dansk' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱', nativeName: 'Nederlands' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮', nativeName: 'Suomi' },
  { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'de', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'el', name: 'Greek', flag: '🇬🇷', nativeName: 'Ελληνικά' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱', nativeName: 'עברית' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺', nativeName: 'Magyar' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩', nativeName: 'Bahasa Indonesia' },
  { code: 'it', name: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾', nativeName: 'Bahasa Melayu' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴', nativeName: 'Norsk' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱', nativeName: 'Polski' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷', nativeName: 'Português' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴', nativeName: 'Română' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
  { code: 'sk', name: 'Slovak', flag: '🇸🇰', nativeName: 'Slovenčina' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪', nativeName: 'Svenska' },
  { code: 'th', name: 'Thai', flag: '🇹🇭', nativeName: 'ไทย' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷', nativeName: 'Türkçe' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦', nativeName: 'Українська' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', nativeName: 'Tiếng Việt' }
] as const;

export type Locale = typeof languages[number]['code'];

// Languages that have translation files
export const translatedLocales = [
  'en', 'zh', 'es', 'hi', 'ar', 
  'cs', 'da', 'nl', 'fi', 'fr', 
  'de', 'el', 'he', 'hu', 'id', 
  'it', 'ja', 'ko', 'ms', 'no', 
  'pl', 'pt', 'ro', 'ru', 'sk', 
  'sv', 'th', 'tr', 'uk', 'vi'
] as const;

export const countryToLocale: Record<string, Locale> = {
  'CN': 'zh', 'TW': 'zh', 'HK': 'zh', 'SG': 'zh',
  'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es', 'CL': 'es', 'PE': 'es',
  'SA': 'ar', 'AE': 'ar', 'EG': 'ar', 'JO': 'ar', 'KW': 'ar',
  'BR': 'pt', 'PT': 'pt', 'AO': 'pt', 'MZ': 'pt',
  'FR': 'fr', 'RU': 'ru', 'JP': 'ja', 'DE': 'de', 'KR': 'ko',
  'IT': 'it', 'TR': 'tr', 'NL': 'nl', 'PL': 'pl', 'SE': 'sv',
  'ID': 'id', 'UA': 'uk', 'IL': 'he', 'GR': 'el', 'CZ': 'cs',
  'RO': 'ro', 'HU': 'hu', 'DK': 'da', 'FI': 'fi', 'NO': 'no',
  'SK': 'sk', 'VN': 'vi', 'TH': 'th', 'MY': 'ms',
  'IN': 'hi', 'PK': 'hi', 'BD': 'hi',
  'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en', 'NZ': 'en'
};

