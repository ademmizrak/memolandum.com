export const LOCALES = ["tr", "en"];
export const DEFAULT_LOCALE = "tr";
export const LOCALE_STORAGE_KEY = "memolandum-ui-locale";

export const LOCALE_LABELS = {
  tr: "TR",
  en: "EN",
};

/** Tarayıcı dili → desteklenen UI dili */
export function detectBrowserLocale() {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const list = navigator.languages?.length
    ? navigator.languages
    : [navigator.language || DEFAULT_LOCALE];
  for (const raw of list) {
    const code = String(raw || "").toLowerCase().slice(0, 2);
    if (code === "tr") return "tr";
    if (code === "en") return "en";
  }
  return DEFAULT_LOCALE;
}

export function readStoredLocale() {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (LOCALES.includes(v)) return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function resolveInitialLocale() {
  if (typeof window !== "undefined") {
    try {
      const q = new URLSearchParams(window.location.search).get("lang");
      if (LOCALES.includes(q)) return q;
    } catch {
      /* ignore */
    }
  }
  return readStoredLocale() || detectBrowserLocale() || DEFAULT_LOCALE;
}

export function persistLocale(locale) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  } catch {
    /* ignore */
  }
}
