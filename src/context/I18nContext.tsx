import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  LanguageMeta,
} from '../services/i18n/translations';

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  isRTL: boolean;
  languageMeta: LanguageMeta;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const STORAGE_KEY = 'speakup_language_v1';

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
        if (saved && TRANSLATIONS[saved]) return saved;
      } catch {
        // Fallback
      }
    }
    return 'en';
  });

  const languageMeta =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  const isRTL = languageMeta.dir === 'rtl';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, language);
      } catch {
        // ignore
      }
    }
  }, [language, isRTL]);

  const setLanguage = (lang: SupportedLanguage) => {
    if (TRANSLATIONS[lang]) {
      setLanguageState(lang);
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    let text = dict[key] || TRANSLATIONS.en[key] || key;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }

    return text;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, isRTL, languageMeta, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
};
