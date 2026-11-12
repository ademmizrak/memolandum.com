/**
 * Client-safe dil yolu çözümleyici (fs yok).
 * SEO registry ile slug/alias → manifestLangId eşlemesi.
 */

const SLUG_TO_MANIFEST = {
  "en-tr": "en-tr_eng_genel",
  "de-en": "other-almanca-de_en",
  "de-tr": "other-almanca-de_tr",
  "ar-en": "other-arabic-ar_en",
  "ar-tr": "other-arabic-ar_tr",
  "zh-en": "other-chinesee-zh_ch_en",
  "zh-tr": "other-chinesee-zh_ch_tr",
  "fr-en": "other-french-fr_en",
  "fr-tr": "other-french-fr_tr",
  "el-en": "other-greek-el_en",
  "el-tr": "other-greek-el_tr",
  "it-en": "other-italy-it_en",
  "it-tr": "other-italy-it_tr",
  "ja-en": "other-japan-jap_en",
  "ja-tr": "other-japan-jap_tr",
  "ko-en": "other-korean-ko_en",
  "ko-tr": "other-korean-ko_tr",
  "pt-en": "other-portugal-brpt_en",
  "pt-tr": "other-portugal-brpt_tr",
  "ru-en": "other-russian-ru_en",
  "ru-tr": "other-russian-ru_tr",
  "es-en": "other-spanish-es_en",
  "es-tr": "other-spanish-es_tr",
};

const ALIAS_TO_SLUG = {
  en_tr: "en-tr",
  de_tr: "de-tr",
  de_en: "de-en",
  ar_tr: "ar-tr",
  ar_en: "ar-en",
  "en-ar": "ar-en",
  en_ar: "ar-en",
  "tr-ar": "ar-tr",
  tr_ar: "ar-tr",
  zh_tr: "zh-tr",
  zh_en: "zh-en",
  zh_ch_tr: "zh-tr",
  zh_ch_en: "zh-en",
  fr_tr: "fr-tr",
  fr_en: "fr-en",
  el_tr: "el-tr",
  el_en: "el-en",
  it_tr: "it-tr",
  it_en: "it-en",
  ja_tr: "ja-tr",
  jap_tr: "ja-tr",
  ja_en: "ja-en",
  jap_en: "ja-en",
  ko_tr: "ko-tr",
  ko_en: "ko-en",
  pt_tr: "pt-tr",
  brpt_tr: "pt-tr",
  pt_en: "pt-en",
  brpt_en: "pt-en",
  ru_tr: "ru-tr",
  ru_en: "ru-en",
  es_tr: "es-tr",
  es_en: "es-en",
};

const DIRECT_MANIFEST_ALIASES = {
  "en-tr_ilkokul": "en-tr_eng_ilkokul",
  "en-tr_ortaokul": "en-tr_eng_ortaokul",
  "en-tr_yds": "en-tr_eng_yds_kelimeleri",
  "en-tr_yks": "en-tr_eng_yks_kelimeleri",
  "en-tr_genel": "en-tr_eng_genel",
  "en-tr_sinav_ozel": "en-tr_eng_sinav_ozel",
  "en-tr_temel_cumleler": "en-tr_eng_temel_cumleler",
  "en-tr_yaz_cumleleri": "en-tr_eng_yaz_cumleleri",
};

const MANIFEST_IDS = new Set([
  ...Object.values(SLUG_TO_MANIFEST),
  "en-tr_eng_genel",
  "en-tr_eng_sinav_ozel",
  "en-tr_eng_temel_cumleler",
  "en-tr_eng_yaz_cumleleri",
  "en-tr_eng_yds_kelimeleri",
  "en-tr_eng_yks_kelimeleri",
  "en-tr_eng_ilkokul",
  "en-tr_eng_ortaokul",
]);

/** Anasayfa / hızlı seçim — fs yok, hafif indeks */
export const PATHWAY_INDEX = [
  { slug: "en-tr", sourceCode: "en", targetCode: "tr", labelTr: "İngilizce → Türkçe", labelEn: "English → Turkish", sourceNameTr: "İngilizce" },
  { slug: "de-en", sourceCode: "de", targetCode: "en", labelTr: "Almanca → İngilizce", labelEn: "German → English", sourceNameTr: "Almanca" },
  { slug: "de-tr", sourceCode: "de", targetCode: "tr", labelTr: "Almanca → Türkçe", labelEn: "German → Turkish", sourceNameTr: "Almanca" },
  { slug: "ar-en", sourceCode: "ar", targetCode: "en", labelTr: "Arapça → İngilizce", labelEn: "Arabic → English", sourceNameTr: "Arapça" },
  { slug: "ar-tr", sourceCode: "ar", targetCode: "tr", labelTr: "Arapça → Türkçe", labelEn: "Arabic → Turkish", sourceNameTr: "Arapça" },
  { slug: "zh-en", sourceCode: "zh", targetCode: "en", labelTr: "Çince → İngilizce", labelEn: "Chinese → English", sourceNameTr: "Çince" },
  { slug: "zh-tr", sourceCode: "zh", targetCode: "tr", labelTr: "Çince → Türkçe", labelEn: "Chinese → Turkish", sourceNameTr: "Çince" },
  { slug: "fr-en", sourceCode: "fr", targetCode: "en", labelTr: "Fransızca → İngilizce", labelEn: "French → English", sourceNameTr: "Fransızca" },
  { slug: "fr-tr", sourceCode: "fr", targetCode: "tr", labelTr: "Fransızca → Türkçe", labelEn: "French → Turkish", sourceNameTr: "Fransızca" },
  { slug: "el-en", sourceCode: "el", targetCode: "en", labelTr: "Yunanca → İngilizce", labelEn: "Greek → English", sourceNameTr: "Yunanca" },
  { slug: "el-tr", sourceCode: "el", targetCode: "tr", labelTr: "Yunanca → Türkçe", labelEn: "Greek → Turkish", sourceNameTr: "Yunanca" },
  { slug: "it-en", sourceCode: "it", targetCode: "en", labelTr: "İtalyanca → İngilizce", labelEn: "Italian → English", sourceNameTr: "İtalyanca" },
  { slug: "it-tr", sourceCode: "it", targetCode: "tr", labelTr: "İtalyanca → Türkçe", labelEn: "Italian → Turkish", sourceNameTr: "İtalyanca" },
  { slug: "ja-en", sourceCode: "ja", targetCode: "en", labelTr: "Japonca → İngilizce", labelEn: "Japanese → English", sourceNameTr: "Japonca" },
  { slug: "ja-tr", sourceCode: "ja", targetCode: "tr", labelTr: "Japonca → Türkçe", labelEn: "Japanese → Turkish", sourceNameTr: "Japonca" },
  { slug: "ko-en", sourceCode: "ko", targetCode: "en", labelTr: "Korece → İngilizce", labelEn: "Korean → English", sourceNameTr: "Korece" },
  { slug: "ko-tr", sourceCode: "ko", targetCode: "tr", labelTr: "Korece → Türkçe", labelEn: "Korean → Turkish", sourceNameTr: "Korece" },
  { slug: "pt-en", sourceCode: "pt", targetCode: "en", labelTr: "Portekizce → İngilizce", labelEn: "Portuguese → English", sourceNameTr: "Portekizce" },
  { slug: "pt-tr", sourceCode: "pt", targetCode: "tr", labelTr: "Portekizce → Türkçe", labelEn: "Portuguese → Turkish", sourceNameTr: "Portekizce" },
  { slug: "ru-en", sourceCode: "ru", targetCode: "en", labelTr: "Rusça → İngilizce", labelEn: "Russian → English", sourceNameTr: "Rusça" },
  { slug: "ru-tr", sourceCode: "ru", targetCode: "tr", labelTr: "Rusça → Türkçe", labelEn: "Russian → Turkish", sourceNameTr: "Rusça" },
  { slug: "es-en", sourceCode: "es", targetCode: "en", labelTr: "İspanyolca → İngilizce", labelEn: "Spanish → English", sourceNameTr: "İspanyolca" },
  { slug: "es-tr", sourceCode: "es", targetCode: "tr", labelTr: "İspanyolca → Türkçe", labelEn: "Spanish → Turkish", sourceNameTr: "İspanyolca" },
];

/** Deep-link: pathway=de-tr | lang=other-almanca-de_tr → manifestLangId */
export function resolveManifestLangId(raw) {
  if (!raw) return null;
  const key = String(raw).trim();
  if (MANIFEST_IDS.has(key)) return key;

  const lower = key.toLowerCase();
  if (DIRECT_MANIFEST_ALIASES[lower]) return DIRECT_MANIFEST_ALIASES[lower];

  const slug = SLUG_TO_MANIFEST[lower]
    ? lower
    : ALIAS_TO_SLUG[lower] || (SLUG_TO_MANIFEST[key] ? key : null);

  if (slug && SLUG_TO_MANIFEST[slug]) return SLUG_TO_MANIFEST[slug];
  return null;
}

export function getSlugFromManifestLangId(manifestLangId) {
  if (!manifestLangId) return null;
  if (manifestLangId.startsWith("en-tr")) {
    return "en-tr";
  }
  for (const [slug, mId] of Object.entries(SLUG_TO_MANIFEST)) {
    if (mId === manifestLangId) {
      return slug;
    }
  }
  return null;
}
