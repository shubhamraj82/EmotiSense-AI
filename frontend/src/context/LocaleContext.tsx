import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  parseStoredLocale,
  UI_LOCALE_STORAGE_KEY,
  type UILocale,
} from '../lib/i18n/locales';
import {
  interpolate,
  translations,
  type MessageKey,
} from '../lib/i18n/translations';

type LocaleContextValue = {
  locale: UILocale;
  setLocale: (locale: UILocale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function htmlLangFor(locale: UILocale): string {
  if (locale === 'hi') return 'hi';
  if (locale === 'bn') return 'bn';
  if (locale === 'or') return 'or';
  return 'en';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<UILocale>(() => {
    return parseStoredLocale(sessionStorage.getItem(UI_LOCALE_STORAGE_KEY)) ?? 'en';
  });

  const setLocale = useCallback((next: UILocale) => {
    sessionStorage.setItem(UI_LOCALE_STORAGE_KEY, next);
    setLocaleState(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = htmlLangFor(locale);
  }, [locale]);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      const table = translations[locale];
      let s = table[key] ?? translations.en[key] ?? key;
      if (vars) s = interpolate(s, vars);
      return s;
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}
