/**
 * Maps MEB (1–8. Sınıf), Lise (9–12. Sınıf), YKS-DİL, YDS/YÖKDİL, IELTS/TOEFL,
 * Academic & General English level IDs (or page slugs) to `/videos?playlist=` keys
 * used in `public/data/youtube_videos.json`.
 *
 * Also provides safe fallback resolution for the 23-language catalog (including Arabic `ar-en`)
 * so no pathway or URL query parameter ever produces a broken link or empty video view.
 */

export const VALID_YOUTUBE_PLAYLIST_KEYS = [
  "1sınıf",
  "2sınıf",
  "3sınıf",
  "4sınıf",
  "5sınıf",
  "6sınıf",
  "7sınıf",
  "8sınıf",
  "yds",
  "ar-en",
  "pt-en",
  "hap-bilgiler",
  "a2",
  "a2-travel",
  "crazy-english",
];

const NON_ENGLISH_PATHWAY_PREFIXES = [
  "other-almanca",
  "other-arabic-ar_tr",
  "other-chinesee",
  "other-french",
  "other-greek",
  "other-italy",
  "other-japan",
  "other-korean",
  "other-osm_tr",
  "other-portugal-brpt_tr",
  "other-russian",
  "other-spanish",
  "ar-tr",
  "de-en",
  "de-tr",
  "es-en",
  "es-tr",
  "fr-en",
  "fr-tr",
  "it-en",
  "it-tr",
  "ru-en",
  "ru-tr",
  "pt-tr",
  "ko-en",
  "ko-tr",
  "ja-en",
  "ja-tr",
  "zh-en",
  "zh-tr",
  "el-en",
  "el-tr",
  "ota-tr",
];

export function isNonEnglishVideoPathway(levelIdOrSlug) {
  if (!levelIdOrSlug) return false;
  const id = String(levelIdOrSlug).toLowerCase().trim();
  return NON_ENGLISH_PATHWAY_PREFIXES.some(
    (prefix) => id === prefix || id.startsWith(`${prefix}-`) || id.startsWith(`${prefix}_`)
  );
}

/**
 * @param {string} levelIdOrSlug
 * @param {{ allowFallback?: boolean }} [options]
 * @returns {string|null}
 */
export function getPlaylistCategory(levelIdOrSlug, options = {}) {
  if (!levelIdOrSlug) return options.allowFallback ? "hap-bilgiler" : null;
  const id = String(levelIdOrSlug).toLowerCase().trim();

  // Direct match with valid playlist keys
  const directMatch = VALID_YOUTUBE_PLAYLIST_KEYS.find(
    (k) => k === id || k.replace(/ı/g, "i") === id.replace(/ı/g, "i")
  );
  if (directMatch) return directMatch;

  // Arapça - İngilizce (ar-en / other-arabic-ar_en / PLYtLXOnKlTVo) oynatma listesi
  if (
    id === "pl-nkltvo" ||
    id.includes("other-arabic-ar_en") ||
    id.startsWith("ar-en") ||
    id.includes("arapca-ingilizce") ||
    id.includes("arabic-english")
  ) {
    return "ar-en";
  }

  // Brezilya Portekizcesi - İngilizce (pt-en / other-portugal-brpt_en / PLFty--cqLRvM) oynatma listesi
  if (
    id === "curso-de-ingl-s-do-zero-expl" ||
    id.includes("other-portugal-brpt_en") ||
    id.startsWith("pt-en") ||
    id.startsWith("brpt-en") ||
    id.includes("portekizce-ingilizce") ||
    id.includes("portuguese-english")
  ) {
    return "pt-en";
  }

  // Non-English 23-language pathways (e.g., Arabic ar-en, German, Korean, etc.)
  // do not show a broken/mismatched video link unless an explicit fallback is requested.
  if (isNonEnglishVideoPathway(id)) {
    if (!options.allowFallback) return null;
    if (id.includes("a2")) return "a2";
    if (id.includes("b1") || id.includes("b2") || id.includes("c1")) return "crazy-english";
    return "hap-bilgiler";
  }

  // Önce çift haneli lise sınıfları kontrol edilir ("10-sinif" içinde "1-sinif" çakışmasını önlemek için)
  if (id.includes("10-sinif") || id.includes("10.sinif") || id.includes("10sınıf") || id.includes("lise-10") || id.includes("lise10")) {
    return "a2";
  }
  if (id.includes("11-sinif") || id.includes("11.sinif") || id.includes("11sınıf") || id.includes("lise-11") || id.includes("lise11")) {
    return "crazy-english";
  }
  if (id.includes("12-sinif") || id.includes("12.sinif") || id.includes("12sınıf") || id.includes("lise-12") || id.includes("lise12")) {
    return "yds";
  }
  if (id.includes("9-sinif") || id.includes("9.sinif") || id.includes("9sınıf") || id.includes("lise-9") || id.includes("lise9")) {
    return "hap-bilgiler";
  }

  // Sınav & Akademik (YDS, YKS-DİL, YÖKDİL, IELTS, TOEFL, Academic, Sınav Özel)
  if (
    id.includes("yds") ||
    id.includes("yks") ||
    id.includes("ydt") ||
    id.includes("yokdil") ||
    id.includes("yökdil") ||
    id.includes("sinav_ozel") ||
    id.includes("sinav-ozel") ||
    id.includes("other-academic") ||
    id.includes("academic") ||
    id.includes("ielts") ||
    id.includes("toefl")
  ) {
    return "yds";
  }

  // İlkokul & Ortaokul (1–8. Sınıf & LGS)
  if (id.includes("meb-1") || id.includes("ilkokul-0") || id.includes("1-sinif")) return "1sınıf";
  if (
    id.includes("meb-2") ||
    id.includes("ilkokul-1") ||
    id.includes("ilkokul-2") ||
    id.includes("2-sinif")
  ) {
    return "2sınıf";
  }
  if (
    id.includes("meb-3") ||
    id.includes("ilkokul-3") ||
    id.includes("ilkokul-4") ||
    id.includes("3-sinif")
  ) {
    return "3sınıf";
  }
  if (
    id.includes("meb-4") ||
    id.includes("ilkokul-5") ||
    id.includes("ilkokul-6") ||
    id.includes("4-sinif")
  ) {
    return "4sınıf";
  }
  if (id.includes("meb-5") || id.includes("ortaokul-0") || id.includes("5-sinif")) return "5sınıf";
  if (id.includes("meb-6") || id.includes("ortaokul-1") || id.includes("6-sinif")) return "6sınıf";
  if (id.includes("meb-7") || id.includes("ortaokul-2") || id.includes("7-sinif")) return "7sınıf";
  if (id.includes("meb-8") || id.includes("ortaokul-3") || id.includes("8-sinif") || id.includes("lgs")) {
    return "8sınıf";
  }

  // Günlük Konuşma & Seyahat Cümleleri
  if (
    id.includes("temel_cumleler") ||
    id.includes("temel-cumleler") ||
    id.includes("yaz_cumleleri") ||
    id.includes("yaz-cumleleri") ||
    id.includes("a2-travel") ||
    id.includes("seyahat") ||
    id.includes("travel") ||
    id.includes("ulaşım") ||
    id.includes("ulasim") ||
    id.includes("alışveriş") ||
    id.includes("alisveris")
  ) {
    return "a2-travel";
  }

  // Genel İngilizce CEFR & Lise Seviyeleri (A1–C2 & Cümle Paketleri)
  if (id.includes("a1")) return "hap-bilgiler";
  if (id.includes("a2")) return "a2";
  if (id.includes("b1") || id.includes("crazy")) return "crazy-english";
  if (id.includes("b2") || id.includes("c1") || id.includes("c2")) return "yds";

  if (
    id.includes("en-tr_eng_genel-sentences") ||
    id.includes("ingilizce-genel-sentences") ||
    id.includes("en-tr_eng_genel") ||
    id.includes("ingilizce-genel")
  ) {
    return "crazy-english";
  }

  return options.allowFallback ? "hap-bilgiler" : null;
}

/**
 * `/videos?playlist=...` sayfasında kırık veya tanımsız parametre geldiğinde
 * asla boş bileşen göstermemek için güvenli kategori anahtarı döndürür.
 */
export function resolveSafePlaylistCategory(rawKey, availableKeys = VALID_YOUTUBE_PLAYLIST_KEYS) {
  if (!rawKey) return "all";
  const cleaned = String(rawKey).trim();
  if (!cleaned || cleaned.toLowerCase() === "all") return "all";

  const exact = availableKeys.find(
    (k) =>
      k === cleaned ||
      k.toLowerCase() === cleaned.toLowerCase() ||
      k.replace(/ı/g, "i").toLowerCase() === cleaned.replace(/ı/g, "i").toLowerCase()
  );
  if (exact) return exact;

  const mapped = getPlaylistCategory(cleaned, { allowFallback: false });
  if (mapped && availableKeys.includes(mapped)) return mapped;

  return "all";
}

/** @returns {string|null} e.g. `/videos/?playlist=1sınıf` */
export function videosPlaylistHref(levelIdOrSlug, options = {}) {
  const cat = getPlaylistCategory(levelIdOrSlug, options);
  if (!cat) return null;
  return `/videos/?playlist=${encodeURIComponent(cat)}`;
}
