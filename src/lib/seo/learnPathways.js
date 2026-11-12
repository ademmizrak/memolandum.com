/**
 * Memolandum — 23 dil yolu SEO registry (SSG /learn/[langPair])
 * Tek kaynak: slug ↔ manifest langId ↔ kelime JSON ↔ SEO metinleri
 */
import fs from "fs";
import path from "path";
import { SITE_URL, SITE_NAME, absoluteUrl, OG_IMAGE } from "./siteConfig";

/**
 * @typedef {Object} LearnPathway
 * @property {string} slug - URL: /learn/{slug}/
 * @property {string} manifestLangId - store lastPlayedLang / subCategory.id
 * @property {string} sourceCode
 * @property {string} targetCode
 * @property {string} labelTr
 * @property {string} labelEn
 * @property {string} sourceNameTr
 * @property {string} targetNameTr
 * @property {string} wordsRelPath - public/data altı
 * @property {string} introTr
 * @property {string} introEn
 */

/** @type {LearnPathway[]} */
export const LEARN_PATHWAYS = [
  {
    slug: "en-tr",
    manifestLangId: "en-tr_eng_genel",
    sourceCode: "en",
    targetCode: "tr",
    labelTr: "İngilizce → Türkçe",
    labelEn: "English → Turkish",
    sourceNameTr: "İngilizce",
    targetNameTr: "Türkçe",
    wordsRelPath: "Turkish/content/en_tr/words_en_tr.json",
    introTr:
      "İngilizce–Türkçe kelime yolunda A1’den C2’ye arcade oyunlarla kelime ezberleyin. Spaced repetition ve active recall, Memolandum Pulse ritmiyle birleşir. YDS/YKS setleri, genel İngilizce listeleri ve 1–8. Sınıf (İlkokul & Ortaokul / LGS) İngilizce kelime & cümle müfredatı aynı hesapta.",
    introEn:
      "Master English–Turkish vocabulary from A1 to C2 with free arcade games. Spaced repetition and active recall run through Memolandum Pulse. General English, exam-oriented lists, and Grades 1–8 (Primary & Middle School / LGS) English words & sentences on one account.",
  },
  {
    slug: "de-en",
    manifestLangId: "other-almanca-de_en",
    sourceCode: "de",
    targetCode: "en",
    labelTr: "Almanca → İngilizce",
    labelEn: "German → English",
    sourceNameTr: "Almanca",
    targetNameTr: "İngilizce",
    wordsRelPath: "Almanca/content/de_en/words_de_en.json",
    introTr:
      "Almanca kelimeleri İngilizce açıklamalarla öğrenin. Retro Shooter, Breakout ve diğer arcade modüller Almanca dağarcığınızı oyun içinde pekiştirir — ücretsiz seviyeler, küresel erişim.",
    introEn:
      "Learn German vocabulary with English glosses through Memolandum arcade games. Free levels, spaced repetition, and Instant Translation support when you need a quick check.",
  },
  {
    slug: "de-tr",
    manifestLangId: "other-almanca-de_tr",
    sourceCode: "de",
    targetCode: "tr",
    labelTr: "Almanca → Türkçe",
    labelEn: "German → Turkish",
    sourceNameTr: "Almanca",
    targetNameTr: "Türkçe",
    wordsRelPath: "Almanca/content/de_tr/words_de_tr.json",
    introTr:
      "Almanca–Türkçe kelime ezberleme yolu: binlerce kelime, seviye bazlı listeler ve 8 arcade oyun. Türkiye’den Almanca öğrenenler için spaced repetition destekli ücretsiz pratik.",
    introEn:
      "German–Turkish vocabulary path with thousands of words, leveled lists, and eight arcade games. Spaced-repetition practice built for Turkish speakers learning German.",
  },
  {
    slug: "ar-en",
    manifestLangId: "other-arabic-ar_en",
    sourceCode: "ar",
    targetCode: "en",
    labelTr: "Arapça → İngilizce",
    labelEn: "Arabic → English",
    sourceNameTr: "Arapça",
    targetNameTr: "İngilizce",
    wordsRelPath: "Arabic/content/ar_en/words_ar_en.json",
    introTr:
      "Arapça–İngilizce konu anlatımı videoları (إتقان الإنجليزية خطوة بخطوة — /videos/?playlist=ar-en) ve 16 ücretsiz arcade oyunla kelime ve gramer pratiği yapın. RTL metinler, sesli kartlar ve Memolandum Pulse aralıklı tekrar ile kalıcı öğrenme.",
    introEn:
      "Master Arabic–English vocabulary and grammar with our step-by-step Arabic video course (إتقان الإنجليزية خطوة بخطوة at /videos/?playlist=ar-en) and 16 free arcade games. Spaced repetition (Memolandum Pulse) and Instant Translation.",
  },
  {
    slug: "ar-tr",
    manifestLangId: "other-arabic-ar_tr",
    sourceCode: "ar",
    targetCode: "tr",
    labelTr: "Arapça → Türkçe",
    labelEn: "Arabic → Turkish",
    sourceNameTr: "Arapça",
    targetNameTr: "Türkçe",
    wordsRelPath: "Arabic/content/ar_tr/words_ar_tr.json",
    introTr:
      "Arapça–Türkçe kelime öğrenme modülü: oyunla ezber, Kelime Kasası ve Anlık Çeviri desteği. Ücretsiz arcade seviyelerle düzenli tekrar.",
    introEn:
      "Arabic–Turkish vocabulary module with game-based memorization, Word Vault, and Instant Translation. Free arcade levels for steady review.",
  },
  {
    slug: "zh-en",
    manifestLangId: "other-chinesee-zh_ch_en",
    sourceCode: "zh",
    targetCode: "en",
    labelTr: "Çince → İngilizce",
    labelEn: "Chinese → English",
    sourceNameTr: "Çince",
    targetNameTr: "İngilizce",
    wordsRelPath: "Chinesee/content/zh_ch_en/words_ch_en.json",
    introTr:
      "Çince kelime yolunu İngilizce açıklamalarla keşfedin. Arcade mekanikleri karakter ve anlam eşleştirmeyi hızlandırır; Pulse tekrarı unutmayı engeller.",
    introEn:
      "Explore Chinese vocabulary with English glosses. Arcade mechanics speed up character–meaning pairing; Pulse reviews fight the forgetting curve.",
  },
  {
    slug: "zh-tr",
    manifestLangId: "other-chinesee-zh_ch_tr",
    sourceCode: "zh",
    targetCode: "tr",
    labelTr: "Çince → Türkçe",
    labelEn: "Chinese → Turkish",
    sourceNameTr: "Çince",
    targetNameTr: "Türkçe",
    wordsRelPath: "Chinesee/content/zh_ch_Tr/words_ch_tr.json",
    introTr:
      "Çince–Türkçe kelime ezberleme: oyun tabanlı pratik, kişisel kelime kasası ve Gemini Anlık Çeviri. Dünyanın her yerinden erişilebilir ücretsiz öğrenme yolu.",
    introEn:
      "Chinese–Turkish vocabulary learning with game practice, Word Vault, and Gemini Instant Translation. A free pathway accessible worldwide.",
  },
  {
    slug: "fr-en",
    manifestLangId: "other-french-fr_en",
    sourceCode: "fr",
    targetCode: "en",
    labelTr: "Fransızca → İngilizce",
    labelEn: "French → English",
    sourceNameTr: "Fransızca",
    targetNameTr: "İngilizce",
    wordsRelPath: "French/content/fr_en/words_fr_en.json",
    introTr:
      "Fransızca kelimeleri İngilizce anlamlarla arcade oyunlarda pekiştirin. Active recall sayesinde pasif liste ezberinden daha kalıcı sonuç.",
    introEn:
      "Reinforce French vocabulary with English meanings in arcade games. Active recall beats passive list memorization for long-term retention.",
  },
  {
    slug: "fr-tr",
    manifestLangId: "other-french-fr_tr",
    sourceCode: "fr",
    targetCode: "tr",
    labelTr: "Fransızca → Türkçe",
    labelEn: "French → Turkish",
    sourceNameTr: "Fransızca",
    targetNameTr: "Türkçe",
    wordsRelPath: "French/content/fr_tr/words_fr_tr.json",
    introTr:
      "Fransızca–Türkçe kelime yolu: seviye listeleri, cümle setleri ve 8 ücretsiz arcade oyun. Spaced repetition ile sınav ve günlük konuşma hazırlığı.",
    introEn:
      "French–Turkish pathway with leveled lists, sentence sets, and eight free arcade games. Spaced repetition for exams and everyday conversation.",
  },
  {
    slug: "el-en",
    manifestLangId: "other-greek-el_en",
    sourceCode: "el",
    targetCode: "en",
    labelTr: "Yunanca → İngilizce",
    labelEn: "Greek → English",
    sourceNameTr: "Yunanca",
    targetNameTr: "İngilizce",
    wordsRelPath: "Greek/content/el_en/words_el_en.json",
    introTr:
      "Yunanca alfabe ve kelime pratiğini İngilizce açıklamalarla oyun içinde yapın. Memolandum, nadir dil yollarını da aynı ücretsiz arcade deneyiminde sunar.",
    introEn:
      "Practice Greek alphabet and vocabulary with English glosses in-game. Memolandum brings less-common pathways into the same free arcade experience.",
  },
  {
    slug: "el-tr",
    manifestLangId: "other-greek-el_tr",
    sourceCode: "el",
    targetCode: "tr",
    labelTr: "Yunanca → Türkçe",
    labelEn: "Greek → Turkish",
    sourceNameTr: "Yunanca",
    targetNameTr: "Türkçe",
    wordsRelPath: "Greek/content/el_tr/words_el_tr.json",
    introTr:
      "Yunanca–Türkçe kelime ezberleme modülü: arcade oyunlar, Kelime Kasası ve Anlık Çeviri. Düzenli Pulse tekrarıyla kalıcı öğrenme.",
    introEn:
      "Greek–Turkish vocabulary module with arcade games, Word Vault, and Instant Translation. Steady Pulse reviews for lasting learning.",
  },
  {
    slug: "it-en",
    manifestLangId: "other-italy-it_en",
    sourceCode: "it",
    targetCode: "en",
    labelTr: "İtalyanca → İngilizce",
    labelEn: "Italian → English",
    sourceNameTr: "İtalyanca",
    targetNameTr: "İngilizce",
    wordsRelPath: "Italy/content/It_En/words_it_en.json",
    introTr:
      "İtalyanca kelimeleri İngilizce gloss’larla ezberleyin. Highway, Invaders ve Word Drop gibi oyunlar günlük kelimeyi refleks haline getirir.",
    introEn:
      "Memorize Italian words with English glosses. Highway, Invaders, and Word Drop turn everyday vocabulary into reflexes.",
  },
  {
    slug: "it-tr",
    manifestLangId: "other-italy-it_tr",
    sourceCode: "it",
    targetCode: "tr",
    labelTr: "İtalyanca → Türkçe",
    labelEn: "Italian → Turkish",
    sourceNameTr: "İtalyanca",
    targetNameTr: "Türkçe",
    wordsRelPath: "Italy/content/It_Tr/words_it_tr.json",
    introTr:
      "İtalyanca–Türkçe öğrenme yolu: binlerce kelime, ücretsiz arcade seviyeler ve bilimsel tekrar. Seyahat ve günlük konuşma için hızlı başlangıç.",
    introEn:
      "Italian–Turkish learning path: thousands of words, free arcade levels, and science-backed review. A fast start for travel and daily speech.",
  },
  {
    slug: "ja-en",
    manifestLangId: "other-japan-jap_en",
    sourceCode: "ja",
    targetCode: "en",
    labelTr: "Japonca → İngilizce",
    labelEn: "Japanese → English",
    sourceNameTr: "Japonca",
    targetNameTr: "İngilizce",
    wordsRelPath: "Japan/content/jap_en/words_ja_en.json",
    introTr:
      "Japonca kelime ve kana pratiğini İngilizce açıklamalarla arcade’de yapın. Dual coding: görsel oyun + yazılı kelime = daha güçlü bellek izi.",
    introEn:
      "Practice Japanese vocabulary and kana with English explanations in the arcade. Dual coding — visual play plus written words — strengthens memory traces.",
  },
  {
    slug: "ja-tr",
    manifestLangId: "other-japan-jap_tr",
    sourceCode: "ja",
    targetCode: "tr",
    labelTr: "Japonca → Türkçe",
    labelEn: "Japanese → Turkish",
    sourceNameTr: "Japonca",
    targetNameTr: "Türkçe",
    wordsRelPath: "Japan/content/jap_Tr/words_ja_tr.json",
    introTr:
      "Japonca–Türkçe kelime ezberleme: hiragana/katakana setleri, kelime listeleri ve 8 ücretsiz oyun. Anlık Çeviri ile ek kontrol.",
    introEn:
      "Japanese–Turkish vocabulary with hiragana/katakana sets, word lists, and eight free games. Instant Translation for extra checks.",
  },
  {
    slug: "ko-en",
    manifestLangId: "other-korean-ko_en",
    sourceCode: "ko",
    targetCode: "en",
    labelTr: "Korece → İngilizce",
    labelEn: "Korean → English",
    sourceNameTr: "Korece",
    targetNameTr: "İngilizce",
    wordsRelPath: "Korean/content/ko_en/words_ko_en.json",
    introTr:
      "Korece hangul ve kelime öğrenimini İngilizce gloss’larla oyunlaştırın. K-pop kelime setleri ve genel listeler aynı platformda.",
    introEn:
      "Gamify Korean hangul and vocabulary with English glosses. K-pop word sets and general lists live on the same platform.",
  },
  {
    slug: "ko-tr",
    manifestLangId: "other-korean-ko_tr",
    sourceCode: "ko",
    targetCode: "tr",
    labelTr: "Korece → Türkçe",
    labelEn: "Korean → Turkish",
    sourceNameTr: "Korece",
    targetNameTr: "Türkçe",
    wordsRelPath: "Korean/content/ko_tr/words_ko_tr.json",
    introTr:
      "Korece–Türkçe kelime yolu: hangul, kelime ve cümle pratikleri arcade oyunlarda. Ücretsiz öğrenme + Premium Anlık Çeviri kotası net.",
    introEn:
      "Korean–Turkish pathway: hangul, words, and sentences in arcade games. Free learning plus a clear Instant Translation premium quota.",
  },
  {
    slug: "pt-en",
    manifestLangId: "other-portugal-brpt_en",
    sourceCode: "pt",
    targetCode: "en",
    labelTr: "Portekizce (BR) → İngilizce",
    labelEn: "Portuguese (BR) → English",
    sourceNameTr: "Portekizce",
    targetNameTr: "İngilizce",
    wordsRelPath: "Portugal/content/BrPt_En/words_brpt_en.json",
    introTr:
      "Brezilya Portekizcesi–İngilizce sıfırdan video dersleri (Curso de Inglês do Zero Explicado em Português — /videos/?playlist=pt-en) ve 16 ücretsiz arcade oyunla kelime ezberleyin. Aprenda vocabulário e gramática de Inglês explicados em Português do Brasil com repetição espaçada (Memolandum Pulse).",
    introEn:
      "Curso de Inglês do Zero (Explicado em Português — /videos/?playlist=pt-en) + 16 free arcade vocabulary games (Português do Brasil ↔ Inglês). Spaced repetition (Memolandum Pulse), audio flashcards, ENEM prep, and Instant Translation.",
  },
  {
    slug: "pt-tr",
    manifestLangId: "other-portugal-brpt_tr",
    sourceCode: "pt",
    targetCode: "tr",
    labelTr: "Portekizce (BR) → Türkçe",
    labelEn: "Portuguese (BR) → Turkish",
    sourceNameTr: "Portekizce",
    targetNameTr: "Türkçe",
    wordsRelPath: "Portugal/content/Brpt_Tr/words_brpt_tr.json",
    introTr:
      "Portekizce–Türkçe kelime ezberleme: seviye listeleri, arcade oyunlar ve Kelime Kasası. Aprenda vocabulário Português (Brasil) ↔ Turco jogando grátis.",
    introEn:
      "Portuguese (Brazil)–Turkish vocabulary with leveled lists, arcade games, and Word Vault. Aprenda vocabulário Português do Brasil e Turco gratuitamente.",
  },
  {
    slug: "ru-en",
    manifestLangId: "other-russian-ru_en",
    sourceCode: "ru",
    targetCode: "en",
    labelTr: "Rusça → İngilizce",
    labelEn: "Russian → English",
    sourceNameTr: "Rusça",
    targetNameTr: "İngilizce",
    wordsRelPath: "Russian/content/ru_en/words_ru_en.json",
    introTr:
      "Rusça Kiril ve kelime pratiğini İngilizce açıklamalarla oyunlarda yapın. Active recall, uzun kelime formlarını kalıcı hafızaya taşır.",
    introEn:
      "Practice Russian Cyrillic and vocabulary with English glosses in games. Active recall moves long word forms into long-term memory.",
  },
  {
    slug: "ru-tr",
    manifestLangId: "other-russian-ru_tr",
    sourceCode: "ru",
    targetCode: "tr",
    labelTr: "Rusça → Türkçe",
    labelEn: "Russian → Turkish",
    sourceNameTr: "Rusça",
    targetNameTr: "Türkçe",
    wordsRelPath: "Russian/content/ru_tr/words_ru_tr.json",
    introTr:
      "Rusça–Türkçe kelime öğrenme yolu: alfabe, kelime ve cümle setleri. Ücretsiz arcade + spaced repetition; Anlık Çeviri ek destek.",
    introEn:
      "Russian–Turkish pathway: alphabet, words, and sentences. Free arcade plus spaced repetition; Instant Translation as backup.",
  },
  {
    slug: "es-en",
    manifestLangId: "other-spanish-es_en",
    sourceCode: "es",
    targetCode: "en",
    labelTr: "İspanyolca → İngilizce",
    labelEn: "Spanish → English",
    sourceNameTr: "İspanyolca",
    targetNameTr: "İngilizce",
    wordsRelPath: "Spanish/content/es_en/words_es_en.json",
    introTr:
      "İspanyolca kelimeleri İngilizce anlamlarla arcade’de pekiştirin. Dünyanın en çok konuşulan dillerinden biri için ücretsiz, oyun tabanlı pratik.",
    introEn:
      "Reinforce Spanish vocabulary with English meanings in the arcade. Free game-based practice for one of the world’s most spoken languages.",
  },
  {
    slug: "es-tr",
    manifestLangId: "other-spanish-es_tr",
    sourceCode: "es",
    targetCode: "tr",
    labelTr: "İspanyolca → Türkçe",
    labelEn: "Spanish → Turkish",
    sourceNameTr: "İspanyolca",
    targetNameTr: "Türkçe",
    wordsRelPath: "Spanish/content/es_tr/words_es_tr.json",
    introTr:
      "İspanyolca–Türkçe kelime ezberleme: binlerce kelime, 8 arcade oyun ve Pulse tekrarı. KPSS akademik sözlük ve Anlık Çeviri aynı platformda.",
    introEn:
      "Spanish–Turkish vocabulary: thousands of words, eight arcade games, and Pulse review. KPSS glossary and Instant Translation on the same platform.",
  },
];

const bySlug = new Map(LEARN_PATHWAYS.map((p) => [p.slug, p]));
const byManifest = new Map(LEARN_PATHWAYS.map((p) => [p.manifestLangId, p]));

/** Kısa alias → slug (deep-link) */
const ALIAS_TO_SLUG = {
  "en-tr": "en-tr",
  en_tr: "en-tr",
  "de-tr": "de-tr",
  de_tr: "de-tr",
  "de-en": "de-en",
  de_en: "de-en",
  "ar-tr": "ar-tr",
  ar_tr: "ar-tr",
  "ar-en": "ar-en",
  ar_en: "ar-en",
  "zh-tr": "zh-tr",
  zh_tr: "zh-tr",
  "zh-en": "zh-en",
  zh_en: "zh-en",
  zh_ch_tr: "zh-tr",
  zh_ch_en: "zh-en",
  "fr-tr": "fr-tr",
  fr_tr: "fr-tr",
  "fr-en": "fr-en",
  fr_en: "fr-en",
  "el-tr": "el-tr",
  el_tr: "el-tr",
  "el-en": "el-en",
  el_en: "el-en",
  "it-tr": "it-tr",
  it_tr: "it-tr",
  "it-en": "it-en",
  it_en: "it-en",
  "ja-tr": "ja-tr",
  ja_tr: "ja-tr",
  jap_tr: "ja-tr",
  "ja-en": "ja-en",
  ja_en: "ja-en",
  jap_en: "ja-en",
  "ko-tr": "ko-tr",
  ko_tr: "ko-tr",
  "ko-en": "ko-en",
  ko_en: "ko-en",
  "pt-tr": "pt-tr",
  pt_tr: "pt-tr",
  brpt_tr: "pt-tr",
  "pt-en": "pt-en",
  pt_en: "pt-en",
  brpt_en: "pt-en",
  "ru-tr": "ru-tr",
  ru_tr: "ru-tr",
  "ru-en": "ru-en",
  ru_en: "ru-en",
  "es-tr": "es-tr",
  es_tr: "es-tr",
  "es-en": "es-en",
  es_en: "es-en",
};

export function getAllPathways() {
  return LEARN_PATHWAYS;
}

export function getPathwayBySlug(slug) {
  if (!slug) return null;
  const key = String(slug).trim().toLowerCase();
  return bySlug.get(key) || bySlug.get(ALIAS_TO_SLUG[key]) || null;
}

/** Deep-link: pathway=de-tr | lang=other-almanca-de_tr → manifestLangId */
export function resolveManifestLangId(raw) {
  if (!raw) return null;
  const key = String(raw).trim();
  if (byManifest.has(key)) return key;
  const pathway = getPathwayBySlug(key) || getPathwayBySlug(ALIAS_TO_SLUG[key.toLowerCase()]);
  return pathway?.manifestLangId || null;
}

function resolvePublicDataPath(relPath) {
  const root = process["cwd"]();
  const primary = [root, "public", "data", relPath].join(path.sep);
  if (fs.existsSync(primary)) return primary;
  const slimFallback = [root, "public", "_slim_skip_data", relPath].join(path.sep);
  if (fs.existsSync(slimFallback)) return slimFallback;
  return primary;
}

function flattenPathwayList(data) {
  if (!data) return [];
  if (Array.isArray(data)) {
    if (data.length > 0 && Array.isArray(data[0]?.words)) {
      return data.flatMap((lv) =>
        (lv.words || []).map((w) => ({ ...w, level: w.level || lv.level || "" }))
      );
    }
    return data;
  }
  return data.words || data.items || data.vocabulary_vault || data.phrase_vault || [];
}

export function loadSampleWords(pathway, limit = 10) {
  if (!pathway?.wordsRelPath) return [];
  const filePath = resolvePublicDataPath(pathway.wordsRelPath);
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const list = flattenPathwayList(data);
    return list
      .filter((w) => w && (w.word || w.term || w.english || w.hanzi || w.original_script || w.mission_word || w.mission_phrase))
      .slice(0, limit)
      .map((w) => ({
        word:
          w.word ||
          w.term ||
          w.english ||
          (w.hanzi ? (w.pinyin ? `${w.hanzi} (${w.pinyin})` : w.hanzi) : "") ||
          w.original_script ||
          w.mission_word ||
          w.mission_phrase ||
          "",
        translation:
          w.translation ||
          w.meaning ||
          w.turkish ||
          w.gloss ||
          w.target_translation ||
          "",
        level: w.level || w.level_tag || (Array.isArray(w.tags) ? w.tags[0] : "") || "",
      }));
  } catch {
    return [];
  }
}

export function countWords(pathway) {
  if (!pathway?.wordsRelPath) return 0;
  const filePath = resolvePublicDataPath(pathway.wordsRelPath);
  try {
    if (!fs.existsSync(filePath)) return 0;
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const list = flattenPathwayList(data);
    return list.length;
  } catch {
    return 0;
  }
}

export function getPathwayAlternates(pathway) {
  const url = absoluteUrl(`/learn/${pathway.slug}/`);
  const equivalent = LEARN_PATHWAYS.find(
    (p) => p.sourceCode === pathway.sourceCode && p.targetCode !== pathway.targetCode
  );

  if (!equivalent) {
    return {
      canonical: url,
    };
  }

  const eqUrl = absoluteUrl(`/learn/${equivalent.slug}/`);
  const trUrl = pathway.targetCode === "tr" ? url : eqUrl;
  const enUrl = pathway.targetCode === "en" ? url : eqUrl;

  const languages = {
    tr: trUrl,
    "tr-TR": trUrl,
    en: enUrl,
    "en-US": enUrl,
    "x-default": enUrl,
  };

  if (pathway.sourceCode === "ar") {
    languages.ar = enUrl;
    languages["ar-IQ"] = enUrl;
    languages["ar-SA"] = enUrl;
    languages["ar-EG"] = enUrl;
  }
  if (pathway.sourceCode === "pt") {
    languages.pt = enUrl;
    languages["pt-BR"] = enUrl;
  }

  return {
    canonical: url,
    languages,
  };
}

export const NATIVE_LANG_SEO = {
  en: {
    nativeName: "English",
    sourceNameEn: "English",
    keywords: ["english vocabulary game", "learn english words free", "english sentences practice"],
  },
  de: {
    nativeName: "Deutsch",
    sourceNameEn: "German",
    keywords: ["Deutsch Vokabeln lernen", "Vokabeltrainer Spiel kostenlos", "German vocabulary game", "learn German words"],
  },
  fr: {
    nativeName: "Français",
    sourceNameEn: "French",
    keywords: ["apprendre vocabulaire français", "jeu vocabulaire gratuit", "French vocabulary game", "learn French words"],
  },
  es: {
    nativeName: "Español",
    sourceNameEn: "Spanish",
    keywords: ["aprender vocabulario español", "juego de vocabulario gratis", "Spanish vocabulary game", "learn Spanish words"],
  },
  ru: {
    nativeName: "Русский",
    sourceNameEn: "Russian",
    keywords: ["учить слова игра", "тренажер словарного запаса", "Russian vocabulary game", "learn Russian words"],
  },
  ko: {
    nativeName: "한국어",
    sourceNameEn: "Korean",
    keywords: ["한국어 단어 게임", "영단어 암기 게임", "Korean vocabulary game", "learn Korean hangul words"],
  },
  pt: {
    nativeName: "Português (Brasil)",
    sourceNameEn: "Portuguese",
    keywords: [
      "curso de inglês do zero grátis",
      "curso de inglês explicado em português",
      "aprender vocabulário português",
      "aprender inglês jogando grátis",
      "jogo de vocabulário grátis",
      "vocabulário inglês ENEM e vestibular",
      "repetição espaçada vocabulário grátis",
      "aulas de inglês do zero passo a passo",
      "desmistificando a e an em inglês",
      "Portuguese vocabulary game",
      "learn Brazilian Portuguese",
    ],
  },
  el: {
    nativeName: "Ελληνικά",
    sourceNameEn: "Greek",
    keywords: ["εκμάθηση ελληνικού λεξιλογίου", "παιχνίδι λεξιλογίου", "Greek vocabulary game", "learn Greek words"],
  },
  it: {
    nativeName: "Italiano",
    sourceNameEn: "Italian",
    keywords: ["imparare vocaboli italiano", "gioco vocabolario gratis", "Italian vocabulary game", "learn Italian words"],
  },
  ja: {
    nativeName: "日本語",
    sourceNameEn: "Japanese",
    keywords: ["日本語 単語 ゲーム", "英単語 暗記 ゲーム 無料", "Japanese vocabulary game", "learn Japanese words kana"],
  },
  ar: {
    nativeName: "العربية",
    sourceNameEn: "Arabic",
    keywords: [
      "إتقان الإنجليزية خطوة بخطوة",
      "كورس تعلم اللغة الإنجليزية من الصفر بالعربية مجانا",
      "شرح أدوات التنكير a و an بالتفصيل",
      "تعلم المفردات العربية",
      "لعبة حفظ الكلمات مجانا",
      "Arabic vocabulary game",
      "learn Arabic words",
    ],
  },
  zh: {
    nativeName: "中文",
    sourceNameEn: "Chinese",
    keywords: ["中文词汇游戏", "免费背单词游戏", "Chinese vocabulary game", "learn Mandarin Chinese words"],
  },
};

export function buildLearnMetadata(pathway) {
  const isEnTarget = pathway.targetCode === "en";
  const native = NATIVE_LANG_SEO[pathway.sourceCode] || { nativeName: pathway.sourceNameTr, keywords: [] };
  const wordCount = countWords(pathway);

  const title =
    pathway.slug === "pt-en"
      ? `Curso de Inglês do Zero (Explicado em Português) & Vocabulário — ${pathway.labelEn}`
      : pathway.slug === "ar-en"
        ? `إتقان الإنجليزية خطوة بخطوة (${pathway.labelEn}) — دروس فيديو ومفردات`
        : isEnTarget
          ? `${pathway.labelEn} (${native.nativeName}) — Vocabulary & Sentences Game`
          : `${pathway.sourceNameTr} ${pathway.targetNameTr} (${native.nativeName}) — Kelime & Cümle Çalış`;

  const countHint =
    wordCount > 100
      ? isEnTarget
        ? `${wordCount.toLocaleString("en-US")}+ words. `
        : `${wordCount.toLocaleString("tr-TR")}+ kelime. `
      : "";

  const description =
    pathway.slug === "pt-en"
      ? `${countHint}Curso de Inglês do Zero (Explicado em Português — /videos/?playlist=pt-en) + 16 jogos arcade gratuitos para memorizar vocabulário e frases de Inglês e Português do Brasil (ENEM/Vestibular) com repetição espaçada — Memolandum.`
      : pathway.slug === "ar-en"
        ? `${countHint}إتقان الإنجليزية خطوة بخطوة (/videos/?playlist=ar-en) — دروس فيديو مجانية بالشرح العربي + 16 لعبة أركيد لحفظ المفردات والجمل الإنجليزية والعربية بالتكرار المتباعد — Memolandum.`
        : isEnTarget
          ? `${countHint}Master ${pathway.labelEn} (${native.nativeName}) vocabulary, phrases, and leveled packs with free arcade games. Spaced repetition, Word Vault & Instant Translation — Memolandum.`
          : `${countHint}${pathway.sourceNameTr}-${pathway.targetNameTr} (${native.nativeName}) dil anasayfası: kelime çalış, cümle / hızlı konuşma ve seviye paketleri. Ücretsiz arcade oyunlar ve aralıklı tekrar — Memolandum.`;

  const url = absoluteUrl(`/learn/${pathway.slug}/`);

  return {
    title,
    description,
    keywords: [
      ...native.keywords,
      `${pathway.sourceNameTr.toLowerCase()} kelime ezberleme`,
      `${pathway.sourceNameTr.toLowerCase()} ${pathway.targetNameTr.toLowerCase()} kelime`,
      `${pathway.labelEn.toLowerCase()} vocabulary`,
      `${pathway.sourceCode} ${pathway.targetCode} vocabulary game`,
      "kelime ezberleme oyunu",
      "vocabulary arcade game",
      "spaced repetition",
      "memolandum",
      "instant translation",
    ],
    alternates: getPathwayAlternates(pathway),
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale:
        pathway.sourceCode === "pt"
          ? "pt_BR"
          : pathway.sourceCode === "ar"
            ? "ar_SA"
            : isEnTarget
              ? "en_US"
              : "tr_TR",
      alternateLocale: ["tr_TR", "en_US", "pt_BR", "ar_SA"],
      type: "website",
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
    robots: { index: true, follow: true },
  };
}

export function buildLearnFaq(pathway) {
  const isEnTarget = pathway.targetCode === "en";
  const native = NATIVE_LANG_SEO[pathway.sourceCode] || { sourceNameEn: pathway.labelEn };
  const ptItems =
    pathway.sourceCode === "pt"
      ? [
          {
            question: "Onde assistir ao Curso de Inglês do Zero (Explicado em Português) no Memolandum?",
            answer:
              "Acesse https://memolandum.com/videos/?playlist=pt-en para assistir gratuitamente às videoaulas do 'Curso de Inglês do Zero (Explicado em Português)' (como 'Desmistificando A e An em Inglês: A Regra de Ouro + Quiz Prático') e pratique imediatamente nos 16 jogos arcade desta trilha (/learn/pt-en/).",
          },
          {
            question: "Como aprender vocabulário de Inglês e Português no Memolandum?",
            answer:
              "Escolha qualquer nível de vocabulário ou frases em /learn/pt-en/ ou /learn/pt-tr/ para jogar nos 16 jogos arcade gratuitos. As palavras são revisadas automaticamente com repetição espaçada (Memolandum Pulse) e podem ser salvas no seu Cofre de Palavras.",
          },
          {
            question: "O Memolandum é 100% gratuito e sem anúncios no Brasil?",
            answer:
              "Sim! Todos os 16 jogos arcade, videoaulas, níveis de vocabulário e frases, a interface em Português do Brasil (/pt/ e ?lang=pt), a Mesa do Professor (/schools) e o Boletim dos Pais (/veli-rehberi) são totalmente gratuitos e sem anúncios.",
          },
        ]
      : [];
  const arItems =
    pathway.sourceCode === "ar"
      ? [
          {
            question: "أين أشاهد سلسلة دروس الفيديو 'إتقان الإنجليزية خطوة بخطوة' بالشرح العربي؟",
            answer:
              "يمكنك مشاهدة دروس 'إتقان الإنجليزية خطوة بخطوة' (مثل شرح أدوات التنكير A و An بالتفصيل + اختبار قصير) مجاناً عبر https://memolandum.com/videos/?playlist=ar-en، ثم تطبيق القواعد والمفردات في 16 لعبة أركيد تفاعلية في مسار /learn/ar-en/.",
          },
          {
            question: "كيف أتعلم مفردات الإنجليزية والعربية في منصة Memolandum؟",
            answer:
              "اختر أي مستوى من مستويات المفردات أو الجمل في /learn/ar-en/ أو /learn/ar-tr/ للبدء فوراً في 16 لعبة أركيد مجانية وبدون إعلانات مع نظام التكرار المتباعد الذكي (Memolandum Pulse).",
          },
        ]
      : [];
  if (isEnTarget) {
    return [
      ...ptItems,
      ...arItems,
      {
        question: `How do I learn ${native.sourceNameEn} vocabulary on Memolandum?`,
        answer: `Pick any vocabulary or sentence level on the ${pathway.labelEn} pathway page to launch Retro Shooter or 15 other neon arcade shells. Words are scheduled with spaced repetition (Memolandum Pulse) and can be saved to your personal Word Vault.`,
      },
      {
        question: `Does the ${pathway.labelEn} pathway include sentence and speaking practice?`,
        answer: `Yes. The ${pathway.labelEn} hub includes thematic sentence and quick-speaking sets alongside CEFR / frequency vocabulary levels.`,
      },
      {
        question: `Is the ${pathway.labelEn} path free?`,
        answer:
          "Yes. All arcade games and levels are 100% free and ad-free. Gemini Instant Translation includes 10 free uses per member account, then Premium.",
      },
      {
        question: `${pathway.labelTr} ücretsiz mi?`,
        answer:
          "Evet. Tüm arcade oyunlar ve seviyeler ücretsizdir. Gemini Anlık Çeviri üye hesabında ilk 10 deneme ücretsizdir; sonrası Premium’dur.",
      },
    ];
  }
  return [
    ...ptItems,
    ...arItems,
    {
      question: `${pathway.sourceNameTr} kelimeleri Memolandum’da nasıl öğrenilir?`,
      answer: `${pathway.labelTr} dil anasayfasından Kelime çalış seviyesini seçin; Retro Shooter veya diğer arcade oyunlar açılır. Kelimeler spaced repetition (Memolandum Pulse) ile tekrarlanır; istediğinizi Kelime Kasası’na kaydedebilirsiniz.`,
    },
    {
      question: `Cümle / konuşma çalışması var mı?`,
      answer: `Evet. ${pathway.labelTr} sayfasında Cümle / hızlı konuşma bölümü (varsa) tematik cümle setlerini listeler. İngilizce yolunda Temel Cümleler, Yaz Cümleleri ve Genel İngilizce cümle temaları da bulunur.`,
    },
    {
      question: `${pathway.labelTr} ücretsiz mi?`,
      answer:
        "Evet. Tüm arcade oyunlar ve seviyeler ücretsizdir. Gemini Anlık Çeviri üye hesabında ilk 10 deneme ücretsizdir; sonrası Premium’dur.",
    },
    {
      question: `Is the ${pathway.labelEn} path free?`,
      answer:
        "Yes. All arcade games and levels are free. Gemini Instant Translation includes 10 free uses per member account, then Premium.",
    },
  ];
}

export function buildLearnJsonLd(pathway, samples = []) {
  const url = absoluteUrl(`/learn/${pathway.slug}/`);
  const faq = buildLearnFaq(pathway);
  const isEnTarget = pathway.targetCode === "en";
  const native = NATIVE_LANG_SEO[pathway.sourceCode] || { nativeName: pathway.sourceNameTr, sourceNameEn: pathway.sourceNameTr };
  const courseInstances = [
    {
      "@type": "CourseInstance",
      courseMode: "online",
      url: `${SITE_URL}/games/shooter/?pathway=${pathway.slug}`,
    },
  ];
  if (pathway.slug === "pt-en") {
    courseInstances.push({
      "@type": "CourseInstance",
      name: "Curso de Inglês do Zero (Explicado em Português) — Videoaulas",
      courseMode: "online",
      url: `${SITE_URL}/videos/?playlist=pt-en`,
    });
  } else if (pathway.slug === "ar-en") {
    courseInstances.push({
      "@type": "CourseInstance",
      name: "إتقان الإنجليزية خطوة بخطوة — دروس فيديو بالشرح العربي",
      courseMode: "online",
      url: `${SITE_URL}/videos/?playlist=ar-en`,
    });
  }

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Course",
      "@id": `${url}#course`,
      name:
        pathway.slug === "pt-en"
          ? "Curso de Inglês do Zero (Explicado em Português) & Vocabulário — Memolandum"
          : pathway.slug === "ar-en"
            ? "إتقان الإنجليزية خطوة بخطوة (Arabic → English) — Memolandum"
            : isEnTarget
              ? `${pathway.labelEn} (${native.nativeName}) Vocabulary — Memolandum`
              : `${pathway.labelTr} (${native.nativeName}) — Kelime Ezberleme | Memolandum`,
      alternateName: isEnTarget
        ? `${pathway.labelTr} — Kelime Ezberleme | Memolandum`
        : `${pathway.labelEn} Vocabulary — Memolandum`,
      description: isEnTarget ? pathway.introEn : pathway.introTr,
      url,
      provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      inLanguage: Array.from(new Set([pathway.sourceCode, pathway.targetCode, "tr", "en", "ar", "pt", "pt-BR"])),
      isAccessibleForFree: true,
      teaches: `${native.sourceNameEn || pathway.sourceNameTr} vocabulary (${native.nativeName})`,
      educationalLevel: "Beginner to Advanced",
      hasCourseInstance: courseInstances,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${url}#samples`,
      name: isEnTarget
        ? `${pathway.labelEn} — Sample vocabulary`
        : `${pathway.labelTr} — Örnek kelimeler`,
      numberOfItems: samples.length,
      itemListElement: samples.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: s.word,
        description: s.translation,
      })),
    },
  ];

  if (pathway.slug === "pt-en") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "@id": `${url}#video`,
      name: "Desmistificando 'A' e 'An' em Inglês: A Regra de Ouro + Quiz Prático! | Curso de Inglês do Zero",
      description:
        "Curso de Inglês do Zero (Explicado em Português): aprenda quando usar A e An em inglês com a Regra de Ouro baseada no som e quiz prático.",
      thumbnailUrl: ["https://i.ytimg.com/vi/29gI8-yEpYs/hqdefault.jpg"],
      uploadDate: "2026-10-26T14:17:39Z",
      contentUrl: "https://www.youtube.com/watch?v=29gI8-yEpYs&list=PLFty--cqLRvM",
      embedUrl: "https://www.youtube.com/embed/29gI8-yEpYs",
      inLanguage: "pt-BR",
    });
  } else if (pathway.slug === "ar-en") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "@id": `${url}#video`,
      name: "شرح أدوات التنكير A و An بالتفصيل + اختبار قصير | إتقان الإنجليزية خطوة بخطوة",
      description:
        "إتقان الإنجليزية خطوة بخطوة: شرح أدوات التنكير A و An بالتفصيل باللغة العربية مع أمثلة عملية واختبار قصير.",
      thumbnailUrl: ["https://i.ytimg.com/vi/qO9gvJyQwtY/hqdefault.jpg"],
      uploadDate: "2026-10-26T12:58:52Z",
      contentUrl: "https://www.youtube.com/watch?v=qO9gvJyQwtY&list=PLYtLXOnKlTVo",
      embedUrl: "https://www.youtube.com/embed/qO9gvJyQwtY",
      inLanguage: "ar",
    });
  }

  return schemas;
}

export function ctaGameUrl(pathway, game = "shooter", { levelId, langId } = {}) {
  const q = new URLSearchParams({ pathway: pathway.slug });
  if (langId) q.set("lang", langId);
  if (levelId) q.set("level", levelId);
  return absoluteUrl(`/games/${game}/?${q.toString()}`);
}
