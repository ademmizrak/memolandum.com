"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LOCALE,
  LOCALES,
  persistLocale,
  resolveInitialLocale,
} from "./config";
import { translate as tRaw, getMessages } from "./index";

const LocaleContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
  messages: getMessages(DEFAULT_LOCALE),
});

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = resolveInitialLocale();
    setLocaleState(initial);
    persistLocale(initial);
    setReady(true);
  }, []);

  const setLocale = useCallback((next) => {
    if (!LOCALES.includes(next)) return;
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const t = useCallback((key, vars) => tRaw(locale, key, vars), [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      messages: getMessages(locale),
      ready,
    }),
    [locale, setLocale, t, ready]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useT() {
  return useLocale().t;
}
