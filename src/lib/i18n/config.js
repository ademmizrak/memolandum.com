export const LOCALES = ["tr", "en", "ar", "pt"];
export const DEFAULT_LOCALE = "tr";
export const LOCALE_STORAGE_KEY = "memolandum-ui-locale";

export const LOCALE_LABELS = {
  tr: "TR",
  en: "EN",
  ar: "AR",
  pt: "PT",
};

const ARAB_TIMEZONES = new Set([
  "Asia/Baghdad",
  "Asia/Riyadh",
  "Asia/Kuwait",
  "Asia/Dubai",
  "Asia/Qatar",
  "Asia/Bahrain",
  "Asia/Muscat",
  "Asia/Amman",
  "Asia/Damascus",
  "Asia/Beirut",
  "Asia/Gaza",
  "Asia/Hebron",
  "Asia/Aden",
  "Africa/Cairo",
  "Africa/Tripoli",
  "Africa/Tunis",
  "Africa/Algiers",
  "Africa/Casablanca",
  "Africa/Khartoum",
]);

const BRAZIL_TIMEZONES = new Set([
  "America/Sao_Paulo",
  "America/Fortaleza",
  "America/Recife",
  "America/Bahia",
  "America/Belem",
  "America/Manaus",
  "America/Cuiaba",
  "America/Porto_Velho",
  "America/Boa_Vista",
  "America/Rio_Branco",
  "America/Maceio",
  "America/Campo_Grande",
  "America/Araguaina",
  "America/Noronha",
  "Europe/Lisbon",
]);

const BOT_UA_REGEX =
  /bot|googlebot|google-inspectiontool|googleother|crawler|spider|robot|crawling|bingbot|slurp|duckduckbot|baiduspider|yandexbot|gptbot|oai-searchbot|claudebot|anthropic|perplexity|applebot|lighthouse/i;

export function isSearchCrawler() {
  if (typeof navigator === "undefined") return false;
  return BOT_UA_REGEX.test(navigator.userAgent || "");
}

/** Tarayıcı dili + saat dilimi → desteklenen UI dili */
export function detectBrowserLocale() {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  if (isSearchCrawler()) return DEFAULT_LOCALE;
  const list = navigator.languages?.length
    ? navigator.languages
    : [navigator.language || ""];

  // 1. Öncelik: Tarayıcının birincil dili doğrudan tr / ar / pt ise
  const primary = String(list[0] || "").toLowerCase().slice(0, 2);
  if (primary === "tr" || primary === "ar" || primary === "pt") {
    return primary;
  }

  // 2. Tarayıcı dil listesinde ikincil olarak tr / ar / pt varsa (örn. ["en-US", "ar-IQ"])
  for (const raw of list) {
    const code = String(raw || "").toLowerCase().slice(0, 2);
    if (code === "tr") return "tr";
    if (code === "ar") return "ar";
    if (code === "pt") return "pt";
  }

  // 3. Saat dilimi kontrolü (Irak/Arap ülkeleri, Brezilya ve Türkiye — cihaz dili İngilizce olsa bile)
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      if (tz === "Europe/Istanbul" || tz.startsWith("Asia/Istanbul") || tz === "Asia/Ankara") {
        return "tr";
      }
      if (ARAB_TIMEZONES.has(tz)) {
        return "ar";
      }
      if (BRAZIL_TIMEZONES.has(tz)) {
        return "pt";
      }
    }
  } catch {
    /* ignore */
  }

  for (const raw of list) {
    const code = String(raw || "").toLowerCase().slice(0, 2);
    if (code === "en") return "en";
  }

  return list.some(Boolean) ? "en" : DEFAULT_LOCALE;
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

export function resolveInitialLocale(preferredLocale = null) {
  if (typeof window !== "undefined") {
    try {
      const q = new URLSearchParams(window.location.search).get("lang");
      if (LOCALES.includes(q)) return q;
      const pathSeg = (window.location.pathname.split("/").filter(Boolean)[0] || "").toLowerCase();
      if (pathSeg === "ar" || pathSeg === "pt" || pathSeg === "en") {
        return pathSeg;
      }
    } catch {
      /* ignore */
    }
  }
  if (preferredLocale && LOCALES.includes(preferredLocale) && preferredLocale !== DEFAULT_LOCALE) {
    return preferredLocale;
  }
  if (isSearchCrawler()) {
    return preferredLocale && LOCALES.includes(preferredLocale) ? preferredLocale : DEFAULT_LOCALE;
  }
  return readStoredLocale() || detectBrowserLocale() || DEFAULT_LOCALE;
}

const HOME_LOCALIZED_META = {
  tr: {
    title: "Memolandum — 1–12. Sınıf İngilizce · 23 Dil · Okul & Veli Karnesi",
    description:
      "1–12. sınıf MEB İngilizce & LGS/YDS · 23 dil yolu · 10 ücretsiz oyun (Retro Shooter, OrbitLex vb.) · Öğretmen Sınıf Masası (/schools) · Veli Başarı Karnesi (/veli-rehberi).",
    canonical: "https://memolandum.com/",
  },
  en: {
    title: "Memolandum — Free Vocabulary Arcade Games & Spaced Repetition | 23 Language Pathways",
    description:
      "Master vocabulary across 23 language pathways with 10 free, ad-free arcade games (Retro Shooter, OrbitLex), Ebbinghaus spaced repetition (SM-2), Grades 1–12 English curriculum, and Gemini AI Instant Translation.",
    canonical: "https://memolandum.com/en/",
  },
  ar: {
    title: "Memolandum — تعلّم الإنجليزية واللغات بالألعاب مجاناً | 23 مساراً لغوياً والصفوف 1–12",
    description:
      "منصة مجانية وخالية من الإعلانات لحفظ الكلمات وتعلّم الإنجليزية والتركية عبر 10 ألعاب أركيد تفاعلية ونظام التكرار المتباعد (Memolandum Pulse) في 23 مساراً لغوياً + ترجمة فورية بالذكاء الاصطناعي.",
    canonical: "https://memolandum.com/ar/",
  },
  pt: {
    title: "Memolandum — Aprenda Inglês e Vocabulário Jogando Grátis | 23 Idiomas e ENEM",
    description:
      "Plataforma 100% gratuita e sem anúncios para memorizar vocabulário em inglês e 23 trilhas de idiomas com 10 jogos arcade, repetição espaçada (SM-2), currículo do 1º ao 12º ano e Tradução Instantânea IA.",
    canonical: "https://memolandum.com/pt/",
  },
};

export function persistLocale(locale) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    if (locale === "ar" && !document.getElementById("mm-arabic-font")) {
      const link = document.createElement("link");
      link.id = "mm-arabic-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap";
      document.head.appendChild(link);
    }

    // Ana sayfa ve dil portallarında (/, /ar/, /pt/, /en/) title, meta description ve canonical etiketlerini yalnızca açık dil parametresi veya ilgili dil yolu varsa senkronize et
    const cleanPath = (window.location.pathname || "/").replace(/\/+$/, "") || "/";
    const hasLangQuery = window.location.search.includes("lang=");
    if (
      (cleanPath === "/" && (hasLangQuery || locale === "tr")) ||
      cleanPath === "/ar" ||
      cleanPath === "/pt" ||
      cleanPath === "/en"
    ) {
      const meta = HOME_LOCALIZED_META[locale];
      if (meta) {
        document.title = meta.title;
        const descEl = document.querySelector('meta[name="description"]');
        if (descEl) descEl.setAttribute("content", meta.description);
        const ogTitleEl = document.querySelector('meta[property="og:title"]');
        if (ogTitleEl) ogTitleEl.setAttribute("content", meta.title);
        const ogDescEl = document.querySelector('meta[property="og:description"]');
        if (ogDescEl) ogDescEl.setAttribute("content", meta.description);
        const canonEl = document.querySelector('link[rel="canonical"]');
        if (canonEl && (hasLangQuery || cleanPath !== "/")) {
          canonEl.setAttribute("href", meta.canonical);
        }
      }
    }
  } catch {
    /* ignore */
  }
}
