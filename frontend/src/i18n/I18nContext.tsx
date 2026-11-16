import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  DEFAULT_LOCALE,
  applyDocumentLang,
  loadLocale,
  saveLocale,
  syncLocaleFromNative,
  translate,
  type Locale,
} from "./translations";

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const defaultContextValue: I18nContextValue = {
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, params) => translate(DEFAULT_LOCALE, key, params),
};

const I18nContext = createContext<I18nContextValue>(defaultContextValue);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => loadLocale());

  useEffect(() => {
    applyDocumentLang(locale);
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    void syncLocaleFromNative().then((nativeLocale) => {
      if (!cancelled && nativeLocale) {
        setLocaleState(nativeLocale);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    const saved = saveLocale(nextLocale);
    setLocaleState(saved);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
