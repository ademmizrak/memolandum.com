export const LOCALES = ["tr", "en"];
export const DEFAULT_LOCALE = "en";
export const LOCALE_STORAGE_KEY = "memolandum-ui-locale";

export const LOCALE_LABELS = {
  tr: "TR",
  en: "EN",
};

/** Tarayıcı dili → desteklenen UI dili */
export function detectBrowserLocale() {
  if (typeof navigator === "undefined") return "en";
  const list = navigator.languages?.length
    ? navigator.languages
    : [navigator.language || ""];

  const trIndex = list.findIndex(raw => String(raw || "").toLowerCase().slice(0, 2) === "tr");
  const enIndex = list.findIndex(raw => String(raw || "").toLowerCase().slice(0, 2) === "en");

  if (trIndex !== -1 && (enIndex === -1 || trIndex < enIndex)) {
    return "tr";
  }
  if (enIndex !== -1) {
    return "en";
  }

  // Türkiye saat dilimi kontrolü
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && (tz === "Europe/Istanbul" || tz.startsWith("Asia/Istanbul") || tz === "Asia/Ankara")) {
      return "tr";
    }
  } catch {
    /* ignore */
  }

  return "en";
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
