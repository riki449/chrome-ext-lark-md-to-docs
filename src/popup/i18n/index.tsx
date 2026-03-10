import { createContext, useCallback, useContext, useState } from 'react';
import messages, { Locale, LOCALE_FLAGS, LOCALE_LABELS } from './messages';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextValue>(null!);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('md2lark_locale') as Locale | null;
    return saved && messages[saved] ? saved : 'en';
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('md2lark_locale', l);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string>): string => {
    let text = messages[locale]?.[key] || messages.en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export { LOCALE_FLAGS, LOCALE_LABELS, type Locale };

